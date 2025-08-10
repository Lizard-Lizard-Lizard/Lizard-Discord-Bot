const { 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const webhookService = require('../utils/webhook');

class TicketHandler {
  constructor(client) {
    this.client = client;
    this.config = require('../config');
  }

  async createTicket(interaction, ticketData) {
    try {
      const guild = this.client.guilds.cache.get(this.config.guildId);
      // Choose the appropriate category by ticket type with fallbacks
      const categoryIdByType = this.config.ticketCategoryIds?.[ticketData.category] || this.config.ticketChannelCategoryId;
      const category = guild.channels.cache.get(categoryIdByType);
      const staffRole = guild.roles.cache.get(this.config.staffTeamRoleId);

      if (!guild || !category || !staffRole) {
        throw new Error('Required guild, category, or staff role not found');
      }

      // Create ticket channel with format: ticket-<category>-<username>-<id>
      const sanitize = (value) => {
        return String(value)
          .toLowerCase()
          .replace(/[^a-z0-9-_]+/g, '-')
          .replace(/-{2,}/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 24);
      };

      const shortId = Date.now().toString().slice(-4);
      const channelName = `ticket-${sanitize(ticketData.category)}-${sanitize(interaction.user.username)}-${shortId}`;
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category,
        topic: `Ticket for ${interaction.user.tag} | creatorId:${interaction.user.id} | category:${ticketData.category}`,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone role
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id, // Ticket creator
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: staffRole.id, // Staff team
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          },
          {
            id: this.client.user.id, // Bot
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels
            ]
          }
        ]
      });

      // Create ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 Ticket: ${ticketData.title}`)
        .setDescription(ticketData.message)
        .addFields(
          { name: 'Category', value: ticketData.category, inline: true },
          { name: 'Submitted by', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor(this.getCategoryColor(ticketData.category))
        .setTimestamp()
        .setFooter({ text: `Ticket ID: ${ticketChannel.id}` });

      // Create close button
      const closeButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );

      await ticketChannel.send({
        content: `<@${interaction.user.id}> <@&${this.config.staffTeamRoleId}>`,
        embeds: [ticketEmbed],
        components: [closeButton]
      });

      // Send webhook notification
      await webhookService.sendTicketNotification({
        title: ticketData.title,
        message: ticketData.message,
        category: ticketData.category,
        user: interaction.user.tag,
        channelId: ticketChannel.id
      });

      // Acknowledge to user without throwing (modal submit path uses reply/editReply)
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({
            content: `✅ Ticket created successfully! Check <#${ticketChannel.id}>`,
            embeds: [],
            components: []
          });
        } else {
          await interaction.reply({
            content: `✅ Ticket created successfully! Check <#${ticketChannel.id}>`,
            ephemeral: true
          });
        }
      } catch {}

      console.log(`✅ Ticket created: ${ticketChannel.name} by ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({
            content: '❌ Failed to create ticket. Please try again or contact an administrator.',
            embeds: [],
            components: []
          });
        } else {
          await interaction.reply({
            content: '❌ Failed to create ticket. Please try again or contact an administrator.',
            ephemeral: true
          });
        }
      } catch {}
    }
  }

  async closeTicket(interaction) {
    try {
      const channel = interaction.channel;
      
      // Check if this is actually a ticket channel
      if (!channel.name.startsWith('ticket-')) {
        await interaction.reply({
          content: '❌ This command can only be used in ticket channels.',
          ephemeral: true
        });
        return;
      }

      // Create closing embed
      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Closed')
        .setDescription(`This ticket has been closed by ${interaction.user.tag}`)
        .setColor(0xe74c3c)
        .setTimestamp();

      await channel.send({ embeds: [closeEmbed] });

      // Archive the channel (rename it to indicate it's closed)
      await channel.setName(`closed-${channel.name}`);

      // Remove all permissions except staff
      const staffRole = interaction.guild.roles.cache.get(this.config.staffTeamRoleId);
      
      await channel.permissionOverwrites.set([
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: this.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ]);

      await interaction.reply({
        content: '✅ Ticket closed successfully. The channel has been archived.',
        ephemeral: true
      });

      console.log(`✅ Ticket closed: ${channel.name} by ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Error closing ticket:', error);
      await interaction.reply({
        content: '❌ Failed to close ticket. Please try again or contact an administrator.',
        ephemeral: true
      });
    }
  }

  getCategoryColor(category) {
    const colors = {
      'General': 0x3498db,    // Blue
      'Bugs': 0xe74c3c,       // Red
      'Suggestions': 0x2ecc71  // Green
    };
    return colors[category] || 0x95a5a6; // Default gray
  }
}

module.exports = TicketHandler;
