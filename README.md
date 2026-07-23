CALENDAR & EVENT SYSTEM  —  COMPLETE GUIDE

  An AI Dungeon scenario script that tracks an in-game date and
  time, and maintains a single auto-updating "Calendar" story card
  showing the date, the day's class schedule, and active events.

  CONTENTS
    1. What's in the package
    2. Installation
    3. Setting your start date
    4. The Calendar card
    5. Advancing time
    6. Commands
    7. Time-of-day progression
    8. Adding & editing events
    9. Editing the class schedule
   9a. Classmates in class
   9b. Birthdays
   10. How events work (under the hood)
   11. Events shipped with this script
   12. Good to know / limits
   13. Running alongside the NPC Relationship System
   14. Troubleshooting


------------------------------------------------------------------
  1. WHAT'S IN THE PACKAGE
------------------------------------------------------------------
You have 4 script files:

  Calendar Event System.js   the core logic (the "library")
  input.js                   input hook
  context.js                 context hook
  output.js                  output hook


------------------------------------------------------------------
  2. INSTALLATION
------------------------------------------------------------------
In your AI Dungeon scenario:

  1. Calendar Event System.js  ->  Script Card (Library)
     - Create a new Script Card and paste the full file in.
     - This MUST load before the hooks.

  2. input.js    ->  Input Hook
  3. context.js  ->  Context Hook
  4. output.js   ->  Output Hook

After any edit to a file, re-paste that file into its slot.
Only Calendar Event System.js changes when you add/edit events or
schedules; the three hook files rarely need re-pasting.


------------------------------------------------------------------
  3. SETTING YOUR START DATE
------------------------------------------------------------------
Open Calendar Event System.js and find CALENDAR_CONFIG near the top:

  startMonth:   "May"
  startDay:     12
  startYear:    1
  startWeekday: "Monday"
  startTime:    "Morning"
  daysPerMonth: 30

Change these to your scenario's starting point.

IMPORTANT: set startWeekday to the correct day for your start date.
From there everything stays in sync automatically — the script
recomputes the weekday from the date each turn (anchored on this start
date), so even a /setday jump lands on the right weekday and schedule.

Tip: state is created once at the start of an adventure. If you
change the start date after already playing, begin a fresh
adventure (or use /setday) so the new values take effect.


------------------------------------------------------------------
  4. THE CALENDAR CARD
