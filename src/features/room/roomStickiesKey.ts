/** The react-query key for one room's sticky list — shared by the fetch, the
 * live subscription, and the mutation hook so they read/write the same cache. */
export const roomStickiesKey = (room: string) => ['room-stickies', room];
