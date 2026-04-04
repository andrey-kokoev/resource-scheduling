import {
  buildSampleBatchFlowSolution,
  compileSampleBatchFlow,
  createSampleBatchFlowModel,
  listBatchFlowSamples,
} from '../../packages/batch-flow-scheduling/dist/index.js';

function formatMs(ms) {
  if (ms === 0) return '0 min';
  const minutes = ms / 60_000;
  if (Number.isInteger(minutes)) {
    return `${minutes} min`;
  }
  return `${minutes.toFixed(1)} min`;
}

function renderTable(headers, rows) {
  const head = headers.map(header => `<th>${header}</th>`).join('');
  const body = rows
    .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderFailurePanel(currentSample, compiled) {
  const errorRows = compiled.errors.map(error => [
    error.type,
    error.path ?? 'n/a',
    error.message ?? 'Validation failed',
  ]);

  return `
    <section class="hero">
      <section class="hero-card">
        <p class="eyebrow">Batch Flow Scheduling Playground</p>
        <h1>Sample validation failed</h1>
        <p>
          This scenario is intentionally outside the current valid domain boundary. It is useful because it shows
          the package failing at validation time rather than pretending the model can compile.
        </p>
        <div class="docs-panel">
          <h2>Scenario</h2>
          <ul class="docs-list">
            <li><strong>${currentSample.label}</strong></li>
            <li>${currentSample.description}</li>
          </ul>
        </div>
        <div class="docs-panel">
          <h2>Docs</h2>
          <ul class="docs-list">
            <li><a href="./generated-docs/index.html">Docs hub</a></li>
            <li><a href="./generated-docs/001-what-this-is.html">What this is</a></li>
            <li><a href="./generated-docs/002-invariants.html">Invariants</a></li>
          </ul>
        </div>
      </section>
      <aside class="hero-card status-card">
        <h2>Compile result</h2>
        <p><span class="pill">Validation failure</span></p>
        <p style="margin-top:0.75rem;">
          ${compiled.errors.length} issue${compiled.errors.length === 1 ? '' : 's'} surfaced before graph derivation.
        </p>
      </aside>
    </section>

    <section class="grid">
      <section class="panel">
        <h2>Validation errors</h2>
        ${renderTable(['Type', 'Path', 'Message'], errorRows)}
      </section>

      <section class="panel">
        <h2>Why this matters</h2>
        <div class="stack">
          <div class="callout">
            <strong>Boundary honesty:</strong> this package rejects inconsistent processor assignments before any solver-neutral graph is emitted.
          </div>
          <div class="callout">
            <strong>Current case:</strong> a mix step was assigned to a filler machine, which violates processor-type compatibility.
          </div>
        </div>
      </section>
    </section>
  `;
}

function deriveScenarioHighlights(sampleId, compiled) {
  const { concreteBatchSteps, solverGraph } = compiled.compiled;
  const machineCount = solverGraph.machineCapacityGroups.length;
  const batchEdgeCount = solverGraph.batchTemporalEdges.length;
  const transitionCount = solverGraph.machineTransitionCosts.length;
  const noOverlapCount = solverGraph.machineNoOverlapPairs.length;

  if (sampleId === 'changeover-pressure') {
    const mixerCosts = solverGraph.machineTransitionCosts.filter(cost => cost.machineId === 'mx-1');
    const maxGap = mixerCosts.reduce((max, cost) => Math.max(max, cost.minGapMs), 0);
    return {
      title: 'Why this sample matters',
      items: [
        `One mixer now carries two different products, so machine no-overlap and changeover costs act on the same pair of steps.`,
        `The strongest projected changeover on mx-1 is ${formatMs(maxGap)}.`,
        `This is the first sample where transition costs are not just present in the graph but structurally important.`,
      ],
    };
  }

  if (sampleId === 'shared-filler') {
    const fillerPairs = solverGraph.machineNoOverlapPairs.filter(pair => pair.machineId === 'fl-1').length;
    return {
      title: 'Why this sample matters',
      items: [
        `Two batches compete for the same filler, so machine no-overlap is doing real work instead of staying trivial.`,
        `Filler 1 now carries ${fillerPairs} projected no-overlap pair${fillerPairs === 1 ? '' : 's'}.`,
        `This is the clearest bottleneck sample in the current catalog.`,
      ],
    };
  }

  if (sampleId === 'second-line') {
    const fillerGroups = solverGraph.machineCapacityGroups.filter(group => group.machineId.startsWith('fl-')).length;
    return {
      title: 'Why this sample matters',
      items: [
        `The package now has alternate machine eligibility across ${fillerGroups} filler lines.`,
        `This widens the graph without increasing batch count pressure much.`,
        `It is the cleanest routing-diversity example in the current catalog.`,
      ],
    };
  }

  if (sampleId === 'tight-max-lag') {
    const constrainedEdge = solverGraph.batchTemporalEdges.find(edge => edge.maxGapMs !== undefined);
    return {
      title: 'Why this sample matters',
      items: [
        `The route stays the same, but the temporal window gets tighter.`,
        constrainedEdge
          ? `The most visible max-gap is ${formatMs(constrainedEdge.maxGapMs)} between consecutive steps of the same batch.`
          : 'This makes batch-local max-gap constraints more informative than the base sample.',
      ],
    };
  }

  if (sampleId === 'multi-batch') {
    return {
      title: 'Why this sample matters',
      items: [
        `A second batch and second mixer widen the graph while keeping the plant shape simple.`,
        `This sample projects ${concreteBatchSteps.length} concrete steps across ${machineCount} machine groups.`,
        `It is the cleanest first step beyond the single-batch baseline.`,
      ],
    };
  }

  if (sampleId === 'interleaving-plant') {
    return {
      title: 'Why this sample matters',
      items: [
        `Multiple processor families now interleave across the same horizon: mixers, reactors, coolers, and fillers.`,
        `The compiled graph has ${concreteBatchSteps.length} concrete steps, ${batchEdgeCount} batch-local edges, and ${noOverlapCount} machine no-overlap pairs.`,
        `This is the first truly plant-like sample rather than a focused pressure case.`,
      ],
    };
  }

  if (sampleId === 'expanded-multiproduct-plant') {
    return {
      title: 'Why this sample matters',
      items: [
        `This is the largest catalog example, with multiple product families moving through reactors, coolers, fillers, and packagers.`,
        `The compiled graph has ${concreteBatchSteps.length} concrete steps and ${transitionCount} projected transition costs.`,
        `It is the best current sample for understanding the package as a plant-wide batch-flow projection surface.`,
      ],
    };
  }

  return {
    title: 'Why this sample matters',
    items: [
      `This is the baseline reference shape for the package: one batch, one route, one complete schedule.`,
      `It projects ${concreteBatchSteps.length} concrete steps with ${batchEdgeCount} batch-local edge${batchEdgeCount === 1 ? '' : 's'}.`,
    ],
  };
}

function getTransitionRows(sampleId, solverGraph) {
  const sorted = [...solverGraph.machineTransitionCosts].sort((left, right) => {
    if (right.minGapMs !== left.minGapMs) return right.minGapMs - left.minGapMs;
    if (left.machineId !== right.machineId) return left.machineId.localeCompare(right.machineId);
    if (left.fromNodeId !== right.fromNodeId) return left.fromNodeId.localeCompare(right.fromNodeId);
    return left.toNodeId.localeCompare(right.toNodeId);
  });

  const rows = sampleId === 'changeover-pressure'
    ? sorted.filter(cost => cost.machineId === 'mx-1')
    : sorted;

  return rows.slice(0, 8).map(cost => [
    cost.machineId,
    `<code>${cost.fromNodeId}</code>`,
    `<code>${cost.toNodeId}</code>`,
    formatMs(cost.minGapMs),
  ]);
}

function render() {
  const app = document.getElementById('app');
  const samples = listBatchFlowSamples();
  const currentSampleId = new URLSearchParams(window.location.search).get('sample') ?? samples[0].id;
  const currentSample = samples.find(sample => sample.id === currentSampleId) ?? samples[0];
  const model = createSampleBatchFlowModel(currentSample.id);
  const compiled = compileSampleBatchFlow(currentSample.id);

  if (!compiled.ok) {
    app.innerHTML = renderFailurePanel(currentSample, compiled);
    return;
  }

  const solution = buildSampleBatchFlowSolution(currentSample.id);
  const { concreteBatchSteps, solverGraph, constraintModel } = compiled.compiled;
  const scenarioHighlights = deriveScenarioHighlights(currentSample.id, compiled);
  const transitionRows = getTransitionRows(currentSample.id, solverGraph);
  const sampleOptions = samples
    .map(sample => `<option value="${sample.id}" ${sample.id === currentSample.id ? 'selected' : ''}>${sample.label}</option>`)
    .join('');

  app.innerHTML = `
    <section class="hero">
      <section class="hero-card">
        <p class="eyebrow">Batch Flow Scheduling Playground</p>
        <h1>Sample Batch Flow Model</h1>
        <p>
          This is the first thin public surface for the batch-flow track. It shows one concrete sample,
          the compiled solver-neutral graph, and the stable solution shape that future solver backends should target.
        </p>
        <div class="docs-panel">
          <h2>Docs</h2>
          <ul class="docs-list">
            <li><a href="./generated-docs/index.html">Docs hub</a></li>
            <li><a href="./generated-docs/001-what-this-is.html">What this is</a></li>
            <li><a href="./generated-docs/002-invariants.html">Invariants</a></li>
            <li><a href="./generated-docs/003-solver-graph.html">Solver graph</a></li>
          </ul>
        </div>
        <div class="sample-picker">
          <label for="sample-select">Scenario</label>
          <select id="sample-select">${sampleOptions}</select>
        </div>
        <p class="sample-description">${currentSample.description}</p>
        <div class="docs-panel">
          <h2>${scenarioHighlights.title}</h2>
          <ul class="docs-list">
            ${scenarioHighlights.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
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
        <h2>Projected transition costs</h2>
        ${
          transitionRows.length > 0
            ? renderTable(
                ['Machine', 'From', 'To', 'Min gap'],
                transitionRows,
              )
            : '<p>No projected transition costs for this sample.</p>'
        }
      </section>
    </section>

    <section class="grid">
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

  const select = document.getElementById('sample-select');
  select.addEventListener('change', event => {
    const nextSampleId = event.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set('sample', nextSampleId);
    window.location.href = url.toString();
  });
}

render();
