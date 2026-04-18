# TSB Bot - Telugu Study Buddies

TSB Bot is a Discord productivity and community bot built for Telugu Study Buddies server.
It combines smart buddy matching, study tracking, reminders, quiz duels, and community automation in one bot.

## Core Highlights

### Smart Study Buddy Finder

- Users register subjects with `/registersubject`.
- Subject text is normalized (case-insensitive, stop-word cleanup, abbreviation expansion).
- Matching is server-specific and availability-aware.
- Buddy pairing uses keyword overlap for smarter matches.
- `/findbuddy` returns a private match suggestion.

### Quiz Duel Arena

- `/quiz duel` runs a real-time 1v1 quiz battle.
- Theme-driven question pools with large banks.
- Timed rounds with button answers and speed-bonus scoring.
- `/quiz leaderboard` supports `all_time` and `weekly` rankings.
- `/quiz themes` shows active themes and question counts.

### Focus Mode and Voice Discipline

- Focus role workflow for distraction control.
- Focus session timer and XP scoring.
- Screen-share enforcement in configured study channels.
- Built for accountability in long study sessions.

## What The Bot Can Do

### 1. Smart Study Buddy Finder (Core)

- `/registersubject <subject>` registers your study subject for matching.
- Subject matching is smart and resilient:
  - lowercases input
  - removes stop words such as `and`, `of`, `the`
  - expands common abbreviations such as `algo -> algorithms`, `dsa -> data structures algorithms`
  - extracts normalized keywords
- `/findbuddy` matches only users who:
  - are in the same server
  - are marked `available`
  - are not you
  - share at least 2 keywords with your subject
- If multiple valid matches exist, one is selected randomly.
- `/mysubject` lets users view registration, set availability (`available` or `busy`), or clear registration.

### 2. Study Task Management

- `/tasks` opens an interactive private task panel.
- Supports adding, selecting, completing, removing, and refreshing tasks.
- `/completetask` marks a specific task ID as completed.
- Duplicate pending task protection is included.

### 3. Focus Session XP System

- `/focus start <minutes>` starts a timed focus session.
- XP formula: `weightedVoiceMinutes + (sessionTasks x 15)`.
- Voice multipliers:
  - Focus VC + screen share: `1.2x`
  - Focus VC only: `1.0x`
  - Normal VC: `0.6x`
  - Not in VC: `0x`
- Session is split automatically when user switches VC or toggles stream.
- Leaving VC before timer end gives no XP.
- Sessions under 5 minutes are ignored.
- Optional anti-abuse penalty when user is alone in VC via `ALONE_XP_MULTIPLIER`.

### 4. Focus Task Progress Inside Sessions

- `/task done` works only while a focus session is active.
- Requires user to be in a Focus category VC.
- Maximum 5 task marks per session.
- Minimum 10 minutes between task marks.
- Each valid task adds 15 XP (max 75 task XP per session).

### 5. Focus XP Leaderboard

- `/leaderboard` sorts users by total XP.
- Stores cumulative XP per user in productivity data.

### 6. Quiz Duel System (Core)

- `/quiz duel` starts a 2-player themed quiz duel.
- Theme support includes:
  - `math`
  - `puzzles`
  - `general`
  - `programming`
  - `indian_history`
- Balanced difficulty-aware question selection.
- Timed rounds, answer buttons, and speed bonus scoring.
- Persistent duel stats with wins, losses, draws, streaks.
- `/quiz leaderboard` supports `all_time` and `weekly` scope.
- `/quiz themes` shows theme-wise question counts.

### 7. QOTD (Question Of The Day)

- `/qotd suggest` lets users queue questions.
- Prevents duplicate queue questions and duplicate user queue entries.
- Shows queue position and estimated post date.
- `/qotd post` allows admin-triggered posting.
- Scheduled auto-posting is also supported.

### 8. Facts and Riddles

- `/fact` posts a random fact instantly.
- `/riddle` posts a random riddle embed instantly.
- Background scheduled posting for facts and riddles is supported.

### 9. Alerts and Reminders

- Interactive alert panel with modal + dropdown flow.
- Supports schedule type, delivery mode, and day selection.
- Supports view and delete of saved reminders.
- Reminder data is persisted locally.

### 10. Voice Productivity Automation (Core)

- Study voice channel tracking for study-time analytics.
- Focus mode role workflow support.
- Screen share enforcement in configured study voice channels.

### 11. Community Moderation and Onboarding

- Welcome embed for new members.
- Intro panel + modal submission flow.
- Anti-spam protection against repeated `@everyone` mentions with timeout action.

### 12. Admin and Utility Features

- `/announce` sends admin announcements to selected channels.
- Codeforces service hooks are integrated for contest-related automation.

## Slash Commands

- `/announce`
- `/tasks`
- `/task`
- `/completetask`
- `/focus`
- `/leaderboard`
- `/qotd`
- `/fact`
- `/riddle`
- `/registersubject`
- `/mysubject`
- `/findbuddy`
- `/quiz`

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env` from `.env.example` and fill required values.

Minimum required:

```env
TOKEN=your_bot_token
```

Commonly used configuration:

```env
STUDY_VC_IDS=123456789012345678,987654321098765432
WELCOME_CHANNEL_ID=0
INTRO_PANEL_CHANNEL_ID=0
INTRO_OUTPUT_CHANNEL_ID=0
ADMIN_ROLE_ID=0

ALERT_PANEL_CHANNEL_ID=0
ALERT_CHANNEL_ID=0

LEADERBOARD_CHANNEL_ID=0

QOTD_CHANNEL_ID=0
QOTD_ROLE_ID=0
QOTD_INTERVAL_DAYS=2
QOTD_QUEUED_INTERVAL_DAYS=1

FACTS_CHANNEL_ID=0
FACTS_ROLE_ID=0
FACTS_INTERVAL_DAYS=7

RIDDLE_CHANNEL_ID=0
RIDDLE_DELAY_MINUTES=60

FOCUS_MODE_ROLE_NAME=Focus Mode
DISTRACTION_ROLE_NAMES=Normal,General Access

FOCUS_CATEGORY_ID=0
FOCUS_JOIN_TO_CREATE_CHANNEL_ID=0
FOCUS_JOIN_TO_CREATE_CHANNEL_NAME=Join to Create Focus Room
FOCUS_ROOM_NAME_PREFIX=Focus Room

FOCUS_MINIMUM_SESSION_MINUTES=5
FOCUS_TASK_COOLDOWN_MINUTES=10
FOCUS_MAX_TASKS_PER_SESSION=5
FOCUS_TASK_XP_PER_TASK=15
ALONE_XP_MULTIPLIER=1

CODEFORCES_ALERT_CHANNEL_ID=0
CODEFORCES_PING_ROLE_ID=0
CODEFORCES_POLL_INTERVAL_MINUTES=30
CODEFORCES_REMINDER_LEAD_MINUTES=180
```

3. Start the bot.

```bash
npm start
```

## Quiz Question Tooling

- `npm run quiz:fix` normalizes and repairs quiz question files.
- `npm run quiz:validate` validates schema, counts, answers, and consistency.

## Data Files

The bot creates and maintains local data files automatically inside `data/`, including:

- alerts
- productivity and leaderboard stats
- qotd queue
- facts/riddles state
- buddy registrations
- quiz duel stats

## Notes

- Enable required intents in the Discord Developer Portal, including:
  - Guild Members
  - Guild Voice States
  - Message Content
- Keep `.env` private. Do not commit real secrets.
- Use `.env.example` as the shareable template for your team.
