const fs = require('fs');
const { REST, Routes, ActivityType } = require('discord.js');
const config = require('../config.json');
const path = require('path');

const activityTypeMap = {
    "Playing": ActivityType.Playing,
    "Streaming": ActivityType.Streaming,
    "Listening": ActivityType.Listening,
    "Watching": ActivityType.Watching,
    "Competing": ActivityType.Competing,
    "Custom": ActivityType.Custom
};

async function fileOrUrl(source) {
    // Charge un buffer si chemin local, sinon retourne l’URL
    if (!source) return undefined;
    if (/^https?:\/\//.test(source)) return source;
    // Sinon, chemin local (buffer)
    return fs.promises.readFile(path.resolve(source));
}

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Log démarrage
        console.log(`✅ Connecté en tant que ${client.user.tag}`);

        // Chargement/Sync des commandes globales si non présentes
        const commands = [];
        client.commands.forEach(cmd => {
            if (cmd.data) commands.push(cmd.data.toJSON ? cmd.data.toJSON() : cmd.data);
        });

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        try {
            const currentCmds = await rest.get(
                Routes.applicationCommands(client.user.id)
            );
            if (currentCmds.length !== commands.length) {
                console.log("🔄 Déploiement des commandes slash (globales)...");
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                );
                console.log(`✅ ${commands.length} commandes (re)déployées !`);
            } else {
                console.log('✅ Toutes les commandes sont déjà déployées (globales).');
            }
        } catch (err) {
            console.error('❌ Erreur lors du déploiement des commandes:', err);
        }

        // Statut & présence personnalisée
        try {
            const presenceConfig = config.presence || {};
            const activityConf = presenceConfig.activity || {};
            const typeString = activityConf.type || "Playing";
            const activityType = activityTypeMap[typeString] ?? ActivityType.Playing;

            const activity = {
                name: activityConf.name || "en ligne",
                type: activityType
            };

            if (activityType === ActivityType.Streaming && activityConf.url) {
                activity.url = activityConf.url;
            }

            await client.user.setPresence({
                status: presenceConfig.status || "online",
                activities: [activity]
            });

            console.log(
                `🟢 Presence définie sur "${activityConf.type}" (${activityConf.name})`
                + (activityConf.url ? ` [${activityConf.url}]` : '')
            );
        } catch (err) {
            console.error("❌ Impossible de définir la presence :", err);
        }
    }
};