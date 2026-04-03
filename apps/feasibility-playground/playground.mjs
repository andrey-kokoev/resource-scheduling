import {
  getSampleScenario,
  hydrateScenario,
  samplePlantScenarioText,
  sampleScenarios,
  summarizeScenario,
} from './scenario.mjs';
import { evaluateScenario } from './evaluator.mjs';

const editor = document.getElementById('scenario-json');
const resultPanel = document.getElementById('result');
const summaryPanel = document.getElementById('scenario-summary');
const sampleScenarioSelect = document.getElementById('sample-scenario');
const status = document.getElementById('status');
const runButton = document.getElementById('run-scenario');

function renderScenarioSummary(summary, selectedSample) {
  const ruleFamilies = summary.ruleFamilies.length > 0 ? summary.ruleFamilies.join(', ') : 'none';
  const scopeBits = [
    summary.scopedCoverage.siteScoped ? 'site-scoped coverage' : null,
    summary.scopedCoverage.lineScoped ? 'line-scoped coverage' : null,
  ].filter(Boolean);
  const scopeText = scopeBits.length > 0 ? scopeBits.join(', ') : 'no scoped coverage rules';

  return `
    <div>
      <span class="pill ok">${escapeHtml(selectedSample?.label ?? 'Sample plant loaded')}</span>
      <p class="hint">${escapeHtml(selectedSample?.description ?? 'This scenario is designed to pressure-test the kernel, not model a full plant.')}</p>
      <ul>
        <li>${summary.siteCount} site${summary.siteCount === 1 ? '' : 's'}</li>
        <li>${summary.lineCount} line${summary.lineCount === 1 ? '' : 's'}</li>
        <li>${summary.shiftCount} shift${summary.shiftCount === 1 ? '' : 's'}</li>
        <li>${summary.needCount} need${summary.needCount === 1 ? '' : 's'}</li>
        <li>${summary.candidateCount} candidate${summary.candidateCount === 1 ? '' : 's'}</li>
        <li>Rule families: ${escapeHtml(ruleFamilies)}</li>
        <li>Coverage scope: ${escapeHtml(scopeText)}</li>
      </ul>
    </div>
  `;
}

