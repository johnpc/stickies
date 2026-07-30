/**
 * Seed rooms (DATA, not logic). A handful of demo pads so a fresh sandbox's home
 * page shows a populated "recently edited rooms" list and each room opens onto
 * real stickies. `slug` is already normalized; `stickies` are created in order,
 * so their colors rotate through the palette exactly like the app.
 */
export interface SeedRoom {
  slug: string;
  stickies: { kind: 'TEXT' | 'LINK' | 'CODE'; content: string; language?: string }[];
}

export const SEED_ROOMS: SeedRoom[] = [
  {
    slug: 'welcome',
    stickies: [
      { kind: 'TEXT', content: 'Welcome! This whole pad is shared with anyone who has the link.' },
      { kind: 'TEXT', content: 'Tap “Add a sticky” to jot a note or paste a link.' },
      { kind: 'LINK', content: 'https://ionicframework.com' },
    ],
  },
  {
    slug: 'grocery-list',
    stickies: [
      { kind: 'TEXT', content: 'oat milk' },
      { kind: 'TEXT', content: 'coffee beans' },
      { kind: 'TEXT', content: 'sourdough' },
    ],
  },
  {
    slug: 'trip-ideas',
    stickies: [
      { kind: 'TEXT', content: 'Long weekend in Lisbon?' },
      { kind: 'LINK', content: 'https://www.lonelyplanet.com/portugal/lisbon' },
    ],
  },
  {
    slug: 'standup-notes',
    stickies: [
      { kind: 'TEXT', content: 'Yesterday: shipped the room pad' },
      { kind: 'TEXT', content: 'Today: snippet + image stickies' },
    ],
  },
  {
    slug: 'code-corner',
    stickies: [
      { kind: 'TEXT', content: 'Paste snippets here — wrap them in a ``` fence.' },
      {
        kind: 'CODE',
        language: 'ts',
        content: "const greet = (name: string) => `hi ${name}`;\nconsole.log(greet('world'));",
      },
      { kind: 'LINK', content: 'https://highlightjs.org' },
    ],
  },
];
