const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/;

/** Parse supported ISO-8601 day/hour/minute durations into whole minutes. */
export function parseIsoDurationMinutes(duration: string | undefined | null): number | undefined {
  if (!duration) return undefined;
  const match = ISO_DURATION.exec(duration);
  if (!match) return undefined;
  const [, daysRaw, hoursRaw, minutesRaw] = match;
  if (!daysRaw && !hoursRaw && !minutesRaw) return undefined;

  const days = daysRaw ? Number(daysRaw) : 0;
  const hours = hoursRaw ? Number(hoursRaw) : 0;
  const minutes = minutesRaw ? Number(minutesRaw) : 0;
  return days * 24 * 60 + hours * 60 + minutes;
}

export function minutesToFormValue(minutes: number | undefined): string {
  return minutes === undefined ? '' : String(minutes);
}
