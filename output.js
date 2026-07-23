// Output hook — Calendar & Event System
// Advances time/date if flagged, syncs event cards, updates context

const modifier = (text) => {
  if (globalThis.calendarSystemAPI && typeof globalThis.calendarSystemAPI.output === "function") {
    const result = globalThis.calendarSystemAPI.output(text);
    // Assign only when a string is returned; never falsy-clobber with `|| text`,
    // since returning "" from onOutput throws "A custom script ... failed".
    if (typeof result === "string") text = result;
  }
  return { text };
};

modifier(text);
