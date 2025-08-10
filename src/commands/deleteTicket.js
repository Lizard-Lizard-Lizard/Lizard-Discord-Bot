const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-ticket')
    .setDescription('Delete the current ticket channel (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      const channel = interaction.channel;
      
      // Check if this is actually a ticket channel
      if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('closed-')) {
        await interaction.reply({
          content: '❌ This command can only be used in ticket channels.',
          ephemeral: true
        });
        return;
      }

      // Check if user has staff role
      const config = require('../config');
      const staffRole = interaction.guild.roles.cache.get(config.staffTeamRoleId);
      
      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        await interaction.reply({
          content: '❌ You do not have permission to delete tickets. Staff role required.',
          ephemeral: true
        });
        return;
      }

      // Create confirmation buttons
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_delete_ticket')
        .setLabel('Delete Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️');

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_delete_ticket')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌');

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      // Send confirmation message
      await interaction.reply({
        content: '⚠️ **Warning**: This will permanently delete this ticket channel and all its messages. This action cannot be undone.',
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Error in delete-ticket command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing the delete command. Please try again.',
        ephemeral: true
      });
    }
  }
};
