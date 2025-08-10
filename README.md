# Discord Ticket Bot

A Discord bot that creates a ticket system with three categories (General, Bugs, Suggestions) and sends webhook notifications. Built with Node.js, Discord.js, and pnpm.

## Features

- 🎫 **Ticket Creation**: Users can create tickets with title, message, and category
- 📋 **Three Categories**: General, Bugs, and Suggestions
- 🔒 **Private Channels**: Tickets create private Discord channels visible only to the submitter and staff
- 🔔 **Webhook Notifications**: Configurable webhook URL for external notifications
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

## Discord Setup

### Required Discord Structure

1. **Guild/Server**: Your Discord server
2. **Ticket Panel Channel**: Public channel where users can create tickets
3. **Staff Team Role**: Role for staff members who can see all tickets
4. **Ticket Category**: Private category where ticket channels are created

### Bot Permissions

The bot needs these permissions in your Discord server:
- **Manage Channels**: To create ticket channels
- **Send Messages**: To send ticket information
- **Read Message History**: To read ticket messages
- **Use Slash Commands**: To register and use commands
- **Manage Roles**: To set channel permissions

### Channel Permissions

The ticket category should be private and only accessible to staff members. The bot will automatically set proper permissions for each ticket channel.

## Usage

### Creating Tickets

1. Users click the "Create Ticket" button in the ticket panel
2. Fill out the modal with:
   - **Title**: Brief description of the issue
   - **Message**: Detailed explanation
   - **Category**: General, Bugs, or Suggestions
3. A private channel is created with proper permissions
4. Webhook notification is sent (if configured)

### Managing Tickets

- **Staff members** can see all tickets in the private category
- **Ticket creators** can only see their own tickets
- **Close button** allows staff to close and archive tickets

### Commands

- `/setup-ticket-panel` (Admin only): Creates the ticket panel message in the configured `TICKET_PANEL_CHANNEL_ID`.
- `/delete-ticket` (Staff only): Deletes the current ticket channel after confirmation.
- `/create-transcript [user:@member]` (Staff only): Generates a transcript of the current ticket and sends it via DM. If `user` is provided, the transcript is sent to that user; otherwise it is sent to the ticket creator.
- `/ticket-summon user:@member` (Staff only): Grants the specified user access to the current ticket channel (View Channel, Send Messages, Read Message History).
- `/ticket-publish reason:<text>` (Staff only): Makes the current ticket publicly visible (read-only for everyone except staff) and posts an embed with the given reason.

Notes:
- Closing a ticket is done via the “Close Ticket” button inside each ticket channel.