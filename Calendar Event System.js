(function () {

/* =============================================================================
   CALENDAR & EVENT SYSTEM  —  TEMPLATE
   -----------------------------------------------------------------------------
   A drop-in AI Dungeon script that tracks an in-game date and time and keeps a
   single auto-updating "Calendar" story card showing the date, today's
   schedule, and any active events.

   Setup instructions: see "CALENDAR & EVENT SYSTEM - GUIDE.txt" (same folder).

   You normally only edit the three numbered sections below:
       1) CALENDAR CONFIG  - your start date, month names, day length
       2) DAILY SCHEDULE   - what a normal day looks like, per weekday
       3) EVENT REGISTRY   - dated / conditional events

   Everything under "ENGINE" works as-is; you should not need to touch it.
   ============================================================================= */


// =============================================================================
// 1) CALENDAR CONFIG
// =============================================================================
const CALENDAR_CONFIG = {
  startMonth:   "January",   // must match one of the MONTHS names below
  startDay:     1,           // 1 .. daysPerMonth
  startYear:    1,
  startWeekday: "Monday",    // IMPORTANT: set this correctly for your start date
  startTime:    "Morning",   // Morning | Afternoon | Evening | Night
  daysPerMonth: 30           // every month is this many days long
};

// Month names, in order. The in-game year rolls over after the LAST one.
// Rename / add / remove freely (e.g. fantasy months) — just keep them unique.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Weekday names, in order. Rename freely; you may also use more or fewer than 7.
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Parts of the day, in order, used by the "pass time" commands.
const TIMES_OF_DAY = ["Morning", "Afternoon", "Evening", "Night"];

// Label shown before the schedule on the Calendar card.
// e.g. "Today's Schedule", "Today's Periods", "Today's Duties", "Today's Watch"
const SCHEDULE_LABEL = "Today's Schedule";


// =============================================================================
// 2) DAILY SCHEDULE
//    What a normal day looks like, per weekday. This is the text the AI sees.
//    Use "" (empty string) for a day with nothing scheduled.
//    The weekday names here must match the WEEKDAYS list above.
// =============================================================================
const DAILY_SCHEDULE = {
  Monday:    "First session (9:00am to 11:00am), Second session (11:30am to 1:00pm), Lunch (1:00pm to 2:00pm), Third session (2:30pm to 4:00pm).",
  Tuesday:   "First session (9:00am to 11:00am), Second session (11:30am to 1:00pm), Lunch (1:00pm to 2:00pm), Third session (2:30pm to 4:00pm).",
  Wednesday: "First session (9:00am to 11:00am), Second session (11:30am to 1:00pm), Lunch (1:00pm to 2:00pm), Third session (2:30pm to 4:00pm).",
  Thursday:  "First session (9:00am to 11:00am), Second session (11:30am to 1:00pm), Lunch (1:00pm to 2:00pm), Third session (2:30pm to 4:00pm).",
  Friday:    "First session (9:00am to 11:00am), Second session (11:30am to 1:00pm), Lunch (1:00pm to 2:00pm), Third session (2:30pm to 4:00pm).",
  Saturday:  "No scheduled sessions. Free time for personal activities.",
  Sunday:    "Day off. A good time to rest, explore, or spend time with others."
};

/* ---- EXAMPLE: a school setting -----------------------------------------------
   Replace the entries above with something like this:

     Monday:    "Algebra 2 (8:30am to 10:00am), English (10:30am to 12:00pm), Lunch (12:00pm to 1:00pm), Biology (1:30pm to 2:30pm).",
     Tuesday:   "World History (8:30am to 10:00am), Psychology (10:30am to 12:00pm), Lunch (12:00pm to 1:00pm), Computer Applications (1:30pm to 2:30pm).",
     Wednesday: "Chemistry (8:30am to 10:00am), Public Speaking (10:30am to 12:00pm), Lunch (12:00pm to 1:00pm), Sociology (1:30pm to 2:30pm).",
     Thursday:  "Statistics (8:30am to 10:00am), Literature (10:30am to 12:00pm), Lunch (12:00pm to 1:00pm), Environmental Science (1:30pm to 2:30pm).",
     Friday:    "Economics (8:30am to 10:00am), Art Appreciation (10:30am to 12:00pm), Lunch (12:00pm to 1:00pm), Health and Wellness (1:30pm to 2:30pm).",
     Saturday:  "No classes. Optional club activities and school events may take place.",
     Sunday:    "Day off. A good time to rest, explore the town, or spend time with friends."

   Other ideas: a job (shifts), a ship's watch rota, a training regimen, a
   tavern's opening hours, a prison routine — anything with a daily rhythm.
   ---------------------------------------------------------------------------- */


// =============================================================================
// 3) EVENT REGISTRY
//    Things that happen on certain days, or under certain conditions.
//
//    Each event:
//      id        : unique identifier (don't reuse or change once in play)
//      title     : label shown on the Calendar card line
//      keys      : trigger keywords (comma separated)
//      entry     : the text the AI sees while the event is active
//      conditions:
//        date      : START day, "Month Day" (e.g. "January 12"). null = any date
//        duration  : days it lasts from `date` (omit or 1 = single day)
//        weekday   : "Monday" etc. (null = any weekday; use null for multi-day)
//        flags     : story flags that must be set (case-insensitive; [] = none)
//      priority  : higher numbers are listed first when events overlap
//
//    All conditions are AND-ed together.
// =============================================================================
const EVENT_REGISTRY = [

  // ---- EXAMPLE 1: a single-day event ---------------------------------------
  {
    id: "example_festival",
    title: "Town Festival",
    keys: "Festival, Celebration",
    entry: "A festival fills the streets today — music, food stalls, and crowds in a good mood.",
    conditions: { date: "January 12", duration: 1, weekday: null, flags: [] },
    priority: 5
  },

  // ---- EXAMPLE 2: a multi-day event ----------------------------------------
  // duration counts INCLUSIVELY from `date`:  (last day - first day) + 1
  // e.g. January 8 through January 11  ->  (11 - 8) + 1  ->  duration: 4
  {
    id: "example_busy_week",
    title: "Busy Week",
    keys: "Busy Week, Deadline",
    entry: "It is a demanding stretch of days; everyone is stretched thin and short on time.",
    conditions: { date: "January 8", duration: 4, weekday: null, flags: [] },
    priority: 8
  },

  // ---- EXAMPLE 3: a flag-gated event (no date) ------------------------------
  // Shows only while the "storm" flag is set. Turn it on/off in play with:
  //     /setflag storm      and      /removeflag storm
  {
    id: "example_flag_gated",
    title: "Storm Warning",
    keys: "Storm, Warning, Weather",
    entry: "A storm warning is in effect. People are staying indoors and plans are being cancelled.",
    conditions: { date: null, duration: 1, weekday: null, flags: ["storm"] },
    priority: 9
  }

  // Add your own events below, following the same format.
];

/* ---- EXAMPLE: school-flavoured events ----------------------------------------
   {
     id: "spring_dance_announcement",
     title: "Spring Dance Announcement",
     keys: "Spring Dance, Announcement, School",
     entry: "The Events Committee announces the upcoming Spring Dance on April 12. Students are encouraged to find partners.",
     conditions: { date: "April 1", duration: 7, weekday: null, flags: [] },
     priority: 10
   },
   {
     id: "finals_week",
     title: "Finals Week",
     keys: "Finals, Exams, School",
     entry: "Final exams take place this week. Students are focused on studying and the campus is tense.",
     conditions: { date: "April 8", duration: 4, weekday: null, flags: [] },
     priority: 8
   }
   ---------------------------------------------------------------------------- */


/* =============================================================================
   ENGINE — no need to edit below this line.
   ============================================================================= */

function initCalendar() {
  if (!state.calendarSystem) {
    state.calendarSystem = {
      month:       CALENDAR_CONFIG.startMonth,
      day:         CALENDAR_CONFIG.startDay,
      year:        CALENDAR_CONFIG.startYear,
      weekday:     CALENDAR_CONFIG.startWeekday,
      timeOfDay:   CALENDAR_CONFIG.startTime,
      turnCounter: 0,
      flags:       []
    };
  }
}

function advanceDay() {
  const cal = state.calendarSystem;
  cal.day += 1;
  if (cal.day > CALENDAR_CONFIG.daysPerMonth) {
    cal.day = 1;
    const monthIdx = (MONTHS.indexOf(cal.month) + 1) % MONTHS.length;
    cal.month = MONTHS[monthIdx];
    if (monthIdx === 0) cal.year += 1;   // rolled past the last month
  }
  const widx = (WEEKDAYS.indexOf(cal.weekday) + 1) % WEEKDAYS.length;
  cal.weekday = WEEKDAYS[widx];
  cal.timeOfDay = TIMES_OF_DAY[0];
}

function advanceTime() {
  const cal = state.calendarSystem;
  const tidx = TIMES_OF_DAY.indexOf(cal.timeOfDay);
  if (tidx >= TIMES_OF_DAY.length - 1) advanceDay();
  else cal.timeOfDay = TIMES_OF_DAY[tidx + 1];
}

// A "Month Day" pair as a linear day number inside one year.
function dateToOrdinal(month, day) {
  const mi = MONTHS.indexOf(month);
  if (mi < 0) return -1;
  return mi * CALENDAR_CONFIG.daysPerMonth + day;
}

// Parse a "January 12" style string into { month, day }.
function parseDateString(str) {
  if (typeof str !== "string") return null;
  const m = str.trim().match(/^([A-Za-z]+)\s+(\d+)$/);
  if (!m) return null;
  return {
    month: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase(),
    day: parseInt(m[2], 10)
  };
}

// The true weekday for any date in the year, anchored on the configured start
// date. Lets the weekday stay correct even after a /setday jump.
function weekdayForDate(month, day) {
  const startOrd  = dateToOrdinal(CALENDAR_CONFIG.startMonth, CALENDAR_CONFIG.startDay);
  const startIdx  = WEEKDAYS.indexOf(CALENDAR_CONFIG.startWeekday);
  const targetOrd = dateToOrdinal(month, day);
  if (startOrd < 0 || startIdx < 0 || targetOrd < 0) return null;
  const n = WEEKDAYS.length;
  const idx = (((startIdx + (targetOrd - startOrd)) % n) + n) % n;
  return WEEKDAYS[idx];
}

function conditionsMatch(conditions) {
  if (!conditions) return true;
  const cal = state.calendarSystem;

  // `date` is the START day; with `duration` the event stays active for the
  // whole span [start, start + duration - 1].
  if (conditions.date) {
    const start = parseDateString(conditions.date);
    if (!start) return false;
    const duration = (conditions.duration && conditions.duration > 0) ? conditions.duration : 1;
    const startOrd = dateToOrdinal(start.month, start.day);
    const endOrd   = startOrd + duration - 1;
    const curOrd   = dateToOrdinal(cal.month, cal.day);
    if (curOrd < startOrd || curOrd > endOrd) return false;
  }

  if (conditions.weekday && conditions.weekday !== cal.weekday) return false;

  // Flags are compared case-insensitively, so "Storm" and "storm" both work.
  if (conditions.flags && conditions.flags.length > 0) {
    const set = (cal.flags || []).map(f => String(f).toLowerCase());
    for (const f of conditions.flags) {
      if (set.indexOf(String(f).toLowerCase()) === -1) return false;
    }
  }

  return true;
}

function getDateLine() {
  const cal = state.calendarSystem;
  return `Current Date: ${cal.weekday}, ${cal.month} ${cal.day}, Year ${cal.year} (${cal.timeOfDay})`;
}

// -----------------------------------------------------------------------------
// THE CALENDAR CARD
// One always-on story card, rebuilt every turn from the current date.
// -----------------------------------------------------------------------------
const CALENDAR_CARD_TITLE = "📅 Calendar";
const CALENDAR_CARD_KEYS  = "you,.,!,?,";   // always-on triggers: match almost any action
const CALENDAR_CARD_TYPE  = "calendar";

function getTodaySchedule() {
  const entry = DAILY_SCHEDULE[state.calendarSystem.weekday];
  return (typeof entry === "string" && entry.trim()) ? entry.trim() : null;
}

// Every event active today, highest priority first.
function getActiveEvents() {
  return EVENT_REGISTRY
    .filter(e => conditionsMatch(e.conditions))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

function buildCalendarEntry() {
  const cal = state.calendarSystem;
  const lines = [`{${getDateLine()}}`];

  const schedule = getTodaySchedule();
  if (schedule) lines.push(`{${SCHEDULE_LABEL}: ${schedule}}`);

  for (const e of getActiveEvents()) lines.push(`{${e.title}: ${e.entry}}`);

  return lines.join("\n");
}

function syncCalendarCard() {
  const cal = state.calendarSystem;

  // Keep the weekday honest: recompute it from the date every turn, so a
  // /setday jump lands on the right weekday (and therefore the right schedule).
  const trueWd = weekdayForDate(cal.month, cal.day);
  if (trueWd) cal.weekday = trueWd;

  const entry = buildCalendarEntry();
  const idx = (storyCards || []).findIndex(c => c.type === CALENDAR_CARD_TYPE);

  if (idx === -1) {
    addStoryCard(CALENDAR_CARD_KEYS, entry, CALENDAR_CARD_TYPE);
  } else {
    // updateStoryCard() is the ONLY reliable way to change a card — assigning
    // card.entry directly does NOT persist across turns.
    updateStoryCard(idx, CALENDAR_CARD_KEYS, entry, CALENDAR_CARD_TYPE);
  }

  const card = (storyCards || []).find(c => c.type === CALENDAR_CARD_TYPE);
  if (card) card.title = CALENDAR_CARD_TITLE;
}

// -----------------------------------------------------------------------------
// COMMANDS
// -----------------------------------------------------------------------------
const DAY_PHRASES  = ["end the day", "pass the day", "next day", "go to sleep"];
const TIME_PHRASES = ["pass time", "time passes", "later that day"];

function handleCommand(text) {
  if (!text || typeof text !== "string") return null;
  const cmd = text.trim().toLowerCase();

  // Advance phrases arrive WRAPPED depending on how the player submitted them:
  //   Story -> "end the day"
  //   Do    -> "> You end the day"
  //   Say   -> '> You say, "end the day"'
  // Strip the wrapper, quotes and trailing punctuation, then match.
  const action = cmd
    .replace(/^>\s*/, "")
    .replace(/^you\s+say\s*,?\s*/, "")
    .replace(/^you\s+/, "")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/[.!]+$/, "")
    .trim();

  // Advance NOW (not in the output hook) so the Calendar card and the AI both
  // see the new day on this very turn.
  if (DAY_PHRASES.includes(action)) {
    advanceDay();
    const c = state.calendarSystem;
    return `${text}\n\n[ A day passes — it's now ${c.weekday}, ${c.month} ${c.day}, Year ${c.year} (${c.timeOfDay}) ]`;
  }
  if (TIME_PHRASES.includes(action)) {
    advanceTime();
    const c = state.calendarSystem;
    return `${text}\n\n[ Time passes — it's now ${c.timeOfDay} on ${c.weekday}, ${c.month} ${c.day} ]`;
  }

  // Slash commands must be typed as a STORY action (they start with "/").
  if (!cmd.startsWith("/")) return null;
  const parts = cmd.split(/\s+/);
  const command = parts[0];

  if (command === "/date") {
    state.message = getDateLine();
    return "";
  }

  if (command === "/setday" && parts.length >= 3) {
    const month = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    const day = parseInt(parts[2], 10);
    if (MONTHS.includes(month) && day >= 1 && day <= CALENDAR_CONFIG.daysPerMonth) {
      state.calendarSystem.month = month;
      state.calendarSystem.day = day;
      state.message = `Date set to ${month} ${day}`;
    } else {
      state.message = `Usage: /setday <Month> <Day>   e.g. /setday ${MONTHS[0]} 15`;
    }
    return "";
  }

  if (command === "/setflag" && parts[1]) {
    const flag = parts.slice(1).join(" ");
    if (!state.calendarSystem.flags.includes(flag)) state.calendarSystem.flags.push(flag);
    state.message = `Flag set: ${flag}`;
    return "";
  }

  if (command === "/removeflag" && parts[1]) {
    const flag = parts.slice(1).join(" ");
    state.calendarSystem.flags = state.calendarSystem.flags.filter(f => f !== flag);
    state.message = `Flag removed: ${flag}`;
    return "";
  }

  if (command === "/listflags") {
    const f = state.calendarSystem.flags;
    state.message = f.length ? "Flags set: " + f.join(", ") : "No flags set.";
    return "";
  }

  if (command === "/listevents") {
    state.message = "Events:\n" + EVENT_REGISTRY.map(e => `- ${e.id}: ${e.title}`).join("\n");
    return "";
  }

  return null;
}

// -----------------------------------------------------------------------------
// HOOKS
// -----------------------------------------------------------------------------
function input(text) {
  initCalendar();
  const result = handleCommand(text);
  return result !== null ? result : text;
}

function context(text) {
  initCalendar();
  syncCalendarCard();   // refresh the card before the AI generates
  // Prepend the date so the AI always has it, even on a turn where the card's
  // triggers happen not to fire. (We never write state.memory — that belongs
  // to the player's Plot Essentials.)
  return { text: `${getDateLine()}\n${text}` };
}

function output(text) {
  initCalendar();
  const cal = state.calendarSystem;
  cal.turnCounter = (cal.turnCounter || 0) + 1;
  syncCalendarCard();
  return text;
}

// Initialize on load
initCalendar();

globalThis.calendarSystemAPI = {
  input,
  context,
  output,
  initCalendar,
  advanceDay,
  advanceTime,
  getDateLine,
  CALENDAR_CONFIG,
  DAILY_SCHEDULE,
  EVENT_REGISTRY
};

})();
