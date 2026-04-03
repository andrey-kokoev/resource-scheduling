const d = (dateStr: string, timeStr: string = '00:00'): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const shift = (
  id: string,
  date: string,
  startTime: string,
  endTime: string,
  extra: Record<string, unknown> = {},
) => ({
  id,
  date,
  startTime,
  endTime,
  ...extra,
});

const site = (id: string, name: string) => ({ id, name });
const line = (id: string, siteId: string, name: string) => ({ id, siteId, name });
const position = (id: string, name: string) => ({ id, name });

const need = (
  id: string,
  shiftId: string,
  positionId: string,
  count: number = 1,
  lineId?: string,
) => ({
  id,
  shiftId,
  positionId,
  count,
  ...(lineId ? { lineId } : {}),
});

const candidate = (id: string, name: string) => ({ id, name });
const qualificationType = (id: string, name: string) => ({ id, name });
const positionQualification = (
  positionId: string,
  qualificationTypeId: string,
  required: boolean = true,
) => ({
  positionId,
  qualificationTypeId,
  required,
});

const candidateQualification = (
  candidateId: string,
  qualificationTypeId: string,
  validFrom: Date | string,
  validUntil?: Date | string,
) => ({
  candidateId,
  qualificationTypeId,
  validFrom,
  validUntil,
});

const available = (candidateId: string, start: Date, end: Date) => ({
  candidateId,
  kind: 'available' as const,
  interval: { start, end },
});

const unavailable = (candidateId: string, start: Date, end: Date, reason?: string) => ({
  candidateId,
  kind: 'unavailable' as const,
  interval: { start, end },
  reason,
});

const coverageRule = <T extends Record<string, unknown>>(rule: T) => rule;
const shiftPatternRule = <T extends Record<string, unknown>>(rule: T) => rule;
const minimumRestRule = <T extends Record<string, unknown>>(rule: T) => rule;
const consecutiveWorkRule = <T extends Record<string, unknown>>(rule: T) => rule;
const utilizationRule = <T extends Record<string, unknown>>(rule: T) => rule;

type SampleExpectation = {
  readonly feasible: boolean;
  readonly cue?: string;
  readonly assignments?: number;
};

type SampleScenario = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly expected: SampleExpectation;
  readonly scenario: Record<string, unknown>;
};

const basePlantScenario = {
  sites: [
    { id: 'site-1', name: 'Plant A' },
  ],
  lines: [
    { id: 'line-a', siteId: 'site-1', name: 'Assembly' },
    { id: 'line-b', siteId: 'site-1', name: 'Packaging' },
  ],
  shifts: [
    { id: 's1', date: '2026-04-07', startTime: '06:00', endTime: '14:00', siteId: 'site-1', shiftFamilyId: 'day' },
    { id: 's2', date: '2026-04-07', startTime: '22:00', endTime: '06:00', siteId: 'site-1', shiftFamilyId: 'night' },
    { id: 's3', date: '2026-04-08', startTime: '06:00', endTime: '14:00', siteId: 'site-1', shiftFamilyId: 'day' },
  ],
  positions: [
    { id: 'pOp', name: 'Operator' },
    { id: 'pLead', name: 'Line Lead' },
    { id: 'pFork', name: 'Forklift Driver' },
  ],
  needs: [
    { id: 'n1', shiftId: 's1', lineId: 'line-a', positionId: 'pOp', count: 1 },
    { id: 'n2', shiftId: 's1', lineId: 'line-a', positionId: 'pLead', count: 1 },
    { id: 'n3', shiftId: 's2', lineId: 'line-b', positionId: 'pFork', count: 1 },
    { id: 'n4', shiftId: 's3', lineId: 'line-b', positionId: 'pOp', count: 1 },
  ],
  candidates: [
    { id: 'c1', name: 'Priya' },
    { id: 'c2', name: 'Marco' },
    { id: 'c3', name: 'Sam' },
  ],
  qualificationTypes: [
    { id: 'qOp', name: 'OperatorAuth' },
    { id: 'qLead', name: 'LeadAuth' },
    { id: 'qFork', name: 'ForkliftAuth' },
  ],
  positionQualifications: [
    { positionId: 'pOp', qualificationTypeId: 'qOp', required: true },
    { positionId: 'pLead', qualificationTypeId: 'qLead', required: true },
    { positionId: 'pFork', qualificationTypeId: 'qFork', required: true },
  ],
  candidateQualifications: [
    { candidateId: 'c1', qualificationTypeId: 'qOp', validFrom: '2026-01-01T00:00:00' },
    { candidateId: 'c2', qualificationTypeId: 'qOp', validFrom: '2026-01-01T00:00:00' },
    { candidateId: 'c2', qualificationTypeId: 'qLead', validFrom: '2026-01-01T00:00:00' },
    { candidateId: 'c3', qualificationTypeId: 'qOp', validFrom: '2026-01-01T00:00:00' },
    { candidateId: 'c3', qualificationTypeId: 'qFork', validFrom: '2026-01-01T00:00:00' },
  ],
  candidateAvailability: [
    {
      candidateId: 'c3',
      kind: 'unavailable',
      interval: {
        start: '2026-04-07T06:00:00',
        end: '2026-04-07T14:00:00',
      },
      reason: 'safety training',
    },
  ],
  shiftPatternRules: [
    {
      id: 'spr-1',
      candidateId: 'c1',
      type: 'weekday-only',
    },
    {
      id: 'spr-2',
      candidateId: 'c3',
      type: 'fixed-shift-family',
      shiftFamilyIds: ['night'],
    },
  ],
  coverageRules: [],
  utilizationRules: [
    { candidateId: 'c1', windowDays: 7, maxShifts: 2 },
    { candidateId: 'c2', windowDays: 7, maxShifts: 1 },
    { candidateId: 'c3', windowDays: 7, maxShifts: 1 },
  ],
  minimumRestRules: [],
  consecutiveWorkRules: [],
} as const;

