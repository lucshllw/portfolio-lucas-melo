const valid = (id: unknown): id is string =>
  typeof id === 'string' && /^(game|piece|project):[a-z0-9-]{1,64}$/.test(id);

export function parseVisits(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter(valid))].slice(-64) : [];
  } catch { return []; }
}

export function addVisit(history: string[], id: string): string[] {
  if (!valid(id) || history.includes(id)) return history;
  return [...history, id].slice(-64);
}
