const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const TicketHandler = require('./ticketHandler');

class InteractionHandler {
  constructor(client) {
    this.client = client;
    this.ticketHandler = new TicketHandler(client);
  }

  async handleInteraction(interaction) {
    try {
      if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this.handleSelectMenu(interaction);
      }
    } catch (error) {
      console.error('❌ Error handling interaction:', error);
      const reply = {
        content: '❌ An error occurred while processing your request. Please try again.',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }

  async handleButtonInteraction(interaction) {
    switch (interaction.customId) {
      case 'create_ticket':
        await this.showCategorySelection(interaction);
        break;
      case 'close_ticket':
        await this.ticketHandler.closeTicket(interaction);
        break;
      case 'confirm_delete_ticket':
        await this.deleteTicket(interaction);
        break;
      case 'cancel_delete_ticket':
        await this.cancelDeleteTicket(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Unknown button interaction.',
          ephemeral: true
        });
    }
  }

  async handleModalSubmit(interaction) {
    if (interaction.customId.startsWith('ticket_modal_')) {
      await this.processTicketSubmission(interaction);
    }
  }

  async handleSelectMenu(interaction) {
    if (interaction.customId === 'category_select') {
      await this.showTicketModal(interaction, interaction.values[0]);
    }
  }

  async showCategorySelection(interaction) {
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder('Select a category for your ticket')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('General')
          .setDescription('General questions and support')
          .setValue('General')
          .setEmoji('❓'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bugs')
          .setDescription('Report bugs or issues')
          .setValue('Bugs')
          .setEmoji('🐛'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Suggestions')
          .setDescription('Feature requests and suggestions')
          .setValue('Suggestions')
          .setEmoji('💡')
      );

    const row = new ActionRowBuilder().addComponents(categorySelect);

    await interaction.reply({
      content: 'Please select a category for your ticket:',
      components: [row],
      ephemeral: true
    });
  }

  async showTicketModal(interaction, selectedCategory) {
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${selectedCategory}`)
      .setTitle(`Create Support Ticket - ${selectedCategory}`);

    // Title input
    const titleInput = new TextInputBuilder()
      .setCustomId('ticket_title')
      .setLabel('Ticket Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Brief description of your issue')
      .setRequired(true)
      .setMaxLength(100);

    // Message input
    const messageInput = new TextInputBuilder()
      .setCustomId('ticket_message')
      .setLabel('Detailed Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Please provide detailed information about your issue, bug report, or suggestion...')
      .setRequired(true)
      .setMaxLength(1000);

    // Add inputs to modal (only title and message visible)
    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageInput);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);
  }

  async processTicketSubmission(interaction) {
    try {
      const title = interaction.fields.getTextInputValue('ticket_title');
      const message = interaction.fields.getTextInputValue('ticket_message');
      
      // Extract category from modal custom ID
      const category = interaction.customId.replace('ticket_modal_', '');

      // Validate category
      const validCategories = ['General', 'Bugs', 'Suggestions'];
      if (!validCategories.includes(category)) {
        await interaction.reply({
          content: '❌ Invalid category. Please use: General, Bugs, or Suggestions',
          ephemeral: true
        });
        return;
      }

      // Show processing message
      await interaction.reply({
        content: '⏳ Creating your ticket...',
        ephemeral: true
      });

      // Create the ticket
      const ticketData = {
        title: title,
        message: message,
        category: category
      };

      await this.ticketHandler.createTicket(interaction, ticketData);

    } catch (error) {
      console.error('❌ Error processing ticket submission:', error);
      await interaction.reply({
        content: '❌ Failed to process ticket submission. Please try again.',
        ephemeral: true
      });
    }
  }

  async deleteTicket(interaction) {
    try {
      const channel = interaction.channel;
      
      // Delete the channel
      await channel.delete();
      console.log(`🗑️ Ticket channel deleted: ${channel.name} by ${interaction.user.tag}`);
      
    } catch (error) {
      console.error('❌ Error deleting ticket channel:', error);
      await interaction.reply({
        content: '❌ Failed to delete the ticket channel. Please try again or contact an administrator.',
        ephemeral: true
      });
    }
  }

  async cancelDeleteTicket(interaction) {
    try {
      await interaction.update({
        content: '❌ Ticket deletion cancelled.',
        components: [],
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Error cancelling ticket deletion:', error);
    }
  }
}

module.exports = InteractionHandler;
