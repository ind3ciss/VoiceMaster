const {
  Events,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
} = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const CONFIG_FILE    = path.join(__dirname, '../db/db.json');
const VOICE_DB_FILE  = path.join(__dirname, '../db/voicedb.json');
const DELETE_DELAY_MS = 5_000;

const deletionTimers = new Map();

/* Helpers */
async function readJSON(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return {}; }
}
async function writeJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}
async function logToChannel(guild, logChannelId, embed) {
  if (!logChannelId) return;
  const logChannel = guild.channels.cache.get(logChannelId);
  if (logChannel && logChannel.isTextBased()) {
    try { await logChannel.send({ embeds: [embed] }); } catch {}
  }
}

module.exports = {
  name: Events.VoiceStateUpdate,

  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async execute(oldState, newState) {
    const guild = newState.guild;
    const user  = newState.member?.user;
    if (!user || user.bot) return;

    let config  = await readJSON(CONFIG_FILE);
    let updated = false;

    // 🔄 Nettoyage automatique des références invalides
    const checkAndRemove = (key) => {
      if (config[key] && !guild.channels.cache.has(config[key])) {
        delete config[key];
        updated = true;
      }
    };
    checkAndRemove('voiceChannelId');
    checkAndRemove('privateCategoryId');
    checkAndRemove('logChannelId');
    if (updated) await writeJSON(CONFIG_FILE, config);

    // ✅ Annule suppression si l'utilisateur revient
    if (newState.channelId && deletionTimers.has(newState.channelId)) {
      clearTimeout(deletionTimers.get(newState.channelId));
      deletionTimers.delete(newState.channelId);
    }

    // 🗑️ Supprimer salon privé vide
    if (oldState.channelId) {
      const leftChannel = guild.channels.cache.get(oldState.channelId);
      if (
        leftChannel &&
        leftChannel.type === ChannelType.GuildVoice &&
        leftChannel.members.size === 0
      ) {
        const voiceDB = await readJSON(VOICE_DB_FILE);
        if (voiceDB[leftChannel.id] && !deletionTimers.has(leftChannel.id)) {
          const timeout = setTimeout(async () => {
            try {
              const refreshed = guild.channels.cache.get(leftChannel.id);
              if (refreshed && refreshed.members.size === 0) {
                await refreshed.delete('Salon vocal privé vide (auto-suppression)');
                const embed = new EmbedBuilder()
                  .setColor('#393a41')
                  .setDescription(`\`🗑️\` Le salon vocal **\`${leftChannel.name}\`** a été supprimé car il était vide.`);
                await logToChannel(guild, config.logChannelId, embed);
              }
            } catch {}
            finally {
              const db = await readJSON(VOICE_DB_FILE);
              delete db[leftChannel.id];
              await writeJSON(VOICE_DB_FILE, db);
              deletionTimers.delete(leftChannel.id);
            }
          }, DELETE_DELAY_MS);
          deletionTimers.set(leftChannel.id, timeout);
        }
      }
    }

    // 🔍 Si pas changement de channel ou mauvais salon → exit
    if (newState.channelId === oldState.channelId) return;
    const setupId = config.voiceChannelId;
    if (!setupId || newState.channelId !== setupId) return;

    const setupChan = guild.channels.cache.get(setupId);
    const categoryId = config.privateCategoryId;
    const targetCat = categoryId
      ? guild.channels.cache.get(categoryId)
      : (setupChan?.parent ?? null);

    // 📦 Lecture du format global
    const rawFormat = config.nameFormat || '🔊・{username}';
    if (!rawFormat.includes('{username}')) return;

    const chanName = rawFormat.replace(/{username}/g, user.username);

    const privateChan = await guild.channels.create({
      name: chanName,
      type: ChannelType.GuildVoice,
      parent: targetCat ?? undefined,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionsBitField.Flags.Connect],
        },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
          ],
        },
      ],
    });

    await newState.setChannel(privateChan);

    const voiceDB = await readJSON(VOICE_DB_FILE);
    voiceDB[privateChan.id] = user.id;
    await writeJSON(VOICE_DB_FILE, voiceDB);

    const embed = new EmbedBuilder()
      .setColor('#0079ff')
      .setDescription(`\`➕\` ${newState.member} a créé le salon **\`${privateChan.name}\`**`);
    await logToChannel(guild, config.logChannelId, embed);
  },
};
