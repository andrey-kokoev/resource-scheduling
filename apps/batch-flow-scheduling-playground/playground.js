import {
  buildSampleBatchFlowSolution,
  compileSampleBatchFlow,
  createSampleBatchFlowModel,
} from '../../packages/batch-flow-scheduling/dist/index.js';

function formatMs(ms) {
  return `${Math.round(ms / 1000)}s`;
}

function renderTable(headers, rows) {
  const head = headers.map(header => `<th>${header}</th>`).join('');
  const body = rows
    .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function render() {
  const app = document.getElementById('app');
  const model = createSampleBatchFlowModel();
  const compiled = compileSampleBatchFlow();

  if (!compiled.ok) {
    app.innerHTML = `
      <section class="hero-card">
        <p class="eyebrow">Batch Flow Scheduling Playground</p>
        <h1>Sample compilation failed</h1>
        <p>The package-level sample should compile. It currently reports: <code>${compiled.errors.map(error => error.type).join(', ')}</code></p>
      </section>
    `;
    return;
  }

  const solution = buildSampleBatchFlowSolution();
  const { concreteBatchSteps, solverGraph, constraintModel } = compiled.compiled;

  app.innerHTML = `
    <section class="hero">
      <section class="hero-card">
        <p class="eyebrow">Batch Flow Scheduling Playground</p>
        <h1>Sample Batch Flow Model</h1>
        <p>
          This is the first thin public surface for the batch-flow track. It shows one concrete sample,
          the compiled solver-neutral graph, and the stable solution shape that future solver backends should target.
        </p>
      </section>
      <aside class="hero-card status-card">
        <h2>Current state</h2>
        <p><span class="pill">No solver yet</span></p>
        <p style="margin-top:0.75rem;">
          What exists is the domain, compile boundary, neutral constraint model, and neutral solution target.
        </p>
      </aside>
    </section>

    <section class="grid">
      <section class="panel">
        <h2>Sample model</h2>
        <div class="metrics">
          <div class="metric"><strong>${model.processorInstances.length}</strong><span>processor instances</span></div>
          <div class="metric"><strong>${model.batchTypes.length}</strong><span>batch types</span></div>
          <div class="metric"><strong>${model.batches.length}</strong><span>batches</span></div>
        </div>
        <div class="stack" style="margin-top:1rem;">
          <div class="callout">
            <strong>Route:</strong> ${model.batchTypes[0].route.map(step => `${step.sequence}. ${step.name}`).join(' → ')}
          </div>
          <div class="callout">
            <strong>Release / due:</strong> ${formatMs(model.batches[0].releaseTimeMs ?? 0)} → ${formatMs(model.batches[0].dueTimeMs ?? 0)}
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>Compiled graph</h2>
        <div class="metrics">
          <div class="metric"><strong>${concreteBatchSteps.length}</strong><span>concrete batch steps</span></div>
          <div class="metric"><strong>${solverGraph.nodes.length}</strong><span>solver nodes</span></div>
          <div class="metric"><strong>${constraintModel.constraints.length}</strong><span>constraints</span></div>
        </div>
        <div class="stack" style="margin-top:1rem;">
          <div class="callout">
            <strong>Batch edges:</strong> ${solverGraph.batchTemporalEdges.length}
          </div>
          <div class="callout">
            <strong>Machine no-overlap pairs:</strong> ${solverGraph.machineNoOverlapPairs.length}
          </div>
          <div class="callout">
            <strong>Transition costs:</strong> ${solverGraph.machineTransitionCosts.length}
          </div>
        </div>
      </section>
    </section>

    <section class="grid">
      <section class="panel">
        <h2>Concrete batch steps</h2>
        ${renderTable(
          ['Step', 'Batch', 'Route step', 'Processor type', 'Duration'],
          concreteBatchSteps.map(step => [
            `<code>${step.id}</code>`,
            step.batchId,
            `${step.sequence}. ${step.name}`,
            step.requiredProcessorTypeId,
            formatMs(step.durationMs),
          ]),
        )}
      </section>

      <section class="panel">
        <h2>Constraint model</h2>
        ${renderTable(
          ['Kind', 'Scope', 'Key data'],
          constraintModel.constraints.slice(0, 8).map(constraint => [
            constraint.kind,
            constraint.nodeId ?? constraint.machineId ?? `${constraint.fromNodeId ?? constraint.leftNodeId} → ${constraint.toNodeId ?? constraint.rightNodeId}`,
            constraint.durationMs !== undefined
              ? `duration ${formatMs(constraint.durationMs)}`
              : constraint.minGapMs !== undefined
                ? `min gap ${formatMs(constraint.minGapMs)}`
                : constraint.maxGapMs !== undefined
                  ? `max gap ${formatMs(constraint.maxGapMs)}`
                  : `${constraint.variableIds.length} vars`,
          ]),
        )}
      </section>
    </section>

    <section class="grid">
      <section class="panel">
        <h2>Stable solution shape</h2>
        ${renderTable(
          ['Step', 'Machine', 'Route', 'Start', 'End'],
          solution.scheduledSteps.map(step => [
            `<code>${step.id}</code>`,
            step.processorInstanceId,
            step.routeStepName,
            formatMs(step.startMs),
            formatMs(step.endMs),
          ]),
        )}
      </section>

      <section class="panel">
        <h2>Machine timelines</h2>
        ${renderTable(
          ['Machine', 'Step', 'Batch', 'Window'],
          solution.machineTimelines.map(item => [
            item.machineId,
            item.routeStepName,
            item.batchId,
            `${formatMs(item.startMs)} → ${formatMs(item.endMs)}`,
          ]),
        )}
      </section>
    </section>
  `;
}

render();