------------------------------------------------------------------
The script creates and maintains ONE story card named "Calendar".
You never edit it by hand. It is rewritten every turn and looks like:

  {Current Date: Monday, May 12, Year 1 (Morning)}
  {Today's Periods: English Composition (8:30am to 10:00am), ...}
  {Classmates today — English Composition: Sora, Ethan, Airi, ... | Social Psychology: Suzune, ...}
  {Summer Kick-Off Party Announcement: The Events Committee ...}

- Updates itself in place (no duplicate cards).
- Its triggers fire on almost every action, so the AI always has the
  current date and schedule in context.
- "Classmates in <Class>" lines list which NPCs share each of today's
  class periods (see section 9a). Lunch and weekends get no such line.


------------------------------------------------------------------
  5. ADVANCING TIME   (type these as a STORY action — not Do/Say)
------------------------------------------------------------------
Advance a full day:
  end the day  /  pass the day  /  next day  /  go to sleep

Advance one part of the day:
  pass time  /  time passes  /  later that day

When time advances you'll see a confirmation line in the output:
  [ A day passes - it's now Tuesday, May 13, Year 1 (Morning) ]
  [ Time passes - it's now Afternoon on Monday, May 12 ]


------------------------------------------------------------------
  6. COMMANDS   (type as a STORY action)
------------------------------------------------------------------
  /date                    show the current date
  /setday <Month> <Day>    jump to a date   e.g. /setday June 8
                           (weekday + schedule auto-correct that turn)
  /major <name>            set the player's major  e.g. /major psychology
  /setflag <FlagName>      set a story flag e.g. /setflag FirstTerm
  /removeflag <FlagName>   remove a story flag
  /listevents              list every registered event

A command still produces an AI turn (AI Dungeon can't suppress that
from the input hook), but the command text won't leak into the
story, and the result appears as a system message.


------------------------------------------------------------------
  7. TIME-OF-DAY PROGRESSION
------------------------------------------------------------------
  Morning -> Afternoon -> Evening -> Night -> (next day) Morning


------------------------------------------------------------------
  8. ADDING & EDITING EVENTS
------------------------------------------------------------------
Find EVENT_REGISTRY in Calendar Event System.js. Each event:

  {
    id: "spring_dance",      // unique id (don't reuse)
    title: "Spring Dance",   // label shown on its card line
    keys: "Spring Dance, Dance, School",
    entry: "Text the AI sees while this event is active.",
    conditions: {
      date: "April 12",      // START day; null = any date
      duration: 1,           // OPTIONAL days from `date` (omit/1 = single day)
      weekday: null,         // null = any weekday (use null for multi-day)
      flags: [],             // required flags ([] = none); see /setflag
      recurring: false
    },
    priority: 5              // higher = listed first when events overlap
  }

MULTI-DAY EVENTS
  Set `duration` to the number of days, counted INCLUSIVELY from the
  start date, and set weekday to null.
      2 days -> duration: 2        a week -> duration: 7
  Formula:  duration = (end day - start day) + 1
      April 8 to April 11  ->  (11 - 8) + 1 = 4  ->  duration: 4

DATE-ONLY vs FLAG-GATED
  - Pure date : the event shows by date/duration alone.
  - Flag-gated: add a flag name to `flags`; the event then shows only
                while BOTH the date AND the flag are active.
  - All conditions are AND-ed (date AND weekday AND flags).

PRIORITY
  Only matters when two or more events are active on the SAME day —
  higher numbers are listed first on the card.

PHASED EVENTS  (announcement -> countdown -> event day)
  For a build-up event, use these fields INSTEAD of `conditions`:

    {
      id: "summer_festival",
      title: "Summer Festival",
      keys: "Festival, Fireworks, School",
      date: "July 27",      // the EVENT day
      duration: 1,          // event length (omit/1 = single day)
      announce: { date: "July 13",
                  entry: "The Summer Festival is announced..." },
      countdown: { entry: "{title} is in {n} days.",   // OPTIONAL
                   tomorrow: "{title} is tomorrow!" },  // OPTIONAL
      entry: "The Summer Festival fills the campus tonight...",
      priority: 9
    }

  - The announcement shows for ONE day (announce.date).
  - The countdown then runs automatically: it starts on the MONDAY of
    the event's week (one week EARLIER for multi-day events), but never
    before the day after the announcement. "{n}" = days left; the last
    day uses the `tomorrow` line.
  - On the event day(s) the main `entry` shows; afterward it disappears.
  - countdown is OPTIONAL — omit it for the defaults ("<title> is in
    {n} days." / "<title> is tomorrow!").
  - STATIC events (anything with `conditions`, no `announce`) still
    work exactly as before — keep using them for simple date windows.


------------------------------------------------------------------
  9. EDITING THE CLASS SCHEDULE
------------------------------------------------------------------
The "Today's Periods" line is built from the MAJORS registry in
Calendar Event System.js, NOT from events. Each major lists 3 subjects
per weekday (Mon-Fri); they pair with CLASS_TIMES by position, with
lunch in the middle. Saturday is a shared half-day "Club Activities"
block; Sunday is a day off.

  - To change a major's classes: edit that major's weekday arrays in
    MAJORS.
  - To change the shared General Education courses (the cross-major
    classes everyone shares): edit GEN_EDS.
  - To change the bell times: edit CLASS_TIMES.

The player's major is detected from the opening (a "Major: X" line, or
the major's name appearing in the prose) and can be set or tested
in-game with /major.


------------------------------------------------------------------
  9a. CLASSMATES IN CLASS
------------------------------------------------------------------
The card adds ONE condensed line listing the NPCs who share each of
today's class periods:
    {Classmates today — <Class>: Name, Name | <Class>: Name, ...}
(Kept to a single line to keep the always-on card light.) They come
from NPC_ROSTER in Calendar Event System.js. Each NPC entry has three
fields:

  name    the name shown on the card
  major   a MAJORS key — the NPC shares EVERY period of that major
  genEd   one shared gen-ed ("section") where the player meets them
          even when their majors differ

When an NPC shows up:
  - Same major as the player -> in ALL of the player's class periods.
  - Different major          -> only in their assigned gen-ed period
                                (the cross-major meeting ground).
  - On a gen-ed period the two groups are merged and de-duplicated.
  - Lunch, Saturday, and Sunday never show classmate lines.

To change who the player meets where, edit an NPC's `genEd` (or
`major`) in NPC_ROSTER, then re-paste Calendar Event System.js.


------------------------------------------------------------------
  9b. BIRTHDAYS
------------------------------------------------------------------
On a character's birthday the card adds a line:
    {Birthday: It's <Name>'s birthday today!}
These come from the BIRTHDAYS list in Calendar Event System.js — just
a name + "Month Day". Multiple birthdays on one day are combined into
a single line.

  { name: "Sora", date: "June 9" },

NOTE: months are 30 days, so a "31st" never occurs. The two characters
with a 31st birthday are triggered on the 1st of the next month instead
(Isabel May 31 -> June 1, Yoruha Oct 31 -> Nov 1).


------------------------------------------------------------------
  10. HOW EVENTS WORK (UNDER THE HOOD)
------------------------------------------------------------------
- There is ONE auto-managed "Calendar" card, rebuilt every turn from
  the current date. It shows the date, the matching weekday schedule,
  and a line for each active event.
- A STATIC event's line appears whenever its conditions match the
  current day; a PHASED event shows its announcement, then a countdown,
  then the event line (see section 8). Birthday lines come from the
  BIRTHDAYS list (section 9b).
- Card content is written through updateStoryCard() so changes
  persist; this is why the date/schedule refresh correctly each day.


------------------------------------------------------------------
  11. EVENTS SHIPPED WITH THIS SCRIPT
------------------------------------------------------------------
PHASED (announcement -> countdown -> event):
  Summer Kick-Off Party    announced May 16, party Fri May 30
  Beach & Pool Day         announced May 26, event Sat June 8
  Cooking Competition      announced June 10, event Sat June 22
  Midterms Week            announced June 17, exams Mon-Thu July 1-4
  Campus Stargazing Night  announced June 24, event Sat July 6
  Open Mic & Talent Show   announced July 5, event Fri July 12
  Summer Festival          announced July 13, fireworks Sat July 27

STATIC:
  Club & Sport Sign-Ups    May 12-18
  Finals Week Announcement July 15-21
  Finals Week              Aug 6-9

Class schedules come from the MAJORS registry (section 9); birthdays
come from the BIRTHDAYS list (section 9b).


------------------------------------------------------------------
  12. GOOD TO KNOW / LIMITS
------------------------------------------------------------------
- Set startWeekday correctly for your start date; from there the
  weekday stays in sync automatically (recomputed from the date each
  turn), so /setday no longer leaves the weekday/schedule wrong.
- A multi-day event or countdown that crosses the YEAR boundary (the
  April->May rollover) won't carry across it. Spans inside a single
  year work fine.
- `recurring` no longer affects whether an event shows (the card is
  rebuilt from current conditions each turn); it's kept for
  compatibility.
- Type advance commands and slash commands as STORY input, not as
  Do or Say actions.


------------------------------------------------------------------
  13. RUNNING ALONGSIDE THE NPC RELATIONSHIP SYSTEM
------------------------------------------------------------------
Both scripts can run in the same scenario at once. Make sure both
library script cards are loaded. The hooks are separate — each
system has its own set of 3 hook files.


------------------------------------------------------------------
  14. TROUBLESHOOTING
------------------------------------------------------------------
Card not updating to the new day?
  Make sure you re-pasted the latest Calendar Event System.js. The
  card updates via updateStoryCard(); older drafts that assigned the
  entry directly would freeze on the creation-day content.

An event isn't appearing?
  Check ALL of its conditions for the current day: date/duration,
  weekday, and flags must all match. A leftover flag requirement is
  the most common cause. Use /listevents to confirm it's registered,
  and /date to confirm the current date.

A command got written into the story?
  Make sure you typed it as a STORY action. (The script still can't
  stop the AI from taking a turn on a command — that's an AI Dungeon
  limitation — but the command text should not appear in the prose.)
==================================================================
