import * as core from './core-dist/index.js';
import { sampleScenarios } from './core-dist/sample-scenarios.js';

function parseLocalDateTime(value) {
  if (value instanceof Date) return value;
  return new Date(value);
}

function hydrateAvailabilityWindow(window) {
  return {
    ...window,
    interval: {
      start: parseLocalDateTime(window.interval.start),
      end: parseLocalDateTime(window.interval.end),
    },
  };
}

function hydrateScenario(raw) {
  return {
    ...raw,
    shifts: raw.shifts.map(shift => ({ ...shift })),
    sites: raw.sites?.map(site => ({ ...site })),
    lines: raw.lines?.map(line => ({ ...line })),
    positions: raw.positions.map(position => ({ ...position })),
    needs: raw.needs.map(need => ({ ...need })),
    candidates: raw.candidates.map(candidate => ({ ...candidate })),
    qualificationTypes: raw.qualificationTypes.map(qualificationType => ({ ...qualificationType })),
    positionQualifications: raw.positionQualifications.map(positionQualification => ({ ...positionQualification })),
    candidateQualifications: raw.candidateQualifications.map(qualification => ({
      ...qualification,
      validFrom: parseLocalDateTime(qualification.validFrom),
      validUntil: qualification.validUntil ? parseLocalDateTime(qualification.validUntil) : undefined,
    })),
    candidateAvailability: raw.candidateAvailability?.map(window => hydrateAvailabilityWindow(window)),
    shiftPatternRules: raw.shiftPatternRules?.map(rule => ({ ...rule })),
    minimumRestRules: raw.minimumRestRules?.map(rule => ({ ...rule })),
    consecutiveWorkRules: raw.consecutiveWorkRules?.map(rule => ({ ...rule })),
    coverageRules: raw.coverageRules?.map(rule => ({ ...rule })),
    utilizationRules: raw.utilizationRules.map(rule => ({ ...rule })),
  };
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
}

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

async function evaluateScenario(input) {
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

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/evaluate') {
    try {
      const raw = await request.json();
      const input = hydrateScenario(raw);
      const evaluation = await evaluateScenario(input);

      return jsonResponse({
        result: evaluation.result,
        output: evaluation.output,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonResponse({ error: message }, { status: 400 });
    }
  }

  if (request.method === 'GET' && url.pathname === '/sample-scenarios.json') {
    return jsonResponse(sampleScenarios);
  }

  if (url.pathname === '/') {
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url).toString(), request));
  }

  return env.ASSETS.fetch(request);
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
