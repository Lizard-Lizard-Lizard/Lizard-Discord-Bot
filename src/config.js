require('dotenv').config();

const config = {
  // Discord Bot Configuration
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  
  // Guild and Channel IDs with defaults
  guildId: process.env.GUILD_ID || '1403842178580484358',
  ticketPanelChannelId: process.env.TICKET_PANEL_CHANNEL_ID || '1403880541761044621',
  staffTeamRoleId: process.env.STAFF_TEAM_ROLE_ID || '1403852263554023545',
  ticketChannelCategoryId: process.env.TICKET_CHANNEL_CATEGORY_ID || '1403880428233818112',
  
  // Webhook Configuration
  webhookUrl: process.env.WEBHOOK_URL,
  webhookMessageTemplate: process.env.WEBHOOK_MESSAGE_TEMPLATE || 'New ticket created: {title} by {user} in category {category}'
};

// Validate required configuration
if (!config.discordToken) {
  console.error('❌ DISCORD_TOKEN is required in environment variables');
  process.exit(1);
}

if (!config.clientId) {
  console.error('❌ DISCORD_CLIENT_ID is required in environment variables');
  process.exit(1);
}

module.exports = config;
