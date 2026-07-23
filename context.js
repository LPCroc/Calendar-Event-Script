// Context hook — Calendar & Event System
// Injects current date into AI context every turn

const modifier = (text) => {
  if (globalThis.calendarSystemAPI && typeof globalThis.calendarSystemAPI.context === "function") {
    return globalThis.calendarSystemAPI.context(text);
  }
  return { text };
};

modifier(text);
