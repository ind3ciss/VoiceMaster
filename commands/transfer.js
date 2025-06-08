const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const VOICE_DB_FILE = path.join(__dirname, '../db/voicedb.json');
const CONFIG_FILE   = path.join(__dirname, '../db/db.json');

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
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfère la propriété de votre salon vocal privé')
    .addUserOption(opt =>
      opt.setName('utilisateur')
         .setDescription('Nouveau propriétaire')
         .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const member     = interaction.member;
    const guild      = interaction.guild;
    const channel    = interaction.channel;
    const newOwner   = interaction.options.getMember('utilisateur');

    const voiceDB = await readJSON(VOICE_DB_FILE);
    const config  = await readJSON(CONFIG_FILE);

    if (!member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Vous devez être connecté à votre salon vocal privé.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userVoice = member.voice.channel;

    if (!voiceDB[userVoice.id]) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Ce salon n’est pas un salon privé géré par le bot.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (channel.id !== userVoice.id) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Cette commande doit être utilisée dans le salon texte lié à votre vocal.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const currentOwnerId = voiceDB[userVoice.id];
    if (member.id !== currentOwnerId) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Seul le propriétaire du salon peut utiliser cette commande.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vérifie que le nouveau propriétaire est un membre du serveur
    if (!newOwner || newOwner.user.bot) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Utilisateur invalide ou bot non autorisé.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Supprime les permissions de l'ancien propriétaire
    await userVoice.permissionOverwrites.edit(currentOwnerId, {
      ManageChannels: false,
      MoveMembers: false,
      Connect: null,
      Speak: null,
    });

    // Applique les permissions au nouveau propriétaire
    await userVoice.permissionOverwrites.edit(newOwner.id, {
      ManageChannels: true,
      MoveMembers: true,
      Connect: true,
      Speak: true,
    });

    // Met à jour le propriétaire dans la voicedb
    voiceDB[userVoice.id] = newOwner.id;
    await writeJSON(VOICE_DB_FILE, voiceDB);

    const confirmEmbed = new EmbedBuilder()
      .setColor('#fbff00')
      .setDescription(`\`✅\` La propriété du salon a été transférée à **${newOwner.user.username}**.`);
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: false });

    const logEmbed = new EmbedBuilder()
      .setColor('#fbff00')
      .setDescription(`\`👑\` \`${member.user.tag}\` a transféré le salon **\`${userVoice.name}\`** à **\`${newOwner.user.tag}\`**`)
    await logToChannel(guild, config.logChannelId, logEmbed);
  },
};
