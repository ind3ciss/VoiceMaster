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
    .setName('rename')
    .setDescription('Renomme votre salon vocal privé')
    .addStringOption(opt =>
      opt.setName('nom')
         .setDescription('Nouveau nom du salon vocal')
         .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const member  = interaction.member;
    const guild   = interaction.guild;
    const channel = interaction.channel;
    const newName = interaction.options.getString('nom');

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

    // 5. Renommer le vocal
    await userVoice.setName(newName);

    const confirmEmbed = new EmbedBuilder()
      .setColor('#ff23aa')
      .setDescription(`\`✏️\` Le salon a été renommé en **${newName}**.`);
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: false });

    const logEmbed = new EmbedBuilder()
      .setColor('#ff23aa')
      .setDescription(`\`✏️\` \`${member.user.tag}\` a renommé son salon privé en **\`${userVoice.name}\`**`)
    await logToChannel(guild, config.logChannelId, logEmbed);
  },
};
