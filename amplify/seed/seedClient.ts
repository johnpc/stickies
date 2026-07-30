/** Shared Amplify client + helpers for the seed runner. Stickies is guest-first,
 * so seed writes go through the default identityPool (guest) auth — no sign-in. */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Schema } from '../data/resource';

const here = dirname(fileURLToPath(import.meta.url));
const outputs = JSON.parse(readFileSync(resolve(here, '../../amplify_outputs.json'), 'utf8'));

Amplify.configure(outputs);
export const client = generateClient<Schema>({ authMode: 'identityPool' });

/** Minimal shape of an Amplify model needed to wipe it generically. */
interface ClearableModel {
  list: (opts: {
    limit: number;
    nextToken?: string;
  }) => Promise<{ data: ({ id: string } | null)[]; nextToken?: string | null }>;
  delete: (id: { id: string }) => Promise<unknown>;
}

/** Delete every row of one model, paginating through ALL pages so a re-seed
 * converges to a known state regardless of prior contents. */
export async function clearModel(model: ClearableModel): Promise<void> {
  let nextToken: string | undefined;
  do {
    const page = await model.list({ limit: 100, nextToken });
    for (const row of page.data) {
      if (row) await model.delete({ id: row.id });
    }
    nextToken = page.nextToken ?? undefined;
  } while (nextToken);
}
