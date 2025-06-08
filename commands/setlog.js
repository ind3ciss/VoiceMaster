// commands/setlog.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const fs   = require('fs/promises');
const path = require('path');

const COOLDOWN_MS = 10_000;                          // 10 s
const DB_FILE     = path.join(__dirname, '../db/db.json');

// Map en mémoire : guildId → timestamp
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('Définit le salon où seront envoyés les logs')
    .addChannelOption(opt =>
      opt.setName('channel')
         .setDescription('Salon de logs (texte uniquement)')
         .setRequired(true)
         // Autorise *uniquement* les salons textuels « classiques »
         .addChannelTypes(ChannelType.GuildText)
    ),

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async execute(interaction) {
    /* 1) Vérifier permissions */
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Vous devez être administrateur.',
        ephemeral: true,
      });
    }

    /* 2) Cool-down par serveur */
    const now      = Date.now();
    const lastUsed = cooldowns.get(interaction.guildId) ?? 0;
    if (now - lastUsed < COOLDOWN_MS) return;         // rejet silencieux
    cooldowns.set(interaction.guildId, now);

    /* 3) Récupérer et valider le salon */
    const channel = interaction.options.getChannel('channel');

    const channelTypeEmbed = new EmbedBuilder()
      .setDescription(`\`❌\` Seuls les salon de types "textuels" sont autorisés`)
      .setColor('#ff0000');

    // Sécurité supplémentaire si la contrainte du builder était retirée
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        embeds: [channelTypeEmbed],
        ephemeral: true,
      });
    }

    /* 4) Écrire dans db.json */
    let db = {};
    try {
      const raw = await fs.readFile(DB_FILE, 'utf8');
      db = JSON.parse(raw);
    } catch {/* fichier inexistant ou illisible : on continue avec un objet vide */}

    db.logChannelId = channel.id;
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));

    /* 5) Confirmation à l’admin */
    const confirmationEmbed = new EmbedBuilder()
      .setDescription(`\`✅\` Salon de logs défini sur ${channel}`)
      .setColor('#26ff00');

    await interaction.reply({ embeds: [confirmationEmbed], ephemeral: true });
  },
};
