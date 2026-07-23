// Input hook — Calendar & Event System
// Handles day/time advance commands and /slash commands

const modifier = (text) => {
  if (globalThis.calendarSystemAPI && typeof globalThis.calendarSystemAPI.input === "function") {
    const result = globalThis.calendarSystemAPI.input(text);
    // Library returns "" to mean "command consumed". onInput may NOT return "" or stop
    // (AI Dungeon throws "Unable to run scenario scripts"), so swap in a zero-width
    // space rather than falling back to the raw command text.
    text = result === "" ? "​" : result;
  }
  return { text };
};

modifier(text);
