const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
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
        await this.showTicketModal(interaction);
        break;
      case 'close_ticket':
        await this.ticketHandler.closeTicket(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Unknown button interaction.',
          ephemeral: true
        });
    }
  }

  async handleModalSubmit(interaction) {
    if (interaction.customId === 'ticket_modal') {
      await this.processTicketSubmission(interaction);
    }
  }

  async showTicketModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal')
      .setTitle('Create Support Ticket');

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

    // Category input
    const categoryInput = new TextInputBuilder()
      .setCustomId('ticket_category')
      .setLabel('Category (General/Bugs/Suggestions)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter: General, Bugs, or Suggestions')
      .setRequired(true)
      .setMaxLength(20);

    // Add inputs to modal
    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(categoryInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    await interaction.showModal(modal);
  }

  async processTicketSubmission(interaction) {
    try {
      const title = interaction.fields.getTextInputValue('ticket_title');
      const message = interaction.fields.getTextInputValue('ticket_message');
      const category = interaction.fields.getTextInputValue('ticket_category');

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
}

module.exports = InteractionHandler;