function renderError(message) {
  resultPanel.innerHTML = `
    <div>
      <span class="pill bad">Invalid scenario</span>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderAssignments(assignments) {
  const rows = assignments.map(row => `
    <tr>
      <td>${escapeHtml(row.candidateName)}</td>
      <td>${escapeHtml(row.siteName)}</td>
      <td>${escapeHtml(row.lineName)}</td>
      <td>${escapeHtml(row.shiftId)} / ${escapeHtml(row.shiftDate)}</td>
      <td>${escapeHtml(row.positionName)}</td>
    </tr>
  `).join('');

  resultPanel.innerHTML = `
    <div>
      <span class="pill ok">Feasible result</span>
      <p class="hint">The solver found a complete non-violating assignment set for the sample plant.</p>
      <p class="hint">Each row shows the candidate, where they are assigned, and which role they cover.</p>
      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Site</th>
            <th>Line</th>
            <th>Shift</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderRepairAssignments(assignments) {
  if (assignments.length === 0) {
    return '';
  }

  const rows = assignments.map(row => `
    <tr>
      <td>${escapeHtml(row.candidateName)}</td>
      <td>${escapeHtml(row.siteName)}</td>
      <td>${escapeHtml(row.lineName)}</td>
      <td>${escapeHtml(row.shiftId)} / ${escapeHtml(row.shiftDate)}</td>
      <td>${escapeHtml(row.positionName)}</td>
    </tr>
  `).join('');

  return `
    <section class="need-card">
      <h3>Final assignments</h3>
      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Site</th>
            <th>Line</th>
            <th>Shift</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderRepairAssignmentDiff(report) {
  if (!report.assignmentDiff || report.assignmentDiff.length === 0) {
    return `
      <section class="need-card">
        <h3>Baseline vs final assignments</h3>
        <p class="hint">No assignment-level diff is available.</p>
      </section>
    `;
  }

  const rows = report.assignmentDiff.map(item => `
    <tr>
      <td>${escapeHtml(item.demandUnitId)}</td>
      <td>${escapeHtml(item.baselineAgentId ?? 'n/a')}</td>
      <td>${escapeHtml(item.finalAgentId ?? 'n/a')}</td>
      <td>${escapeHtml(item.status)}</td>
    </tr>
  `).join('');

  return `
    <section class="need-card">
      <h3>Baseline vs final assignments</h3>
      <table>
        <thead>
          <tr>
            <th>Demand unit</th>
            <th>Baseline agent</th>
            <th>Final agent</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderRepairReport(report, repairResult, assignments) {
  const attemptItems = repairResult.attempts.map(attempt => `
    <li>
      <span class="pill ${attempt.outcome === 'feasible' ? 'ok' : 'bad'}">${escapeHtml(attempt.stage)}</span>
      ${escapeHtml(attempt.outcome)}
    </li>
  `).join('');

  const assignmentList = (items, emptyText) => {
    if (items.length === 0) {
      return `<p class="hint">${escapeHtml(emptyText)}</p>`;
    }

    return `
      <ul>
        ${items.map(item => `
          <li>
            ${escapeHtml(item.assignmentId)} · ${escapeHtml(item.agentId)} → ${escapeHtml(item.demandUnitId)}
          </li>
        `).join('')}
      </ul>
    `;
  };

  const needList = report.needs.length === 0
    ? '<p class="hint">No open or infeasible needs remain after the selected stage.</p>'
    : `
      <ul>
        ${report.needs.map(need => `
          <li>
            ${escapeHtml(need.needId)} · ${escapeHtml(need.status)} · ${escapeHtml(String(need.coveredCount))}/${escapeHtml(String(need.requiredCount))} covered
          </li>
        `).join('')}
      </ul>
    `;

  resultPanel.innerHTML = `
    <div>
      <span class="pill ${report.outcome === 'feasible' ? 'ok' : 'bad'}">${report.outcome === 'feasible' ? 'Repair feasible' : 'Repair infeasible'}</span>
      <p class="hint">This sample runs the public baseline-repair API rather than the direct solve path.</p>
      <section class="need-card">
        <h3>Repair summary</h3>
        <ul>
          <li>Selected stage: ${escapeHtml(report.selectedStage)}</li>
          <li>Outcome: ${escapeHtml(report.outcome)}</li>
          <li>Preserved assignments: ${escapeHtml(String(report.preservedAssignments.length))}</li>
          <li>Degraded assignments: ${escapeHtml(String(report.degradedAssignments.length))}</li>
          <li>Released assignments: ${escapeHtml(String(report.releasedAssignments.length))}</li>
        </ul>
      </section>
      <section class="need-card">
        <h3>Repair ladder</h3>
        <ul>${attemptItems}</ul>
      </section>
      <section class="need-card">
        <h3>Preserved exactly</h3>
        ${assignmentList(report.preservedAssignments, 'No copied baseline assignments were preserved exactly.')}
      </section>
      <section class="need-card">
        <h3>Degraded or relaxed</h3>
        ${assignmentList(report.degradedAssignments, 'No copied baseline assignments were degraded at the selected stage.')}
      </section>
      <section class="need-card">
        <h3>Released</h3>
        ${assignmentList(report.releasedAssignments, 'No copied baseline assignments were fully released.')}
      </section>
      <section class="need-card">
        <h3>Remaining needs</h3>
        ${needList}
      </section>
      ${renderRepairAssignmentDiff(report)}
      ${renderRepairAssignments(assignments)}
    </div>
  `;
}

function explanationNeedIds(explanation, raw) {
  switch (explanation.type) {
    case 'no-eligible-candidate':
    case 'unfilled-need':
    case 'availability-conflict':
    case 'shift-pattern-conflict':
      return [explanation.needId];
    case 'insufficient-rest':
      return raw.needs.filter(need => need.shiftId === explanation.laterShiftId).map(need => need.id);
    case 'consecutive-days-violation':
      return raw.needs.filter(need => need.shiftId === explanation.attemptedShiftId).map(need => need.id);
    case 'coverage-conflict':
      return explanation.affectedNeedIds;
    default:
      return [];
  }
}

function explanationPriority(explanation) {
  switch (explanation.type) {
    case 'unfilled-need':
      return 0;
    case 'no-eligible-candidate':
      return 1;
    case 'coverage-conflict':
      return 2;
    case 'availability-conflict':
      return 3;
    case 'shift-pattern-conflict':
      return 4;
    case 'insufficient-rest':
      return 5;
    case 'consecutive-days-violation':
      return 6;
    default:
      return 7;
  }
}

function getNeedLabel(raw, needId) {
  const need = raw.needs.find(item => item.id === needId);
  const shift = raw.shifts.find(item => item.id === need?.shiftId);
  const position = raw.positions.find(item => item.id === need?.positionId);
  const line = raw.lines?.find(item => item.id === need?.lineId);
  return {
    needId,
    shiftId: need?.shiftId ?? 'unknown',
    shiftDate: shift?.date ?? 'unknown',
    positionName: position?.name ?? need?.positionId ?? 'unknown',
    lineName: line?.name ?? 'shift-wide',
    count: need?.count ?? 0,
  };
}

function getQualificationNames(raw, qualificationIds) {
  const names = qualificationIds.map(id => raw.qualificationTypes.find(item => item.id === id)?.name ?? id);
  return names.join(', ');
}

function renderPrimaryNeedSummary(explanation, raw) {
  switch (explanation.type) {
    case 'no-eligible-candidate': {
      const label = getNeedLabel(raw, explanation.needId);
      const qualificationNames = explanation.requiredQualifications.length > 0
        ? getQualificationNames(raw, explanation.requiredQualifications)
        : 'the required qualifications';
      const candidatesText = explanation.candidatesChecked === 1 ? '1 candidate was checked' : `${explanation.candidatesChecked} candidates were checked`;

      return `
        <p class="hint">
          ${escapeHtml(label.positionName)} on shift ${escapeHtml(label.shiftId)} could not be staffed.
          No candidate satisfied ${escapeHtml(qualificationNames)} for this need.
        </p>
        <p class="hint">${escapeHtml(candidatesText)}.</p>
        <details class="debug-details">
          <summary>Debug details</summary>
          <ul>
            <li>Need: ${escapeHtml(explanation.needId)}</li>
            <li>Shift: ${escapeHtml(label.shiftId)} / ${escapeHtml(label.shiftDate)}</li>
            <li>Role: ${escapeHtml(label.positionName)}</li>
            <li>Required qualifications: ${escapeHtml(explanation.requiredQualifications.join(', ') || 'none')}</li>
            <li>Reason code: ${escapeHtml(explanation.reason)}</li>
          </ul>
        </details>
      `;
    }
    case 'coverage-conflict':
      return `
        <p class="hint">Coverage rule <strong>${escapeHtml(explanation.ruleId)}</strong> is unsatisfied.</p>
        <ul>
          <li>Shift: ${escapeHtml(explanation.shiftId)}</li>
          <li>Scope: ${escapeHtml(explanation.siteId ?? explanation.lineId ?? 'shift-wide')}</li>
          <li>Need ids: ${escapeHtml(explanation.affectedNeedIds.join(', '))}</li>
          <li>Coverage type: ${escapeHtml(explanation.coverageType)}</li>
        </ul>
      `;
    case 'availability-conflict':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> is blocked by availability.</p>
        <ul>
          <li>Need: ${escapeHtml(explanation.needId)}</li>
          <li>Shift: ${escapeHtml(explanation.shiftId)}</li>
          <li>Reason: ${escapeHtml(explanation.conflictKind)}</li>
          <li>Note: ${escapeHtml(explanation.reason ?? 'none')}</li>
        </ul>
      `;
    case 'shift-pattern-conflict':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> violates a shift-pattern rule.</p>
        <ul>
          <li>Need: ${escapeHtml(explanation.needId)}</li>
          <li>Shift: ${escapeHtml(explanation.shiftId)}</li>
          <li>Rule: ${escapeHtml(explanation.ruleType)}</li>
        </ul>
      `;
    case 'utilization-max-violation':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> would exceed the rolling max.</p>
        <ul>
          <li>Window: ${escapeHtml(String(explanation.windowDays))} days</li>
          <li>Limit: ${escapeHtml(String(explanation.maxAllowed))}</li>
          <li>Would have: ${escapeHtml(String(explanation.wouldHave))}</li>
          <li>Affected shifts: ${escapeHtml(explanation.affectedShiftIds.join(', '))}</li>
        </ul>
      `;
    case 'insufficient-rest':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> needs more rest before the later shift can be assigned.</p>
        <ul>
          <li>Earlier shift: ${escapeHtml(explanation.earlierShiftId)}</li>
          <li>Later shift: ${escapeHtml(explanation.laterShiftId)}</li>
          <li>Required rest: ${escapeHtml(String(explanation.requiredRestHours))} hours</li>
          <li>Actual gap: ${escapeHtml(String(explanation.actualRestHours))} hours</li>
          <li>Shortfall: ${escapeHtml(String(explanation.deficitHours))} hours</li>
        </ul>
      `;
    case 'consecutive-days-violation':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> would exceed the consecutive-work limit.</p>
        <ul>
          <li>Attempted shift: ${escapeHtml(explanation.attemptedShiftId)}</li>
          <li>Attempted date: ${escapeHtml(explanation.attemptedDate)}</li>
          <li>Allowed max: ${escapeHtml(String(explanation.allowedMax))} days</li>
          <li>Actual run: ${escapeHtml(String(explanation.actualDays))} days</li>
          <li>Run dates: ${escapeHtml(explanation.dates.join(', '))}</li>
        </ul>
      `;
    default:
      return `<pre>${escapeHtml(JSON.stringify(explanation, null, 2))}</pre>`;
  }
}

function renderSupportingCause(explanation) {
  switch (explanation.type) {
    case 'coverage-conflict':
      return `
        <p class="hint">Coverage rule <strong>${escapeHtml(explanation.ruleId)}</strong> is unsatisfied.</p>
        <ul>
          <li>Shift: ${escapeHtml(explanation.shiftId)}</li>
          <li>Scope: ${escapeHtml(explanation.siteId ?? explanation.lineId ?? 'shift-wide')}</li>
          <li>Need ids: ${escapeHtml(explanation.affectedNeedIds.join(', '))}</li>
          <li>Coverage type: ${escapeHtml(explanation.coverageType)}</li>
        </ul>
      `;
    case 'availability-conflict':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> is blocked by availability.</p>
        <ul>
          <li>Need: ${escapeHtml(explanation.needId)}</li>
          <li>Shift: ${escapeHtml(explanation.shiftId)}</li>
          <li>Reason: ${escapeHtml(explanation.conflictKind)}</li>
          <li>Note: ${escapeHtml(explanation.reason ?? 'none')}</li>
        </ul>
      `;
    case 'shift-pattern-conflict':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> violates a shift-pattern rule.</p>
        <ul>
          <li>Need: ${escapeHtml(explanation.needId)}</li>
          <li>Shift: ${escapeHtml(explanation.shiftId)}</li>
          <li>Rule: ${escapeHtml(explanation.ruleType)}</li>
        </ul>
      `;
    case 'utilization-max-violation':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> would exceed the rolling max.</p>
        <ul>
          <li>Window: ${escapeHtml(String(explanation.windowDays))} days</li>
          <li>Limit: ${escapeHtml(String(explanation.maxAllowed))}</li>
          <li>Would have: ${escapeHtml(String(explanation.wouldHave))}</li>
          <li>Affected shifts: ${escapeHtml(explanation.affectedShiftIds.join(', '))}</li>
        </ul>
      `;
    case 'insufficient-rest':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> needs more rest before the later shift can be assigned.</p>
        <ul>
          <li>Earlier shift: ${escapeHtml(explanation.earlierShiftId)}</li>
          <li>Later shift: ${escapeHtml(explanation.laterShiftId)}</li>
          <li>Required rest: ${escapeHtml(String(explanation.requiredRestHours))} hours</li>
          <li>Actual gap: ${escapeHtml(String(explanation.actualRestHours))} hours</li>
          <li>Shortfall: ${escapeHtml(String(explanation.deficitHours))} hours</li>
        </ul>
      `;
    case 'consecutive-days-violation':
      return `
        <p class="hint">Candidate <strong>${escapeHtml(explanation.candidateId)}</strong> would exceed the consecutive-work limit.</p>
        <ul>
          <li>Attempted shift: ${escapeHtml(explanation.attemptedShiftId)}</li>
          <li>Attempted date: ${escapeHtml(explanation.attemptedDate)}</li>
          <li>Allowed max: ${escapeHtml(String(explanation.allowedMax))} days</li>
          <li>Actual run: ${escapeHtml(String(explanation.actualDays))} days</li>
          <li>Run dates: ${escapeHtml(explanation.dates.join(', '))}</li>
        </ul>
      `;
    default:
      return `<pre>${escapeHtml(JSON.stringify(explanation, null, 2))}</pre>`;
  }
}

function formatExplanation(explanation, raw) {
  if (explanation.type === 'no-eligible-candidate') {
    return renderPrimaryNeedSummary(explanation, raw);
  }

  switch (explanation.type) {
    case 'coverage-conflict':
    case 'availability-conflict':
    case 'shift-pattern-conflict':
    case 'utilization-max-violation':
    case 'insufficient-rest':
    case 'consecutive-days-violation':
      return renderSupportingCause(explanation);
    default:
      return `<pre>${escapeHtml(JSON.stringify(explanation, null, 2))}</pre>`;
  }
}

function renderNeedCenteredFailureSections(explanations, raw) {
  const groups = new Map();
  const uncategorized = [];
  const needIndexById = new Map(raw.needs.map((need, index) => [need.id, index]));

  for (const explanation of explanations) {
    const needIds = explanationNeedIds(explanation, raw);
    if (needIds.length === 0) {
      uncategorized.push(explanation);
      continue;
    }

    for (const needId of needIds) {
      const group = groups.get(needId) ?? {
        needId,
        reasons: [],
      };
      group.reasons.push(explanation);
      groups.set(needId, group);
    }
  }

  const sections = Array.from(groups.values())
    .sort((a, b) => {
      return (needIndexById.get(a.needId) ?? 0) - (needIndexById.get(b.needId) ?? 0);
    })
    .map(group => {
      const label = getNeedLabel(raw, group.needId);
      const sortedReasons = [...group.reasons].sort((a, b) => explanationPriority(a) - explanationPriority(b));
      const primary = sortedReasons[0];
      const supporting = sortedReasons.slice(1);

    return `
        <section class="need-card">
          <h3>Failed need ${escapeHtml(label.needId)}</h3>
          <p class="hint">
            ${escapeHtml(label.shiftId)} on ${escapeHtml(label.shiftDate)} · ${escapeHtml(label.positionName)} · ${label.count} required
            · ${escapeHtml(label.lineName)}
          </p>
          <div class="need-primary">
            <span class="pill bad">${escapeHtml(primary.type)}</span>
            ${formatExplanation(primary, raw)}
          </div>
          ${supporting.length > 0 ? `
            <div class="need-support">
              <h4>Supporting causes</h4>
              <ul>
                ${supporting.map(reason => `
                  <li>
                    <span class="pill">${escapeHtml(reason.type)}</span>
                    ${formatExplanation(reason, raw)}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </section>
      `;
    }).join('');

  const fallback = uncategorized.length > 0 ? `
    <section class="need-card">
      <h3>Unattached explanations</h3>
      <p class="hint">These explanations do not map cleanly to a failed need, so they are shown after the need-centered results.</p>
      <ul>
        ${uncategorized.map(reason => `
          <li>
            <span class="pill">${escapeHtml(reason.type)}</span>
            ${formatExplanation(reason, raw)}
          </li>
        `).join('')}
      </ul>
    </section>
  ` : '';

  return sections + fallback;
}

function renderExplanations(explanations, raw) {
  const sections = renderNeedCenteredFailureSections(explanations, raw);

  resultPanel.innerHTML = `
    <div>
      <span class="pill bad">Infeasible result</span>
      <p class="hint">The solver could not find a complete non-violating assignment set for the sample plant.</p>
      <p class="hint">The view is centered on failed needs first, with candidate-level blockers nested as supporting causes.</p>
      ${sections}
    </div>
  `;
}

function renderCurrentScenarioSummary(raw, selectedSample) {
  summaryPanel.innerHTML = renderScenarioSummary(summarizeScenario(raw), selectedSample);
}

function setScenarioText(text, sampleId) {
  editor.value = text;
  const selectedSample = getSampleScenario(sampleId);
  sampleScenarioSelect.value = selectedSample.id;
  renderCurrentScenarioSummary(JSON.parse(text), selectedSample);
  status.textContent = `${selectedSample.label} loaded.`;
}

async function run() {
  status.textContent = 'Evaluating scenario...';
  resultPanel.innerHTML = '<p class="hint">Running the hard-feasibility kernel...</p>';

  try {
    const raw = JSON.parse(editor.value);
    const input = hydrateScenario(raw);
    const evaluation = await evaluateScenario(input);
    const summary = summarizeScenario(raw);
    const selectedSample = getSampleScenario(sampleScenarioSelect.value);

    if (evaluation.output.kind === 'repair') {
      status.textContent = `${evaluation.output.repairReport.outcome === 'feasible' ? 'Repair feasible' : 'Repair infeasible'}: selected stage ${evaluation.output.repairReport.selectedStage}.`;
      summaryPanel.innerHTML = renderScenarioSummary(summary, selectedSample);
      renderRepairReport(
        evaluation.output.repairReport,
        evaluation.output.repairResult,
        evaluation.output.assignments,
      );
    } else if (evaluation.output.kind === 'feasible') {
      status.textContent = `Feasible: ${evaluation.output.assignments.length} assignments across ${summary.shiftCount} shifts.`;
      summaryPanel.innerHTML = renderScenarioSummary(summary, selectedSample);
      renderAssignments(evaluation.output.assignments);
    } else {
      status.textContent = `Infeasible: ${evaluation.output.explanations.length} regrouped explanations.`;
      summaryPanel.innerHTML = renderScenarioSummary(summary, selectedSample);
      renderExplanations(evaluation.output.explanations, raw);
    }
  } catch (error) {
    status.textContent = 'Scenario parse or evaluation failed.';
    renderError(error instanceof Error ? error.message : String(error));
  }
}

for (const sample of sampleScenarios) {
  const option = document.createElement('option');
  option.value = sample.id;
  option.textContent = sample.label;
  sampleScenarioSelect.append(option);
}

sampleScenarioSelect.addEventListener('change', () => {
  const sample = getSampleScenario(sampleScenarioSelect.value);
  setScenarioText(JSON.stringify(sample.scenario, null, 2), sample.id);
});

runButton.addEventListener('click', () => {
  void run();
});

sampleScenarioSelect.value = sampleScenarios[0].id;
setScenarioText(samplePlantScenarioText, sampleScenarios[0].id);
void run();
