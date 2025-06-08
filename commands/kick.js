const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
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
    .setName('kick')
    .setDescription('Expulse un membre de votre salon vocal privé')
    .addUserOption(opt =>
      opt.setName('utilisateur')
         .setDescription('Membre à expulser')
         .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const member = interaction.member;
    const target = interaction.options.getMember('utilisateur');
    const voiceDB = await readJSON(VOICE_DB_FILE);
    const config  = await readJSON(CONFIG_FILE);

    // 1. Vérifie que l'utilisateur est dans un salon vocal
    if (!member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor('#393a41')
        .setDescription('`❌` Vous devez être connecté à votre salon vocal privé.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userVoiceChannel = member.voice.channel;

    // 2. Vérifie que le salon vocal est un salon géré
    if (!voiceDB[userVoiceChannel.id]) {
      const embed = new EmbedBuilder()
        .setColor('#393a41')
        .setDescription('`❌` Ce salon vocal n’est pas un salon privé géré par le bot.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 3. Vérifie que la commande est exécutée dans le salon texte dont l'ID = salon vocal
    if (interaction.channel.id !== userVoiceChannel.id) {
      const embed = new EmbedBuilder()
        .setColor('#393a41')
        .setDescription('`❌` Cette commande ne peut être utilisée que dans le salon **textuel lié** à votre vocal.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 4. Vérifie que l'utilisateur est le propriétaire
    const ownerId = voiceDB[userVoiceChannel.id];
    if (member.id !== ownerId) {
      const embed = new EmbedBuilder()
        .setColor('#393a41')
        .setDescription('`❌` Seul le propriétaire du salon peut utiliser cette commande.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 5. Vérifie que la cible est dans le même salon vocal
    if (!target.voice.channel || target.voice.channel.id !== userVoiceChannel.id) {
      const embed = new EmbedBuilder()
        .setColor('#393a41')
        .setDescription('`❌` L’utilisateur ciblé n’est pas dans votre salon vocal.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 6. Déconnecte la cible
    await target.voice.disconnect();

    // Confirmation publique
    const confirmEmbed = new EmbedBuilder()
      .setColor('#393a41')
      .setDescription(`\`✅\` ${target.user.username} a été expulsé du salon vocal.`);
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: false });

    // Log
    const logEmbed = new EmbedBuilder()
      .setColor('#393a41')
      .setDescription(`\`👢\` \`${member.user.tag}\` a expulsé \`${target.user.tag}\` de **${userVoiceChannel.name}**`)

    await logToChannel(interaction.guild, config.logChannelId, logEmbed);
  },
};
