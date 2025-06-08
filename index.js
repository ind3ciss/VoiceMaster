require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// Récupère TOUS les intents
const allIntents = Object.values(GatewayIntentBits).reduce((a, b) => a | b, 0);

// Crée le client avec tous les intents et tous les partials
const client = new Client({
    intents: allIntents,
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.GuildScheduledEvent
    ]
});

// Collections pour les commandes
client.commands = new Collection();

// Chargement dynamique des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else if (command.name && command.execute) {
        client.commands.set(command.name, command);
    }
}

// Chargement dynamique des événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Connexion au bot avec le TOKEN du .env
client.login(process.env.TOKEN);
