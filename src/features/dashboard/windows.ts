export type StatsWindowOption = 7 | 30;

export interface WindowRange {
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The last N days ending now, as ISO-8601 instants for the `/api/v1/stats` `from`/`to` params. */
export function computeWindow(days: StatsWindowOption, now: Date = new Date()): WindowRange {
  return {
    from: new Date(now.getTime() - days * DAY_MS).toISOString(),
    to: now.toISOString(),
  };
}
