const axios = require('axios');
const config = require('../config');

class WebhookService {
  constructor() {
    this.webhookUrl = config.webhookUrl;
    this.template = config.webhookMessageTemplate;
  }

  async sendTicketNotification(ticketData) {
    if (!this.webhookUrl) {
      console.log('⚠️  No webhook URL configured, skipping webhook notification');
      return;
    }

    try {
      const message = this.formatMessage(ticketData);
      
      await axios.post(this.webhookUrl, {
        content: message,
        embeds: [{
          title: `🎫 New Ticket: ${ticketData.title}`,
          description: ticketData.message,
          fields: [
            {
              name: 'Category',
              value: ticketData.category,
              inline: true
            },
            {
              name: 'Submitted by',
              value: ticketData.user,
              inline: true
            },
            {
              name: 'Channel',
              value: `<#${ticketData.channelId}>`,
              inline: true
            }
          ],
          color: this.getCategoryColor(ticketData.category),
          timestamp: new Date().toISOString()
        }]
      });

      console.log('✅ Webhook notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send webhook notification:', error.message);
    }
  }

  formatMessage(ticketData) {
    return this.template
      .replace('{title}', ticketData.title)
      .replace('{user}', ticketData.user)
      .replace('{category}', ticketData.category);
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

module.exports = new WebhookService();
