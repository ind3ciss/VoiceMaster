// events/interactionCreate.js
const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,

  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    // On ne traite que les commandes slash
    if (!interaction.isChatInputCommand()) return;

    // Récupère la commande dans la Collection chargée au démarrage
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);           // Lance l’exécution réelle
    } catch (error) {
      console.error(`⚠️ Erreur dans la commande ${interaction.commandName} -`, error);

      const errorEmbed = new EmbedBuilder()
            .setDescription(`# \`❌\` Une erreur est survenue !\nN'hésitez pas à nous contacter sur [notre serveur support](https://discord.gg/beachbots) pour nous signaler ce problème !`)
            .setColor('#ff0000');

      // Évite les doubles réponses (si la commande a déjà répondu ou différé)
      if (interaction.replied || interaction.deferred) {
        // On tente un follow-up privé, sans planter si ce n’est pas possible
        try {
          await interaction.followUp({
            embeds: [errorEmbed],
            ephemeral: true,
          });
        } catch { /* nada */ }
      } else {
        await interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }
    }
  },
};
