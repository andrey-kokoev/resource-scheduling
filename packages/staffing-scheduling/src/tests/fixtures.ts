import type { DomainInput } from '../index.js';

export const d = (dateStr: string, timeStr: string = '00:00'): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

export const shift = (
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

export const site = (id: string, name: string) => ({ id, name });

export const line = (id: string, siteId: string, name: string) => ({ id, siteId, name });

export const position = (id: string, name: string) => ({ id, name });

export const need = (
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

export const candidate = (id: string, name: string) => ({ id, name });

export const qualificationType = (id: string, name: string) => ({ id, name });

export const positionQualification = (
  positionId: string,
  qualificationTypeId: string,
  required: boolean = true,
) => ({
  positionId,
  qualificationTypeId,
  required,
});

export const candidateQualification = (
  candidateId: string,
  qualificationTypeId: string,
  validFrom: Date,
  validUntil?: Date,
) => ({
  candidateId,
  qualificationTypeId,
  validFrom,
  validUntil,
});

export const available = (candidateId: string, start: Date, end: Date) => ({
  candidateId,
  kind: 'available' as const,
  interval: { start, end },
});

export const unavailable = (candidateId: string, start: Date, end: Date, reason?: string) => ({
  candidateId,
  kind: 'unavailable' as const,
  interval: { start, end },
  reason,
});

export const coverageRule = <T extends NonNullable<DomainInput['coverageRules']>[number]>(rule: T) => rule;
export const shiftPatternRule = <T extends NonNullable<DomainInput['shiftPatternRules']>[number]>(rule: T) => rule;
export const utilizationRule = <T extends NonNullable<DomainInput['utilizationRules']>[number]>(rule: T) => rule;
export const minimumRestRule = <T extends NonNullable<DomainInput['minimumRestRules']>[number]>(rule: T) => rule;
export const consecutiveWorkRule = <T extends NonNullable<DomainInput['consecutiveWorkRules']>[number]>(rule: T) => rule;
