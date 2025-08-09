const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const InteractionHandler = require('./handlers/interactionHandler');

class TicketBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.client.commands = new Collection();
    this.interactionHandler = new InteractionHandler(this.client);

    this.setupEventHandlers();
    this.loadCommands();
  }

  setupEventHandlers() {
    // Ready event
    this.client.once('ready', () => {
      console.log(`✅ Bot is ready! Logged in as ${this.client.user.tag}`);
      console.log(`📊 Serving ${this.client.guilds.cache.size} guild(s)`);
      console.log(`🎫 Ticket system initialized`);
    });

    // Interaction create event
    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await this.handleSlashCommand(interaction);
        } else if (interaction.isButton() || interaction.isModalSubmit()) {
          await this.interactionHandler.handleInteraction(interaction);
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
    });

    // Error handling
    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });

    process.on('unhandledRejection', (error) => {
      console.error('❌ Unhandled promise rejection:', error);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      process.exit(1);
    });
  }

  async loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        this.client.commands.set(command.data.name, command);
        console.log(`📝 Loaded command: ${command.data.name}`);
      } else {
        console.log(`⚠️  Command at ${filePath} is missing required "data" or "execute" property`);
      }
    }
  }

  async handleSlashCommand(interaction) {
    const command = this.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);
      
      const reply = {
        content: '❌ There was an error while executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }

  async registerCommands() {
    try {
      console.log('🔄 Registering slash commands...');
      
      const commands = Array.from(this.client.commands.values()).map(command => command.data.toJSON());
      
      // Register commands for the specific guild (faster than global)
      const guild = this.client.guilds.cache.get(config.guildId);
      if (guild) {
        await guild.commands.set(commands);
        console.log(`✅ Successfully registered ${commands.length} slash command(s) for guild: ${guild.name}`);
      } else {
        console.log('⚠️  Guild not found, registering commands globally (may take up to 1 hour to appear)');
        await this.client.application.commands.set(commands);
        console.log(`✅ Successfully registered ${commands.length} slash command(s) globally`);
      }
    } catch (error) {
      console.error('❌ Error registering commands:', error);
    }
  }

  async start() {
    try {
      console.log('🚀 Starting Discord Ticket Bot...');
      
      // Login to Discord
      await this.client.login(config.discordToken);
      
      // Register slash commands
      await this.registerCommands();
      
      console.log('✅ Bot started successfully!');
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }
}

// Start the bot
const bot = new TicketBot();
bot.start();
