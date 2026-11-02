import { describe, expect, it } from 'vitest';

import { insertAt, moveTo, orderedIds, orderUpdates, removeId } from './reorder';

describe('orderedIds', () => {
  it('sorts by order and breaks ties by id', () => {
    expect(
      orderedIds([
        { id: 'c', order: 2 },
        { id: 'b', order: 0 },
        { id: 'a', order: 0 },
      ]),
    ).toEqual(['a', 'b', 'c']);
  });
});

describe('insertAt', () => {
  it('inserts at the index and clamps out-of-range indexes to the end', () => {
    expect(insertAt(['a', 'b'], 'x', 1)).toEqual(['a', 'x', 'b']);
    expect(insertAt(['a', 'b'], 'x', 0)).toEqual(['x', 'a', 'b']);
    expect(insertAt(['a', 'b'], 'x', 99)).toEqual(['a', 'b', 'x']);
    expect(insertAt(['a', 'b'], 'x', undefined)).toEqual(['a', 'b', 'x']);
  });
});

describe('removeId', () => {
  it('removes an id and keeps the rest contiguous', () => {
    expect(removeId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    expect(removeId(['a'], 'z')).toEqual(['a']);
  });
});

describe('moveTo', () => {
  it('moves an id forward and backward', () => {
    expect(moveTo(['a', 'b', 'c', 'd'], 'a', 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveTo(['a', 'b', 'c', 'd'], 'd', 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveTo(['a', 'b', 'c'], 'b', 99)).toEqual(['a', 'c', 'b']);
  });
});

describe('orderUpdates', () => {
  it('returns only the ids whose order changes', () => {
    const before = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ];
    expect(orderUpdates(before, ['a', 'c'])).toEqual({ c: 1 });
    expect(orderUpdates(before, ['c', 'a', 'b'])).toEqual({ c: 0, a: 1, b: 2 });
    expect(orderUpdates(before, ['a', 'b', 'c'])).toEqual({});
  });
});
