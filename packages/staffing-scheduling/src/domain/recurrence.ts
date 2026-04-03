/**
 * Recurrence boundary - domain-side expansion entry point.
 *
 * First pass behavior:
 * - no recurrence content => passthrough
 * - weekly recurring shift templates + finite horizon => concrete shift expansion
 * - anything else recurrence-related => explicit boundary error
 *
 * This module intentionally does not wire recurrence into compileDomain or the
 * primitive solver boundary.
 */

import type {
  DateString,
  DomainInput,
  ExpansionHorizon,
  RecurringAvailabilityTemplate,
  RecurringExceptionRecord,
  RecurringNeedTemplate,
  RecurringShiftTemplate,
  Shift,
  Weekday,
} from './types.js';

export interface RecurringExpansionSummary {
  readonly recurringShiftTemplateCount: number;
  readonly recurringNeedTemplateCount: number;
  readonly recurringAvailabilityTemplateCount: number;
  readonly recurrenceExceptionCount: number;
  readonly hasExpansionHorizon: boolean;
  readonly generatedShiftCount: number;
}

export type RecurrenceExpansionErrorType =
  | 'missing-expansion-horizon'
  | 'invalid-expansion-horizon'
  | 'unsupported-recurring-content'
  | 'unsupported-recurrence-rule'
  | 'generated-id-collision';

export interface RecurrenceExpansionError {
  readonly type: RecurrenceExpansionErrorType;
  readonly message: string;
  readonly summary: RecurringExpansionSummary;
}

export type RecurrenceExpansionResult =
  | {
      readonly expanded: true;
      readonly mode: 'passthrough';
      readonly input: DomainInput;
      readonly summary: RecurringExpansionSummary;
    }
  | {
      readonly expanded: true;
      readonly mode: 'weekly-shift-expansion';
      readonly input: DomainInput;
      readonly generatedShifts: readonly Shift[];
      readonly summary: RecurringExpansionSummary;
    }
  | {
      readonly expanded: false;
      readonly mode: 'boundary-only';
      readonly summary: RecurringExpansionSummary;
      readonly errors: readonly RecurrenceExpansionError[];
    };

function summarizeRecurringExpansionInput(input: DomainInput): RecurringExpansionSummary {
  return {
    recurringShiftTemplateCount: input.recurringShiftTemplates?.length ?? 0,
    recurringNeedTemplateCount: input.recurringNeedTemplates?.length ?? 0,
    recurringAvailabilityTemplateCount: input.recurringAvailabilityTemplates?.length ?? 0,
    recurrenceExceptionCount: input.recurrenceExceptions?.length ?? 0,
    hasExpansionHorizon: Boolean(input.expansionHorizon),
    generatedShiftCount: 0,
  };
}

function hasRecurringContent(summary: RecurringExpansionSummary): boolean {
  return (
    summary.recurringShiftTemplateCount > 0 ||
    summary.recurringNeedTemplateCount > 0 ||
    summary.recurringAvailabilityTemplateCount > 0 ||
    summary.recurrenceExceptionCount > 0
  );
}

function hasOnlyShiftRecurrence(input: DomainInput): boolean {
  return (
    (input.recurringShiftTemplates?.length ?? 0) > 0 &&
    (input.recurringNeedTemplates?.length ?? 0) === 0 &&
    (input.recurringAvailabilityTemplates?.length ?? 0) === 0 &&
    (input.recurrenceExceptions?.length ?? 0) === 0
  );
}

function makeError(
  type: RecurrenceExpansionErrorType,
  message: string,
  summary: RecurringExpansionSummary,
): RecurrenceExpansionError {
  return { type, message, summary };
}

function parseDateString(date: DateString): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function calendarDayDifference(earlier: Date, later: Date): number {
  const earlierDay = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const laterDay = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.floor((laterDay - earlierDay) / (24 * 60 * 60 * 1000));
}

