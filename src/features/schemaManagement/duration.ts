const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/;

export interface DaysHours {
  days: number;
  hours: number;
}

function parseIsoDurationMinutes(duration: string): number | undefined {
  const match = ISO_DURATION.exec(duration);
  if (!match) return undefined;
  const [, daysRaw, hoursRaw, minutesRaw] = match;
  if (!daysRaw && !hoursRaw && !minutesRaw) return undefined;
  const days = daysRaw ? Number(daysRaw) : 0;
  const hours = hoursRaw ? Number(hoursRaw) : 0;
  const minutes = minutesRaw ? Number(minutesRaw) : 0;
  return days * 24 * 60 + hours * 60 + minutes;
}

/**
 * Serialize authored days/hours into the contract's ISO-8601 day/hour
 * duration format. Returns `undefined` when both are zero/blank, meaning no
 * default validity is set.
 */
export function daysHoursToIsoDuration(days: number, hours: number): string | undefined {
  const d = Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
  const h = Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 0;
  if (d === 0 && h === 0) return undefined;
  let out = 'P';
  if (d > 0) out += `${d}D`;
  if (h > 0) out += `T${h}H`;
  return out;
}

/**
 * Parse an ISO-8601 duration back into whole days + leftover hours, for
 * prefill. The builder only authors day/hour granularity; a duration with a
 * minute remainder is rounded up to the next hour so prefill never shrinks an
 * existing default validity window.
 */
export function parseIsoDurationToDaysHours(duration: string | undefined | null): DaysHours {
  if (!duration) return { days: 0, hours: 0 };
  const totalMinutes = parseIsoDurationMinutes(duration);
  if (totalMinutes === undefined) return { days: 0, hours: 0 };
  const roundedHours = Math.ceil(totalMinutes / 60);
  return { days: Math.floor(roundedHours / 24), hours: roundedHours % 24 };
}
