// commands/help.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs   = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, '../db/db.json');

/* --------- Texte principal de l’embed --------- */
const mainEmbed = `
- \`/help\` - Affiche la page de help
- \`/setlog <channel>\` - Met en place le salon de logs du VoiceMaster (ADMIN)
- \`/setchannel <vocal>\` - Met en place le salon vocal de création de vocal privé (ADMIN)
- \`/kick <utilisateur>\` - Expulse un membre du vocal privé (propriétaire du vocal)
- \`/lock\` - Verrouille votre vocal privé (propriétaire du vocal)
- \`/unlock\` - Déverrouille votre vocal privé (propriétaire du vocal)
- \`/allow <utilisateur>\` - Autorise un membre à rejoindre même si le vocal est lock (propriétaire)
- \`/deny <utilisateur>\` - Retire l’autorisation précédemment accordée (propriétaire)
- \`/rename <nom>\` - Renomme votre vocal privé (propriétaire)
- \`/transfer <utilisateur>\` - Transfère la propriété du vocal (propriétaire)
- \`/limit <nombre>\` - Change la limite de places du vocal (propriétaire)
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription("Affiche l'aide du bot"),

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async execute(interaction) {
    /* ---------- Embed commun ---------- */
    const embed = new EmbedBuilder()
      .setTitle('Menu d’aide')
      .setColor('#03e3fc')
      .setThumbnail('https://static-00.iconduck.com/assets.00/speaking-head-emoji-2015x2048-rdktkbi7.png')
      .setDescription(mainEmbed.trim())
      .setFooter({
        text: '🌊 BeachBots by @indeciss',
        iconURL: 'https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png',
      });

    /* ---------- Infos supplémentaires pour les administrateurs ---------- */
    if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      let logChannelMention   = 'Aucun défini';
      let voiceChannelMention = 'Aucun défini';

      try {
        const raw = await fs.readFile(DB_FILE, 'utf8');
        const db  = JSON.parse(raw);

        if (db.logChannelId)   logChannelMention   = `<#${db.logChannelId}>`;
        if (db.voiceChannelId) voiceChannelMention = `<#${db.voiceChannelId}>`;
      } catch {
        /* fichier absent ou invalide → valeurs par défaut conservées */
      }

      embed.addFields(
        { name: 'Salon de logs actuel',   value: logChannelMention,   inline: true },
        { name: 'Salon vocal actuel',     value: voiceChannelMention, inline: true },
      );
    }

    /* ---------- Réponse éphémère ---------- */
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