function cloneScenario<T>(seed: T): T {
  return JSON.parse(JSON.stringify(seed)) as T;
}

function buildScenarioText(seed: unknown): string {
  return JSON.stringify(seed, null, 2);
}

function withForkliftUnavailable(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.candidateAvailability = [
    {
      candidateId: 'c3',
      kind: 'unavailable',
      interval: {
        start: '2026-04-07T22:00:00',
        end: '2026-04-08T06:00:00',
      },
      reason: 'lift inspection',
    },
  ];
  return scenario;
}

function withQualificationGap(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.candidateQualifications = scenario.candidateQualifications.filter(
    (qualification: any) => !(qualification.candidateId === 'c2' && qualification.qualificationTypeId === 'qLead'),
  );
  return scenario;
}

function withWeekendPatternConflict(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.shifts = scenario.shifts.map((shiftItem: any) => (
    shiftItem.id === 's1'
      ? { ...shiftItem, date: '2026-04-11' }
      : shiftItem
  ));
  scenario.candidateQualifications = scenario.candidateQualifications.filter(
    (qualification: any) => !(
      (qualification.candidateId === 'c2' || qualification.candidateId === 'c3')
      && qualification.qualificationTypeId === 'qOp'
    ),
  );
  return scenario;
}

function withSiteScopedCoverage(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.coverageRules = [
    {
      id: 'cr-1',
      type: 'require-supervisor-presence',
      siteId: 'site-1',
      shiftId: 's1',
      positionId: 'pLead',
    },
  ];
  return scenario;
}

function withLineScopedCoverage(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.coverageRules = [
    {
      id: 'cr-1',
      type: 'require-supervisor-presence',
      siteId: 'site-1',
      lineId: 'line-a',
      shiftId: 's1',
      positionId: 'pLead',
    },
  ];
  return scenario;
}

function withRollingUtilizationConflict(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.shifts = [
    ...scenario.shifts,
    { id: 's4', date: '2026-04-09', startTime: '06:00', endTime: '14:00', siteId: 'site-1', shiftFamilyId: 'day' },
  ];
  scenario.needs = [
    ...scenario.needs,
    { id: 'n5', shiftId: 's4', lineId: 'line-a', positionId: 'pOp', count: 1 },
  ];
  scenario.utilizationRules = [
    { candidateId: 'c1', windowDays: 7, maxShifts: 1 },
    { candidateId: 'c2', windowDays: 7, maxShifts: 1 },
    { candidateId: 'c3', windowDays: 7, maxShifts: 1 },
  ];
  return scenario;
}

function buildTemporalPressureScenario() {
  return {
    sites: [
      { id: 'site-1', name: 'Plant A' },
    ],
    lines: [
      { id: 'line-a', siteId: 'site-1', name: 'Assembly' },
      { id: 'line-b', siteId: 'site-1', name: 'Packaging' },
    ],
    shifts: [
      { id: 's1', date: '2026-04-07', startTime: '06:00', endTime: '10:00', siteId: 'site-1', shiftFamilyId: 'day' },
      { id: 's2', date: '2026-04-07', startTime: '14:00', endTime: '18:00', siteId: 'site-1', shiftFamilyId: 'day' },
      { id: 's3', date: '2026-04-08', startTime: '06:00', endTime: '10:00', siteId: 'site-1', shiftFamilyId: 'day' },
    ],
    positions: [
      { id: 'pOp', name: 'Operator' },
    ],
    needs: [
      { id: 'n1', shiftId: 's1', lineId: 'line-a', positionId: 'pOp', count: 1 },
      { id: 'n2', shiftId: 's2', lineId: 'line-b', positionId: 'pOp', count: 1 },
      { id: 'n3', shiftId: 's3', lineId: 'line-a', positionId: 'pOp', count: 1 },
    ],
    candidates: [
      { id: 'c1', name: 'Priya' },
    ],
    qualificationTypes: [
      { id: 'qOp', name: 'OperatorAuth' },
    ],
    positionQualifications: [
      { positionId: 'pOp', qualificationTypeId: 'qOp', required: true },
    ],
    candidateQualifications: [
      { candidateId: 'c1', qualificationTypeId: 'qOp', validFrom: '2026-01-01T00:00:00' },
    ],
    candidateAvailability: [],
    shiftPatternRules: [],
    minimumRestRules: [],
    consecutiveWorkRules: [],
    coverageRules: [],
    utilizationRules: [
      { candidateId: 'c1', windowDays: 7, maxShifts: 3 },
    ],
  };
}

