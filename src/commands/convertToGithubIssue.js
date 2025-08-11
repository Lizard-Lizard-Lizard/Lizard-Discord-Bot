const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('convert-to-github')
    .setDescription('Convert this ticket to a GitHub issue (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Title for the GitHub issue')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Additional description for the issue (optional)')
        .setRequired(false)
        .setMaxLength(1000)
    ),

  async execute(interaction) {
    try {
      const channel = interaction.channel;
      const config = require('../config');
      
      // Check if this is actually a ticket channel
      if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('closed-')) {
        await interaction.reply({
          content: '❌ This command can only be used in ticket channels.',
          ephemeral: true
        });
        return;
      }

      // Check if user has staff role
      const staffRole = interaction.guild.roles.cache.get(config.staffTeamRoleId);
      
      if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
        await interaction.reply({
          content: '❌ You do not have permission to convert tickets to GitHub issues. Staff role required.',
          ephemeral: true
        });
        return;
      }

      // Check if GitHub is configured
      if (!config.githubToken) {
        await interaction.reply({
          content: '❌ GitHub integration is not configured. Please contact an administrator.',
          ephemeral: true
        });
        return;
      }

      // Defer reply since this might take a while
      await interaction.deferReply({ ephemeral: true });

      const title = interaction.options.getString('title');
      const additionalDescription = interaction.options.getString('description') || '';

      // Generate transcript and get participants
      const transcript = await this.generateTranscript(channel);
      const participants = await this.getTicketParticipants(channel);
      
      // Create GitHub issue
      const issueData = await this.createGitHubIssue(title, transcript, additionalDescription, channel, participants);
      
      if (!issueData) {
        await interaction.editReply({
          content: '❌ Failed to create GitHub issue. Please check your GitHub configuration.',
          ephemeral: true
        });
        return;
      }

      // Create embed for the conversion notification
      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Converted to GitHub Issue')
        .setDescription(`This ticket has been converted to a developer issue for better tracking and resolution.`)
        .addFields(
          { 
            name: '📋 Issue Title', 
            value: title, 
            inline: false 
          },
          {
            name: '🔗 GitHub Issue',
            value: `[View Issue #${issueData.number}](${issueData.html_url})`,
            inline: true
          },
          {
            name: '🆔 Issue ID',
            value: `#${issueData.number}`,
            inline: true
          },
          {
            name: '👤 Converted by',
            value: interaction.user.tag,
            inline: true
          }
        )
        .setColor(0x2ea043) // GitHub green
        .setTimestamp()
        .setFooter({ text: 'GitHub Issue Conversion' });

      // Add participants information if available
      if (participants && participants.length > 0) {
        const creators = participants.filter(p => p.isCreator);
        const staff = participants.filter(p => p.isStaff && !p.isCreator);
        
        if (creators.length > 0) {
          embed.addFields({
            name: '🎫 Original Reporter',
            value: creators.map(c => c.displayName).join(', '),
            inline: true
          });
        }
        
        if (staff.length > 0) {
          embed.addFields({
            name: '👥 Staff Involved',
            value: staff.map(s => s.displayName).join(', '),
            inline: true
          });
        }
      }

      // Send the embed to the channel (visible to everyone)
      await channel.send({ embeds: [embed] });

      // Send confirmation to the staff member
      await interaction.editReply({
        content: `✅ Successfully converted ticket to GitHub issue!\n🔗 [View Issue #${issueData.number}](${issueData.html_url})`,
        ephemeral: true
      });

      console.log(`✅ Ticket converted to GitHub issue #${issueData.number} by ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Error converting ticket to GitHub issue:', error);
      
      const errorMessage = !interaction.replied && !interaction.deferred 
        ? '❌ Failed to convert ticket to GitHub issue. Please try again.'
        : '❌ An error occurred while converting the ticket.';
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.editReply({ content: errorMessage });
        }
      } catch (replyError) {
        console.error('❌ Failed to send error reply:', replyError);
      }
    }
  },

  async generateTranscript(channel) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = [...messages.values()].reverse();
      
      let transcript = `# Discord Ticket Transcript\n\n`;
      transcript += `**Channel:** ${channel.name}\n`;
      transcript += `**Created:** ${channel.createdAt.toISOString()}\n`;
      transcript += `**Category:** ${channel.parent?.name || 'Unknown'}\n\n`;
      transcript += `---\n\n`;

      for (const message of sortedMessages) {
        const timestamp = message.createdAt.toISOString();
        const author = message.member?.displayName || message.author.username;
        const content = message.content || '*[No text content]*';
        
        transcript += `**${author}** - ${timestamp}\n`;
        transcript += `${content}\n\n`;
        
        // Add attachments if any
        if (message.attachments.size > 0) {
          for (const attachment of message.attachments.values()) {
            transcript += `📎 [${attachment.name}](${attachment.url})\n`;
          }
          transcript += '\n';
        }
      }

      return transcript;
    } catch (error) {
      console.error('❌ Error generating transcript:', error);
      return 'Error generating transcript';
    }
  },

  async getTicketParticipants(channel) {
    try {
      const participants = new Map();
      const config = require('../config');
      
      // Get all messages to find participants
      const messages = await channel.messages.fetch({ limit: 100 });
      
      // Add message authors as participants
      for (const message of messages.values()) {
        if (!message.author.bot) {
          const member = message.member;
          if (member) {
            participants.set(member.id, {
              id: member.id,
              username: member.user.username,
              displayName: member.displayName,
              tag: member.user.tag,
              isStaff: member.roles.cache.has(config.staffTeamRoleId),
              isCreator: false // Will be updated below
            });
          }
        }
      }

      // Try to identify ticket creator from channel topic
      const topic = channel.topic || '';
      const creatorMatch = topic.match(/creatorId:(\d{17,20})/);
      let creatorId = null;

      if (creatorMatch && creatorMatch[1]) {
        creatorId = creatorMatch[1];
      } else {
        // Fallback: check permission overwrites for non-staff member with ViewChannel
        const overwrites = channel.permissionOverwrites.cache;
        for (const overwrite of overwrites.values()) {
          if (overwrite.type === 1 && overwrite.allow.has('ViewChannel')) { // Member type
            try {
              const member = await channel.guild.members.fetch(overwrite.id);
              if (member && !member.user.bot && !member.roles.cache.has(config.staffTeamRoleId)) {
                creatorId = member.id;
                break;
              }
            } catch {}
          }
        }
      }

      // Mark creator if found
      if (creatorId && participants.has(creatorId)) {
        participants.get(creatorId).isCreator = true;
      }

      return Array.from(participants.values());
    } catch (error) {
      console.error('❌ Error getting ticket participants:', error);
      return [];
    }
  },

  async createGitHubIssue(title, transcript, additionalDescription, channel, participants) {
    try {
      const config = require('../config');
      
      const [owner, repo] = config.githubRepo.split('/');
      if (!owner || !repo) {
        throw new Error('Invalid GitHub repository format. Use "owner/repo"');
      }

      const issueBody = this.formatIssueBody(transcript, additionalDescription, channel, participants);
      
      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          title: title,
          body: issueBody,
          labels: config.githubLabels
        },
        {
          headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Lizard-Discord-Bot'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error creating GitHub issue:', error.response?.data || error.message);
      return null;
    }
  },

  formatIssueBody(transcript, additionalDescription, channel, participants) {
    let body = '';
    
    if (additionalDescription) {
      body += `## Additional Description\n${additionalDescription}\n\n`;
    }
    
    body += `## Discord Ticket Information\n`;
    body += `- **Channel:** ${channel.name}\n`;
    body += `- **Category:** ${channel.parent?.name || 'Unknown'}\n`;
    body += `- **Created:** ${channel.createdAt.toISOString()}\n\n`;
    
    if (participants && participants.length > 0) {
      body += `## Ticket Participants\n\n`;
      
      // Separate creators and staff
      const creators = participants.filter(p => p.isCreator);
      const staff = participants.filter(p => p.isStaff && !p.isCreator);
      const others = participants.filter(p => !p.isStaff && !p.isCreator);
      
      if (creators.length > 0) {
        body += `**Ticket Creator:**\n`;
        creators.forEach(creator => {
          body += `- ${creator.displayName} (@${creator.username})\n`;
        });
        body += '\n';
      }
      
      if (staff.length > 0) {
        body += `**Staff Members:**\n`;
        staff.forEach(member => {
          body += `- ${member.displayName} (@${member.username})\n`;
        });
        body += '\n';
      }
      
      if (others.length > 0) {
        body += `**Other Participants:**\n`;
        others.forEach(member => {
          body += `- ${member.displayName} (@${member.username})\n`;
        });
        body += '\n';
      }
    }
    
    body += `## Ticket Transcript\n\n`;
    body += `\`\`\`markdown\n${transcript}\n\`\`\``;
    
    return body;
  }
};
