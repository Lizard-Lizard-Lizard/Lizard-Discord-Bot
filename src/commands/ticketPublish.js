const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-publish')
    .setDescription('Make this ticket publicly visible and lock replies (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for making this ticket public')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const channel = interaction.channel;
      const reason = interaction.options.getString('reason');
      const config = require('../config');

      // Ensure this is used inside a ticket channel
      if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('closed-')) {
        await interaction.reply({
          content: '❌ This command can only be used in ticket channels.',
          ephemeral: true
        });
        return;
      }

      // Ensure invoker is staff
      const staffRole = interaction.guild.roles.cache.get(config.staffTeamRoleId);
      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        await interaction.reply({
          content: '❌ You do not have permission to publish tickets. Staff role required.',
          ephemeral: true
        });
        return;
      }

      // Parse creator from topic if available
      let creatorId = null;
      if (channel.topic) {
        const match = channel.topic.match(/creatorId:(\d{17,20})/);
        if (match && match[1]) creatorId = match[1];
      }

      // Lock replies and make channel public
      const overwrites = [
        {
          id: interaction.guild.id, // @everyone
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
          ],
          deny: [
            PermissionFlagsBits.SendMessages
          ]
        },
        {
          id: staffRole.id, // Staff team
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages
          ]
        },
        {
          id: interaction.client.user.id, // Bot
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ];

      if (creatorId) {
        overwrites.push({
          id: creatorId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
          ],
          deny: [
            PermissionFlagsBits.SendMessages
          ]
        });
      }

      await channel.permissionOverwrites.set(overwrites);

      // Post publication embed
      const embed = new EmbedBuilder()
        .setTitle('📢 Ticket Made Public')
        .setDescription('This ticket has been published to be viewable by everyone in the server.')
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Published by', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor(0x3498db)
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: '✅ Ticket has been made public and replies have been locked (staff can still post).',
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Error in ticket-publish command:', error);
      try {
        await interaction.reply({
          content: '❌ Failed to publish this ticket. Please try again or contact an administrator.',
          ephemeral: true
        });
      } catch {}
    }
  }
};
