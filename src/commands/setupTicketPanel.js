const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-ticket-panel')
    .setDescription('Setup the ticket creation panel')
    .setDefaultMemberPermissions(0x8), // Administrator only

  async execute(interaction) {
    try {
      const config = require('../config');
      
      // Check if the channel exists
      const channel = interaction.guild.channels.cache.get(config.ticketPanelChannelId);
      if (!channel) {
        await interaction.reply({
          content: `❌ Channel with ID ${config.ticketPanelChannelId} not found. Please check your configuration.`,
          ephemeral: true
        });
        return;
      }

      // Create the ticket panel embed
      const panelEmbed = new EmbedBuilder()
        .setTitle('🎫 Create a Support Ticket')
        .setDescription('Click the button below to create a new support ticket. Please provide as much detail as possible to help us assist you better.')
        .addFields(
          { 
            name: '📋 Available Categories', 
            value: '• **General** - General questions and support\n• **Bugs** - Report bugs or issues\n• **Suggestions** - Feature requests and suggestions',
            inline: false 
          },
          {
            name: '📝 Required Information',
            value: '• **Title** - Brief description of your issue\n• **Message** - Detailed explanation\n• **Category** - Select the appropriate category',
            inline: false
          }
        )
        .setColor(0x3498db)
        .setTimestamp()
        .setFooter({ text: 'Support Ticket System' });

      // Create the create ticket button
      const createButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );

      // Send the panel message
      await channel.send({
        embeds: [panelEmbed],
        components: [createButton]
      });

      await interaction.reply({
        content: `✅ Ticket panel has been set up in <#${config.ticketPanelChannelId}>`,
        ephemeral: true
      });

      console.log(`✅ Ticket panel setup completed by ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Error setting up ticket panel:', error);
      await interaction.reply({
        content: '❌ Failed to setup ticket panel. Please check your configuration and try again.',
        ephemeral: true
      });
    }
  }
};
