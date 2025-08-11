# Lizard Discord Bot

A Discord bot that creates a ticket system with three categories (General, Bugs, Suggestions) and sends webhook notifications. Built with Node.js, Discord.js, and pnpm.

## Features

- 🎫 **Ticket Creation**: Users can create tickets with title, message, and category
- 📋 **Three Categories**: General, Bugs, and Suggestions
- 🔒 **Private Channels**: Tickets create private Discord channels visible only to the submitter and staff
- 🔔 **Webhook Notifications**: Configurable webhook URL for external notifications
- 🐙 **GitHub Integration**: Convert tickets to GitHub issues with transcript and custom titles
- 📝 **Transcript Generation**: Export ticket conversations for documentation or escalation
- 🐳 **Docker Ready**: Complete Docker and Docker Compose setup for Coolify deployment
- ⚙️ **Configurable**: Environment-based configuration with sensible defaults

## Quick Start

### Prerequisites

1. **Discord Bot Token**: Create a Discord application and bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. **Bot Permissions**: Ensure your bot has the following permissions:
   - Manage Channels
   - Send Messages
   - Read Message History
   - Use Slash Commands
   - Manage Roles (for channel permissions)

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Required
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# Optional (defaults provided)
GUILD_ID=1403842178580484358
TICKET_PANEL_CHANNEL_ID=1403880541761044621
STAFF_TEAM_ROLE_ID=1403852263554023545
TICKET_CHANNEL_CATEGORY_ID=1403880428233818112
# Category-specific parent categories (fallback to TICKET_CHANNEL_CATEGORY_ID if not provided)
TICKET_CATEGORY_GENERAL_ID=1403897055310647336
TICKET_CATEGORY_BUGS_ID=1403880428233818112
TICKET_CATEGORY_SUGGESTIONS_ID=1403897167239839758

# Optional Webhook
WEBHOOK_URL=your_webhook_url_here
WEBHOOK_MESSAGE_TEMPLATE=New ticket created: {title} by {user} in category {category}

# GitHub Configuration (Required for issue conversion)
# Labels Optional: Comma-separated list (default: Discord)
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_REPO=owner/repository_name
GITHUB_LABELS=Discord
```

### Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the bot**:
   ```bash
   pnpm start
   ```

3. **Setup ticket panel** (run in Discord):
   ```
   /setup-ticket-panel
   ```

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **For Coolify deployment**:
   - Use the provided `docker-compose.yml`
   - Set environment variables in Coolify dashboard
   - Deploy using the Docker Compose method

### Commands

- `/setup-ticket-panel` (Admin only): Creates the ticket panel message in the configured `TICKET_PANEL_CHANNEL_ID`.
- `/delete-ticket` (Staff only): Deletes the current ticket channel after confirmation.
- `/create-transcript [user:@member]` (Staff only): Generates a transcript of the current ticket and sends it via DM. If `user` is provided, the transcript is sent to that user; otherwise it is sent to the ticket creator.
- `/ticket-summon user:@member` (Staff only): Grants the specified user access to the current ticket channel (View Channel, Send Messages, Read Message History).
- `/ticket-publish reason:<text>` (Staff only): Makes the current ticket publicly visible (read-only for everyone except staff) and posts an embed with the given reason.
- `/convert-to-github title:<text> [description:<text>]` (Staff only): Converts the current ticket to a GitHub issue with the specified title and optional description. The ticket transcript is included as a code block in the issue body.