function formatDateString(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayForDate(date: Date): Weekday {
  switch (date.getDay()) {
    case 0:
      return 'sun';
    case 1:
      return 'mon';
    case 2:
      return 'tue';
    case 3:
      return 'wed';
    case 4:
      return 'thu';
    case 5:
      return 'fri';
    case 6:
      return 'sat';
    default:
      return 'mon';
  }
}

function weekdayMatches(date: Date, weekdaySet: readonly Weekday[]): boolean {
  return weekdaySet.includes(weekdayForDate(date));
}

function isValidExpansionHorizon(horizon: ExpansionHorizon): boolean {
  return parseDateString(horizon.expandFrom) <= parseDateString(horizon.expandUntil);
}

function cloneConcreteInput(input: DomainInput): DomainInput {
  return {
    ...input,
    shifts: input.shifts.map(shift => ({ ...shift })),
    sites: input.sites?.map(site => ({ ...site })),
    lines: input.lines?.map(line => ({ ...line })),
    positions: input.positions.map(position => ({ ...position })),
    needs: input.needs.map(need => ({ ...need })),
    candidates: input.candidates.map(candidate => ({ ...candidate })),
    qualificationTypes: input.qualificationTypes.map(qualificationType => ({ ...qualificationType })),
    positionQualifications: input.positionQualifications.map(positionQualification => ({ ...positionQualification })),
    candidateQualifications: input.candidateQualifications.map(candidateQualification => ({ ...candidateQualification })),
    utilizationRules: input.utilizationRules.map(utilizationRule => ({ ...utilizationRule })),
    candidateAvailability: input.candidateAvailability?.map(availability => ({ ...availability })),
    shiftPatternRules: input.shiftPatternRules?.map(rule => ({ ...rule })),
    minimumRestRules: input.minimumRestRules?.map(rule => ({ ...rule })),
    consecutiveWorkRules: input.consecutiveWorkRules?.map(rule => ({ ...rule })),
    coverageRules: input.coverageRules?.map(rule => ({ ...rule })),
  };
}

function stripRecurrenceFields(input: DomainInput): DomainInput {
  const {
    recurringShiftTemplates: _recurringShiftTemplates,
    recurringNeedTemplates: _recurringNeedTemplates,
    recurringAvailabilityTemplates: _recurringAvailabilityTemplates,
    recurrenceExceptions: _recurrenceExceptions,
    expansionHorizon: _expansionHorizon,
    ...concreteInput
  } = input;
  return concreteInput;
}

function expandWeeklyShiftTemplates(input: DomainInput): RecurrenceExpansionResult {
  const horizon = input.expansionHorizon;
  if (!horizon) {
    const summary = summarizeRecurringExpansionInput(input);
    return {
      expanded: false,
      mode: 'boundary-only',
      summary,
      errors: [
        makeError(
          'missing-expansion-horizon',
          'Recurring shift templates require an explicit expansion horizon before concrete expansion can begin.',
          summary,
        ),
      ],
    };
  }

  if (!isValidExpansionHorizon(horizon)) {
    const summary = summarizeRecurringExpansionInput(input);
    return {
      expanded: false,
      mode: 'boundary-only',
      summary,
      errors: [
        makeError(
          'invalid-expansion-horizon',
          'The expansion horizon must be non-empty and ordered from expandFrom through expandUntil.',
          summary,
        ),
      ],
    };
  }

  const generatedShifts: Shift[] = [];
  const generatedIds = new Set<string>();
  const horizonStart = parseDateString(horizon.expandFrom);
  const horizonEnd = parseDateString(horizon.expandUntil);
  const sortedTemplates = [...(input.recurringShiftTemplates ?? [])].sort((left, right) => left.id.localeCompare(right.id));

  for (const template of sortedTemplates) {
    const templateStart = parseDateString(template.activeFrom);
    const templateEnd = template.activeUntil ? parseDateString(template.activeUntil) : horizonEnd;
    const rule = template.recurrenceRule;

    if (rule.frequency !== 'weekly' || !rule.weekdaySet || rule.weekdaySet.length === 0) {
      const summary = {
        ...summarizeRecurringExpansionInput(input),
        generatedShiftCount: generatedShifts.length,
      };
      return {
        expanded: false,
        mode: 'boundary-only',
        summary,
        errors: [
          makeError(
            'unsupported-recurrence-rule',
            'Only weekly recurring shift templates with a non-empty weekday set are supported in this slice.',
            summary,
          ),
        ],
      };
    }

    const intervalWeeks = rule.interval ?? 1;
    if (intervalWeeks < 1) {
      const summary = {
        ...summarizeRecurringExpansionInput(input),
        generatedShiftCount: generatedShifts.length,
      };
      return {
        expanded: false,
        mode: 'boundary-only',
        summary,
        errors: [
          makeError(
            'unsupported-recurrence-rule',
            'Weekly recurrence interval must be a positive integer.',
            summary,
          ),
        ],
      };
    }

    for (let current = new Date(horizonStart); current <= horizonEnd; current.setDate(current.getDate() + 1)) {
      if (current < templateStart || current > templateEnd) {
        continue;
      }
      if (!weekdayMatches(current, rule.weekdaySet)) {
        continue;
      }

      const weeksFromStart = Math.floor(calendarDayDifference(templateStart, current) / 7);
      if (weeksFromStart % intervalWeeks !== 0) {
        continue;
      }

      const shiftDate = formatDateString(current);
      const generatedShiftId = `rst:${template.id}:${shiftDate}`;
      if (generatedIds.has(generatedShiftId)) {
        const summary = {
          ...summarizeRecurringExpansionInput(input),
          generatedShiftCount: generatedShifts.length,
        };
        return {
          expanded: false,
          mode: 'boundary-only',
          summary,
          errors: [
            makeError(
              'generated-id-collision',
              `Recurring expansion generated duplicate shift id ${generatedShiftId}.`,
              summary,
            ),
          ],
        };
      }

      generatedIds.add(generatedShiftId);
      generatedShifts.push({
        id: generatedShiftId,
        date: shiftDate,
        startTime: template.startTime,
        endTime: template.endTime,
        siteId: template.siteId,
        shiftFamilyId: template.shiftFamilyId,
      });
    }
  }

  const expandedInput = stripRecurrenceFields(cloneConcreteInput({
    ...input,
    shifts: [...input.shifts, ...generatedShifts],
  }));
  const summary = {
    ...summarizeRecurringExpansionInput(input),
    generatedShiftCount: generatedShifts.length,
  };

  return {
    expanded: true,
    mode: 'weekly-shift-expansion',
    input: expandedInput,
    generatedShifts,
    summary,
  };
}

/**
 * Boundary entry point for recurrence expansion.
 *
 * First pass behavior:
 * - if no recurrence content is present, return the input unchanged
 * - if recurrence content is present without a horizon, report a boundary error
 * - if recurrence content is present with a horizon, report that expansion is not implemented yet
 */
export function expandRecurringDomain(input: DomainInput): RecurrenceExpansionResult {
  const summary = summarizeRecurringExpansionInput(input);

  if (!hasRecurringContent(summary)) {
    return {
      expanded: true,
      mode: 'passthrough',
      input,
      summary,
    };
  }

  if (!hasOnlyShiftRecurrence(input)) {
    return {
      expanded: false,
      mode: 'boundary-only',
      summary,
      errors: [
        makeError(
          'unsupported-recurring-content',
          'This slice only expands weekly recurring shift templates; recurring needs, availability, and exceptions remain out of scope.',
          summary,
        ),
      ],
    };
  }

  return expandWeeklyShiftTemplates(input);
}

export type {
  DomainInput as RecurrenceExpansionInput,
  ExpansionHorizon,
  RecurringShiftTemplate,
  RecurringNeedTemplate,
  RecurringAvailabilityTemplate,
  RecurringExceptionRecord,
};
