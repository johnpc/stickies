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

import { heartbeat, clearPresence, reapPresence } from './presenceApi';

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
    get.mockResolvedValue({ data: { id: 'sess1', room: 'room' } });
    update.mockResolvedValue({ data: {} });
    await heartbeat('sess1', 'room', '2026-01-01T00:00:05Z');
    expect(update).toHaveBeenCalledWith({
      id: 'sess1',
      room: 'room',
      heartbeatAt: '2026-01-01T00:00:05Z',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rewrites the room on update so a tab that moves rooms is not a phantom', async () => {
    // Same tab (session id survives SPA nav) already has a row in room A.
    get.mockResolvedValue({ data: { id: 'sess1', room: 'A' } });
    update.mockResolvedValue({ data: {} });
    await heartbeat('sess1', 'B', '2026-01-01T00:00:10Z');
    // The heartbeat must retag the row to B — not leave it stuck in A.
    expect(update).toHaveBeenCalledWith({
      id: 'sess1',
      room: 'B',
      heartbeatAt: '2026-01-01T00:00:10Z',
    });
  });
});

describe('clearPresence', () => {
  it('deletes this session row', async () => {
    del.mockResolvedValue({ data: {} });
    await clearPresence('sess1');
    expect(del).toHaveBeenCalledWith({ id: 'sess1' });
  });
});

describe('reapPresence', () => {
  it('deletes a dead session row by id', async () => {
    del.mockResolvedValue({ data: {} });
    await reapPresence('ghost');
    expect(del).toHaveBeenCalledWith({ id: 'ghost' });
  });
});
