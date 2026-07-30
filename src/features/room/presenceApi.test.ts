import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, create, update, del } = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Presence: { get, create, update, delete: del } } },
  unwrap: (r: { data: unknown }) => r.data,
}));

import { heartbeat, clearPresence } from './presenceApi';

beforeEach(() => [get, create, update, del].forEach((m) => m.mockReset()));

describe('heartbeat', () => {
  it('creates the row on the first beat', async () => {
    get.mockResolvedValue({ data: null });
    create.mockResolvedValue({ data: {} });
    await heartbeat('sess1', 'room', '2026-01-01T00:00:00Z');
    expect(create).toHaveBeenCalledWith({
      id: 'sess1',
      room: 'room',
      heartbeatAt: '2026-01-01T00:00:00Z',
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('updates the heartbeat on later beats', async () => {
    get.mockResolvedValue({ data: { id: 'sess1' } });
    update.mockResolvedValue({ data: {} });
    await heartbeat('sess1', 'room', '2026-01-01T00:00:05Z');
    expect(update).toHaveBeenCalledWith({ id: 'sess1', heartbeatAt: '2026-01-01T00:00:05Z' });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('clearPresence', () => {
  it('deletes this session row', async () => {
    del.mockResolvedValue({ data: {} });
    await clearPresence('sess1');
    expect(del).toHaveBeenCalledWith({ id: 'sess1' });
  });
});
