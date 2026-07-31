import { beforeEach, describe, expect, it, vi } from 'vitest';

const { update, touchRoom } = vi.hoisted(() => ({ update: vi.fn(), touchRoom: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Sticky: { update } } },
  unwrap: (r: { data: unknown }) => r.data,
  unwrapWrite: (r: { data: unknown }) => r.data,
}));
vi.mock('./touchRoom', () => ({ touchRoom }));

import { setStickyColor, setStickyOrder } from './stickyArrangeApi';

beforeEach(() => {
  update.mockReset();
  touchRoom.mockReset();
  touchRoom.mockResolvedValue(undefined);
});

describe('setStickyColor', () => {
  it('updates only the color and re-touches the room', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await setStickyColor('x', 'room', 'blue', 5);
    expect(update).toHaveBeenCalledWith({ id: 'x', color: 'blue' });
    expect(touchRoom).toHaveBeenCalledWith('room', 5);
  });
});

describe('setStickyOrder', () => {
  it('updates only the ord and re-touches the room', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await setStickyOrder('x', 'room', 1.5, 5);
    expect(update).toHaveBeenCalledWith({ id: 'x', ord: 1.5 });
    expect(touchRoom).toHaveBeenCalledWith('room', 5);
  });
});