function withMinimumRestConflict() {
  const scenario: any = buildTemporalPressureScenario();
  scenario.minimumRestRules = [
    { id: 'rr-1', candidateId: 'c1', requiredRestHours: 8 },
  ];
  return scenario;
}

function withConsecutiveWorkConflict() {
  const scenario: any = buildTemporalPressureScenario();
  scenario.shifts = [
    { id: 's1', date: '2026-04-07', startTime: '06:00', endTime: '10:00', siteId: 'site-1', shiftFamilyId: 'day' },
    { id: 's2', date: '2026-04-08', startTime: '06:00', endTime: '10:00', siteId: 'site-1', shiftFamilyId: 'day' },
    { id: 's3', date: '2026-04-09', startTime: '06:00', endTime: '10:00', siteId: 'site-1', shiftFamilyId: 'day' },
  ];
  scenario.needs = [
    { id: 'n1', shiftId: 's1', lineId: 'line-a', positionId: 'pOp', count: 1 },
    { id: 'n2', shiftId: 's2', lineId: 'line-a', positionId: 'pOp', count: 1 },
    { id: 'n3', shiftId: 's3', lineId: 'line-b', positionId: 'pOp', count: 1 },
  ];
  scenario.consecutiveWorkRules = [
    { id: 'cw-1', candidateId: 'c1', maxDays: 2 },
  ];
  return scenario;
}

function withCoverageRuleImpossible(seed: typeof basePlantScenario) {
  const scenario: any = cloneScenario(seed);
  scenario.coverageRules = [
    {
      id: 'cr-1',
      type: 'require-qualification-on-shift',
      shiftId: 's1',
      qualificationTypeId: 'qFork',
    },
  ];
  return scenario;
}

export const sampleScenarios: ReadonlyArray<SampleScenario> = [
  {
    id: 'base-feasible',
    label: 'Base feasible staffing solve',
    description: 'A coverage-free plant scenario that should solve successfully.',
    expected: { feasible: true, assignments: 4 },
    scenario: cloneScenario(basePlantScenario),
  },
  {
    id: 'availability-conflict',
    label: 'Availability conflict',
    description: 'The only forklift-qualified worker is unavailable for the night shift.',
    expected: { feasible: false, cue: 'availability-conflict' },
    scenario: withForkliftUnavailable(basePlantScenario),
  },
  {
    id: 'qualification-gap',
    label: 'Qualification gap',
    description: 'The line lead role becomes impossible to staff after removing the lead qualification.',
    expected: { feasible: false, cue: 'no-eligible-candidate' },
    scenario: withQualificationGap(basePlantScenario),
  },
  {
    id: 'shift-pattern-conflict',
    label: 'Shift-pattern conflict',
    description: 'A weekday-only operator is the only person who can cover a weekend shift.',
    expected: { feasible: false, cue: 'shift-pattern-conflict' },
    scenario: withWeekendPatternConflict(basePlantScenario),
  },
  {
    id: 'rolling-utilization-max',
    label: 'Rolling utilization max conflict',
    description: 'A single operator runs out of rolling-window capacity before the final need can be staffed.',
    expected: { feasible: false, cue: 'utilization-max-violation' },
    scenario: withRollingUtilizationConflict(basePlantScenario),
  },
  {
    id: 'minimum-rest-conflict',
    label: 'Minimum rest conflict',
    description: 'Back-to-back day assignments are too close together for the required recovery time.',
    expected: { feasible: false, cue: 'insufficient-rest' },
    scenario: withMinimumRestConflict(),
  },
  {
    id: 'consecutive-work-conflict',
    label: 'Consecutive-work limit conflict',
    description: 'A three-day run exceeds the maximum consecutive-work limit for the only operator.',
    expected: { feasible: false, cue: 'consecutive-days-violation' },
    scenario: withConsecutiveWorkConflict(),
  },
  {
    id: 'coverage-conflict',
    label: 'Coverage conflict',
    description: 'A shift-wide coverage requirement asks for a qualification that cannot be present on the shift.',
    expected: { feasible: false, cue: 'coverage-conflict' },
    scenario: withCoverageRuleImpossible(basePlantScenario),
  },
  {
    id: 'site-scoped-coverage',
    label: 'Site-scoped coverage',
    description: 'A site-scoped supervisor requirement stays within the current plant location and still solves successfully.',
    expected: { feasible: true, assignments: 4 },
    scenario: withSiteScopedCoverage(basePlantScenario),
  },
  {
    id: 'line-aware-coverage',
    label: 'Line-aware coverage context',
    description: 'A line-scoped supervisor requirement follows the line metadata already supported by the domain layer.',
    expected: { feasible: true, assignments: 4 },
    scenario: withLineScopedCoverage(basePlantScenario),
  },
];

