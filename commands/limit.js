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

async function logToChannel(guild, logChannelId, embed) {
  if (!logChannelId) return;
  const logChannel = guild.channels.cache.get(logChannelId);
  if (logChannel && logChannel.isTextBased()) {
    try { await logChannel.send({ embeds: [embed] }); } catch {}
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limit')
    .setDescription('Définit une limite de membres pour votre salon vocal privé')
    .addIntegerOption(opt =>
      opt.setName('nombre')
         .setDescription('Nombre maximum de membres (entre 2 et 99)')
         .setRequired(true)
         .setMinValue(2)
         .setMaxValue(99)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const member    = interaction.member;
    const guild     = interaction.guild;
    const channel   = interaction.channel;
    const maxUsers  = interaction.options.getInteger('nombre');

    const voiceDB = await readJSON(VOICE_DB_FILE);
    const config  = await readJSON(CONFIG_FILE);

    // 1. Vérifie que l'utilisateur est dans un vocal
    if (!member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Vous devez être connecté à votre salon vocal privé.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userVoice = member.voice.channel;

    // 2. Vérifie que le vocal est géré
    if (!voiceDB[userVoice.id]) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Ce salon n’est pas un salon privé géré par le bot.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 3. Vérifie que la commande est exécutée dans le salon texte lié
    if (channel.id !== userVoice.id) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Cette commande doit être utilisée dans le salon texte lié à votre vocal.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 4. Vérifie que l'utilisateur est le propriétaire
    const ownerId = voiceDB[userVoice.id];
    if (member.id !== ownerId) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Seul le propriétaire du salon peut utiliser cette commande.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 5. Appliquer la limite
    await userVoice.setUserLimit(maxUsers);

    const confirmEmbed = new EmbedBuilder()
      .setColor('#e06fff')
      .setDescription(`\`👥\` Le salon est désormais limité à **${maxUsers}** membre(s).`);
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: false });

    const logEmbed = new EmbedBuilder()
      .setColor('#e06fff')
      .setDescription(`\`👥\` \`${member.user.tag}\` a défini une limite de **\`${maxUsers}\`** membres sur le salon **\`${userVoice.name}\`**`)
    await logToChannel(guild, config.logChannelId, logEmbed);
  },
};
