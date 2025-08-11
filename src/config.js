require('dotenv').config();

const config = {
  // Discord Bot Configuration
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  
  // Guild and Channel IDs with defaults
  guildId: process.env.GUILD_ID || '1403842178580484358',
  ticketPanelChannelId: process.env.TICKET_PANEL_CHANNEL_ID || '1403880541761044621',
  staffTeamRoleId: process.env.STAFF_TEAM_ROLE_ID || '1403852263554023545',
  // Backward compatible single ticket category id (used if specific mapping missing)
  ticketChannelCategoryId: process.env.TICKET_CHANNEL_CATEGORY_ID || '1403880428233818112',
  // Category-specific channel category IDs
  ticketCategoryIds: {
    General: process.env.TICKET_CATEGORY_GENERAL_ID || '1403897055310647336',
    Bugs: process.env.TICKET_CATEGORY_BUGS_ID || '1403880428233818112',
    Suggestions: process.env.TICKET_CATEGORY_SUGGESTIONS_ID || '1403897167239839758'
  },
  
  // Webhook Configuration
  webhookUrl: process.env.WEBHOOK_URL,
  webhookMessageTemplate: process.env.WEBHOOK_MESSAGE_TEMPLATE || 'New ticket created: {title} by {user} in category {category}',
  
  // GitHub Configuration
  githubToken: process.env.GITHUB_TOKEN,
  githubRepo: process.env.GITHUB_REPO || 'owner/repo',
  githubLabels: process.env.GITHUB_LABELS ? process.env.GITHUB_LABELS.split(',') : ['discord-ticket']
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

// GitHub token is optional - only warn if not provided
if (!config.githubToken) {
  console.warn('⚠️  GITHUB_TOKEN not provided - GitHub issue conversion will be disabled');
}

module.exports = config;
