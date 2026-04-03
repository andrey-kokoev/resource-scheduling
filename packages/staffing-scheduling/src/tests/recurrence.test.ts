import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  expandRecurringDomain,
  type DomainInput,
} from '../index.js';

function makeBaseInput(): DomainInput {
  return {
    shifts: [],
    positions: [],
    needs: [],
    candidates: [],
    qualificationTypes: [],
    positionQualifications: [],
    candidateQualifications: [],
    utilizationRules: [],
  };
}

describe('recurrence expansion boundary', () => {
  it('passes through inputs that do not contain recurring content', () => {
    const input = makeBaseInput();

    const result = expandRecurringDomain(input);

    assert.strictEqual(result.expanded, true);
    if (result.expanded) {
      assert.strictEqual(result.mode, 'passthrough');
      assert.strictEqual(result.input, input);
      assert.strictEqual(result.summary.generatedShiftCount, 0);
    }
  });

  it('expands a weekly recurring shift template across a bounded horizon', () => {
    const input: DomainInput = {
      ...makeBaseInput(),
      recurringShiftTemplates: [
        {
          id: 'rst-1',
          siteId: 'site-1',
          shiftFamilyId: 'day',
          startTime: '06:00',
          endTime: '14:00',
          recurrenceRule: {
            frequency: 'weekly',
            weekdaySet: ['mon', 'wed'],
          },
          activeFrom: '2026-04-01',
          activeUntil: '2026-04-30',
        },
      ],
      expansionHorizon: {
        expandFrom: '2026-04-01',
        expandUntil: '2026-04-07',
      },
    };

    const result = expandRecurringDomain(input);

    assert.strictEqual(result.expanded, true);
    if (result.expanded) {
      assert.strictEqual(result.mode, 'weekly-shift-expansion');
      assert.deepStrictEqual(result.generatedShifts.map(shift => shift.id), [
        'rst:rst-1:2026-04-01',
        'rst:rst-1:2026-04-06',
      ]);
      assert.strictEqual(result.generatedShifts[0]?.date, '2026-04-01');
      assert.strictEqual(result.generatedShifts[1]?.date, '2026-04-06');
      assert.strictEqual(result.generatedShifts[0]?.siteId, 'site-1');
      assert.strictEqual(result.generatedShifts[0]?.shiftFamilyId, 'day');
      assert.ok(!result.input.recurringShiftTemplates);
      assert.strictEqual(result.input.shifts.length, 2);
      assert.deepStrictEqual(result.input.shifts.map(shift => shift.id), [
        'rst:rst-1:2026-04-01',
        'rst:rst-1:2026-04-06',
      ]);
    }
  });

  it('returns a boundary error when recurring shift content has no horizon', () => {
    const input: DomainInput = {
      ...makeBaseInput(),
      recurringShiftTemplates: [
        {
          id: 'rst-1',
          startTime: '06:00',
          endTime: '14:00',
          recurrenceRule: {
            frequency: 'weekly',
            weekdaySet: ['mon'],
          },
          activeFrom: '2026-04-01',
        },
      ],
    };

    const result = expandRecurringDomain(input);

    assert.strictEqual(result.expanded, false);
    if (!result.expanded) {
      assert.strictEqual(result.mode, 'boundary-only');
      assert.strictEqual(result.errors[0]?.type, 'missing-expansion-horizon');
    }
  });

  it('returns a boundary error when the horizon is inverted', () => {
    const input: DomainInput = {
      ...makeBaseInput(),
      recurringShiftTemplates: [
        {
          id: 'rst-1',
          startTime: '06:00',
          endTime: '14:00',
          recurrenceRule: {
            frequency: 'weekly',
            weekdaySet: ['mon'],
          },
          activeFrom: '2026-04-01',
        },
      ],
      expansionHorizon: {
        expandFrom: '2026-04-10',
        expandUntil: '2026-04-01',
      },
    };

    const result = expandRecurringDomain(input);

    assert.strictEqual(result.expanded, false);
    if (!result.expanded) {
      assert.strictEqual(result.mode, 'boundary-only');
      assert.strictEqual(result.errors[0]?.type, 'invalid-expansion-horizon');
    }
  });

  it('returns an explicit boundary error for unsupported recurrence content', () => {
    const input: DomainInput = {
      ...makeBaseInput(),
      expansionHorizon: {
        expandFrom: '2026-04-01',
        expandUntil: '2026-04-30',
      },
      recurringNeedTemplates: [
        {
          id: 'rnt-1',
          recurringShiftTemplateId: 'rst-1',
          positionId: 'p1',
          count: 1,
          activeFrom: '2026-04-01',
        },
      ],
    };

    const result = expandRecurringDomain(input);

    assert.strictEqual(result.expanded, false);
    if (!result.expanded) {
      assert.strictEqual(result.mode, 'boundary-only');
      assert.strictEqual(result.errors[0]?.type, 'unsupported-recurring-content');
    }
  });
});
