# Study Server Bot

Node.js port of the Discord study-server bot.

## Features

- Screen share enforcement in a study voice channel
- Welcome embed for new members
- `@everyone` spam moderation with timeout
- Introduction panel with button and modal
- Admin-only `/announce` slash command
- Alert panel with modal, day picker, view, and delete actions
- Persistent reminder storage in `data/alerts.json`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with these values:

```env
TOKEN=your-bot-token
STUDY_VC_ID=0
ALERT_CHANNEL_ID=0
WELCOME_CHANNEL_ID=0
INTRO_PANEL_CHANNEL_ID=0
INTRO_OUTPUT_CHANNEL_ID=0
ADMIN_ROLE_ID=0
ALERT_PANEL_CHANNEL_ID=0
```

3. Start the bot:

```bash
npm start
```

## Notes

- The bot needs the `Guild Members`, `Guild Voice States`, and `Message Content` intents enabled in the Discord developer portal.
- `ADMIN_ROLE_ID` controls who can use `/announce`.
- `data/alerts.json` is created automatically if missing.
