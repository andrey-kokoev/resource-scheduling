import * as core from './core-dist/index.js';

function enrichAssignments(input, context, assignments) {
  return assignments.map(assignment => {
    const info = context.demandUnitInfo.get(assignment.demandUnitId);
    const shift = input.shifts.find(item => item.id === info?.shiftId);
    const line = input.lines?.find(item => item.id === info?.lineId);
    const site = input.sites?.find(item => item.id === info?.siteId);
    const position = input.positions.find(item => item.id === info?.positionId);
    const candidate = input.candidates.find(item => item.id === assignment.agentId);

    return {
      agentId: assignment.agentId,
      demandUnitId: assignment.demandUnitId,
      candidateName: candidate?.name ?? assignment.agentId,
      shiftId: info?.shiftId ?? 'unknown',
      shiftDate: shift?.date ?? 'unknown',
      positionName: position?.name ?? info?.positionId ?? 'unknown',
      siteName: site?.name ?? site?.id ?? info?.siteId ?? 'unknown',
      lineName: line?.name ?? line?.id ?? info?.lineId ?? 'n/a',
    };
  });
}

export async function evaluateScenario(input) {
  if (input.mode === 'repair') {
    const baselineState = input.repairBaselineState;
    const repairResult = core.repairCopiedBaseline(baselineState);
    const repairReport = core.buildStableRepairReport(baselineState);
    const context = core.buildRegroupingContext(baselineState.targetInput);

    return {
      result: repairResult.solverResult,
      context,
      output: {
        kind: 'repair',
        repairResult,
        repairReport,
        assignments: repairResult.solverResult.feasible
          ? enrichAssignments(
              baselineState.targetInput,
              context,
              repairResult.solverResult.assignments,
            )
          : [],
      },
    };
  }

  const solveInput = core.compileDomain(input);
  const result = core.solve(solveInput);
  const context = core.buildRegroupingContext(input);

  if (result.feasible) {
    return {
      result,
      context,
      output: {
        kind: 'feasible',
        assignments: enrichAssignments(input, context, result.assignments),
      },
    };
  }

  return {
    result,
    context,
    output: {
      kind: 'infeasible',
      explanations: core.regroupToDomainExplanations(result, context),
    },
  };
}
