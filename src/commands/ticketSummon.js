const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-summon')
    .setDescription('Add a specified user to the current ticket channel (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to add to this ticket')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const channel = interaction.channel;

      // Ensure this is used inside a ticket channel
      if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('closed-')) {
        await interaction.reply({
          content: '❌ This command can only be used in ticket channels.',
          ephemeral: true
        });
        return;
      }

      const config = require('../config');
      const staffRole = interaction.guild.roles.cache.get(config.staffTeamRoleId);

      // Ensure invoker is staff
      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        await interaction.reply({
          content: '❌ You do not have permission to add users to tickets. Staff role required.',
          ephemeral: true
        });
        return;
      }

      const user = interaction.options.getUser('user');
      if (!user) {
        await interaction.reply({ content: '❌ Please specify a valid user.', ephemeral: true });
        return;
      }

      // Fetch member to ensure they are in the guild
      let member;
      try {
        member = await interaction.guild.members.fetch(user.id);
      } catch {
        await interaction.reply({ content: '❌ That user is not a member of this server.', ephemeral: true });
        return;
      }

      // Check if user already has access
      const hasAccess = channel.permissionsFor(member)?.has([
        PermissionFlagsBits.ViewChannel
      ]);
      if (hasAccess) {
        await interaction.reply({ content: `ℹ️ <@${member.id}> already has access to this ticket.`, ephemeral: true });
        return;
      }

      // Grant permissions to the user for this channel
      await channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      await interaction.reply({
        content: `✅ Added <@${member.id}> to this ticket.`,
        ephemeral: true
      });

      // Notify the channel
      await channel.send({ content: `👋 <@${member.id}> has been added to this ticket by <@${interaction.user.id}>.` });

    } catch (error) {
      console.error('❌ Error in ticket-summon command:', error);
      try {
        await interaction.reply({ content: '❌ Failed to add the user to this ticket.', ephemeral: true });
      } catch {}
    }
  }
};
