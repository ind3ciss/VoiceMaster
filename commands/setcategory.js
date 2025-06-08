// commands/setcategory.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const fs   = require('fs/promises');
const path = require('path');

const COOLDOWN_MS = 10_000;                           // 10 s
const DB_FILE     = path.join(__dirname, '../db/db.json');

// Map en mémoire : guildId → timestamp
const cooldowns = new Map();

/* ---------- Embeds réutilisables ---------- */
const noAdminEmbed = new EmbedBuilder()
  .setDescription('`❌` Vous devez être administrateur.')
  .setColor('#ff0000');

const wrongTypeEmbed = new EmbedBuilder()
  .setDescription('`❌` Seules les **catégories** sont autorisées.')
  .setColor('#ff0000');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcategory')
    .setDescription('Définit la catégorie où seront créés les vocaux privés')
    .addChannelOption(opt =>
      opt.setName('categorie')
         .setDescription('Catégorie cible (obligatoire)')
         .setRequired(true)
         .addChannelTypes(ChannelType.GuildCategory)  // Discord ne montre que les catégories
    ),

  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async execute(interaction) {
    /* 1) Vérification des permissions */
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [noAdminEmbed], ephemeral: true });
    }

    /* 2) Cool-down par serveur */
    const now      = Date.now();
    const lastUsed = cooldowns.get(interaction.guildId) ?? 0;
    if (now - lastUsed < COOLDOWN_MS) return;         // rejet silencieux
    cooldowns.set(interaction.guildId, now);

    /* 3) Validation du choix */
    const category = interaction.options.getChannel('categorie');
    if (category.type !== ChannelType.GuildCategory) {
      return interaction.reply({ embeds: [wrongTypeEmbed], ephemeral: true });
    }

    /* 4) Écriture dans db.json */
    let db = {};
    try {
      db = JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
    } catch {
      /* fichier absent ou invalide → on part d’un objet vide */
    }

    db.privateCategoryId = category.id;
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));

    /* 5) Confirmation */
    const successEmbed = new EmbedBuilder()
      .setDescription(`\`✅\` Catégorie définie sur **${category.name}**`)
      .setColor('#03e3fc');

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  },
};
