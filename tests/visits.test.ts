import { describe, expect, it } from 'vitest';
import { parseVisits, addVisit } from '../src/lib/visits';

describe('local exploration memory', () => {
  it('accepts only bounded exploration identifiers, never gate preferences', () => {
    expect(parseVisits('["game:percurso","gate:portfolio","project:fenda","game:percurso",12]'))
      .toEqual(['game:percurso', 'project:fenda']);
    expect(parseVisits('{broken')).toEqual([]);
    expect(parseVisits('{}')).toEqual([]);
  });
  it('deduplicates visits and retains a bounded recent history', () => {
    expect(addVisit(['game:percurso'], 'game:percurso')).toEqual(['game:percurso']);
    expect(addVisit([], 'entered')).toEqual([]);
    const history = Array.from({ length: 80 }, (_, i) => `project:study-${i}`);
    expect(addVisit(history, 'piece:forma')).toHaveLength(64);
    expect(addVisit(history, 'piece:forma').at(-1)).toBe('piece:forma');
  });
});