export const samplePlantScenarioSeed = cloneScenario(basePlantScenario);
export const samplePlantScenarioText = buildScenarioText(samplePlantScenarioSeed);

export function getSampleScenario(id: string) {
  return sampleScenarios.find(sample => sample.id === id) ?? sampleScenarios[0];
}

function parseLocalDateTime(value: string | Date) {
  if (value instanceof Date) return value;
  return new Date(value);
}

function hydrateAvailabilityWindow(window: {
  readonly interval: { readonly start: string | Date; readonly end: string | Date };
  readonly kind: 'available' | 'unavailable';
  readonly reason?: string;
}) {
  return {
    ...window,
    interval: {
      start: parseLocalDateTime(window.interval.start),
      end: parseLocalDateTime(window.interval.end),
    },
  };
}

export function hydrateScenario(raw: any) {
  return {
    ...raw,
    shifts: raw.shifts.map((shift: any) => ({ ...shift })),
    sites: raw.sites?.map((site: any) => ({ ...site })),
    lines: raw.lines?.map((line: any) => ({ ...line })),
    positions: raw.positions.map((position: any) => ({ ...position })),
    needs: raw.needs.map((need: any) => ({ ...need })),
    candidates: raw.candidates.map((candidate: any) => ({ ...candidate })),
    qualificationTypes: raw.qualificationTypes.map((qualificationType: any) => ({ ...qualificationType })),
    positionQualifications: raw.positionQualifications.map((positionQualification: any) => ({ ...positionQualification })),
    candidateQualifications: raw.candidateQualifications.map((qualification: any) => ({
      ...qualification,
      validFrom: parseLocalDateTime(qualification.validFrom),
      validUntil: qualification.validUntil ? parseLocalDateTime(qualification.validUntil) : undefined,
    })),
    candidateAvailability: raw.candidateAvailability?.map((window: any) => hydrateAvailabilityWindow(window)),
    shiftPatternRules: raw.shiftPatternRules?.map((rule: any) => ({ ...rule })),
    minimumRestRules: raw.minimumRestRules?.map((rule: any) => ({ ...rule })),
    consecutiveWorkRules: raw.consecutiveWorkRules?.map((rule: any) => ({ ...rule })),
    coverageRules: raw.coverageRules?.map((rule: any) => ({ ...rule })),
    utilizationRules: raw.utilizationRules.map((rule: any) => ({ ...rule })),
  };
}

export function summarizeScenario(raw: any) {
  const ruleFamilies = [];
  if ((raw.candidateAvailability?.length ?? 0) > 0) ruleFamilies.push('availability');
  if ((raw.shiftPatternRules?.length ?? 0) > 0) ruleFamilies.push('pattern');
  if ((raw.minimumRestRules?.length ?? 0) > 0) ruleFamilies.push('minimum rest');
  if ((raw.consecutiveWorkRules?.length ?? 0) > 0) ruleFamilies.push('consecutive-work');
  if ((raw.coverageRules?.length ?? 0) > 0) ruleFamilies.push('coverage');
  if ((raw.utilizationRules?.length ?? 0) > 0) ruleFamilies.push('utilization');

  const scopedCoverage = {
    siteScoped: raw.coverageRules?.some((rule: any) => Boolean(rule.siteId)) ?? false,
    lineScoped: raw.coverageRules?.some((rule: any) => Boolean(rule.lineId)) ?? false,
  };

  return {
    siteCount: raw.sites?.length ?? 0,
    lineCount: raw.lines?.length ?? 0,
    shiftCount: raw.shifts.length,
    needCount: raw.needs.length,
    candidateCount: raw.candidates.length,
    ruleFamilies,
    scopedCoverage,
  };
}

export {
  available,
  candidate,
  candidateQualification,
  consecutiveWorkRule,
  coverageRule,
  d,
  line,
  need,
  minimumRestRule,
  position,
  positionQualification,
  qualificationType,
  shift,
  site,
  shiftPatternRule,
  unavailable,
  utilizationRule,
};
