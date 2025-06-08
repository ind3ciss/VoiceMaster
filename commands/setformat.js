// commands/setformat.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, '../db/db.json');

async function readJSON(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return {}; }
}
async function writeJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setformat')
    .setDescription('Définit le format de nom des salons vocaux privés')
    .addStringOption(opt =>
      opt.setName('format')
         .setDescription('Format contenant la variable {username}')
         .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const format = interaction.options.getString('format');

    // Validation : {username} est obligatoire
    if (!format.includes('{username}')) {
      const err = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('`❌` Le format doit contenir la variable `{username}`.');
      return interaction.reply({ embeds: [err], ephemeral: true });
    }

    const db = await readJSON(DB_FILE);
    db.nameFormat = format;
    await writeJSON(DB_FILE, db);

    const ok = new EmbedBuilder()
      .setColor('#00c957')
      .setDescription(`\`✅\` Le format des salons est maintenant : **\`${format}\`**`);
    await interaction.reply({ embeds: [ok], ephemeral: true });
  },
};
