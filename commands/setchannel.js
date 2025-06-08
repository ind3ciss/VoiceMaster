// commands/setchannel.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const fs   = require('fs/promises');
const path = require('path');

const COOLDOWN_MS = 10_000;                          // 10 s
const DB_FILE     = path.join(__dirname, '../db/db.json');

// Map en mémoire : guildId → timestamp
const cooldowns = new Map();

/* -------- Embeds réutilisables -------- */
const noAdminEmbed = new EmbedBuilder()
  .setDescription('`❌` Vous devez être administrateur.')
  .setColor('#ff0000');

const wrongTypeEmbed = new EmbedBuilder()
  .setDescription('`❌` Seuls les salons **vocaux classiques** sont acceptés.')
  .setColor('#ff0000');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Définit le salon vocal utilisé par le bot')
    .addChannelOption(opt =>
      opt.setName('vocal')
         .setDescription('Salon vocal (obligatoire)')
         .setRequired(true)
         .addChannelTypes(ChannelType.GuildVoice)   // la liste ne montre que les vocaux
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
    if (now - lastUsed < COOLDOWN_MS) return;        // rejet silencieux
    cooldowns.set(interaction.guildId, now);

    /* 3) Validation du salon */
    const channel = interaction.options.getChannel('vocal');
    if (channel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ embeds: [wrongTypeEmbed], ephemeral: true });
    }

    /* 4) Écriture dans db.json */
    let db = {};
    try {
      const raw = await fs.readFile(DB_FILE, 'utf8');
      db = JSON.parse(raw);
    } catch {
      /* fichier absent ou vide → on part d’un objet vide */
    }

    db.voiceChannelId = channel.id;
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));

    /* 5) Confirmation */
    const successEmbed = new EmbedBuilder()
      .setDescription(`\`✅\` Salon vocal défini sur ${channel}`)
      .setColor('#03e3fc');

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  },
};
