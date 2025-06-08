const { Events, ChannelType } = require('discord.js');
const fs   = require('fs/promises');
const path = require('path');

const CONFIG_FILE   = path.join(__dirname, '../db/db.json');
const VOICE_DB_FILE = path.join(__dirname, '../db/voicedb.json');

/* Helpers */
async function readJSON(file) {
  try   { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return {}; }
}
async function writeJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

module.exports = {
  name: Events.ChannelDelete,

  /**
   * @param {import('discord.js').Channel} channel
   */
  async execute(channel) {
    const guild = channel.guild;

    /* ----- 1. Supprimer le salon vocal privé s’il existe dans voicedb.json ----- */
    const voiceDB = await readJSON(VOICE_DB_FILE);
    if (voiceDB[channel.id]) {
      delete voiceDB[channel.id];
      await writeJSON(VOICE_DB_FILE, voiceDB);
    }

    /* ----- 2. Nettoyage de config globale si salon/catégorie/log supprimés ----- */
    const config = await readJSON(CONFIG_FILE);
    let updated = false;

    // Vérifie toutes les clés configurées
    const keysToCheck = ['voiceChannelId', 'privateCategoryId', 'logChannelId'];
    for (const key of keysToCheck) {
      if (config[key] === channel.id) {
        delete config[key];
        updated = true;
      }
    }

    if (updated) {
      await writeJSON(CONFIG_FILE, config);
    }
  },
};
