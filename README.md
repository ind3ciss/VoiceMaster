# 🔊 PrivateVoiceManager

**PrivateVoiceManager** est un bot Discord en **Discord.js** qui permet aux utilisateurs de créer, gérer et personnaliser leurs salons vocaux privés. Il est idéal pour les serveurs communautaires où les membres veulent discuter entre amis dans un espace privé contrôlé. Le bot est simple à configurer et à utiliser pour un serveur unique.

## ⚙️ Fonctionnalités

- **Création automatique de salons vocaux privés** via un salon "setup"
- **Format de nom personnalisable** (`/setformat`) avec `{username}`
- **Vocal lié à un salon texte pour commandes contextuelles**
- **Transfert de propriété** (`/transfer`)
- **Verrouillage / déverrouillage du salon** (`/lock`, `/unlock`)
- **Kick, allow, deny, rename, limit** dans les vocaux privés
- **Suppression automatique des salons inactifs**
- **Logs complets** si un salon de log est défini via `/setlog`

## 🛠️ Commandes principales

| Commande | Description |
|----------|-------------|
| `/setlog <channel>` | Définit le salon de logs |
| `/setchannel <vocal>` | Définit le salon de création de vocaux |
| `/setcategory <catégorie>` | Définit la catégorie pour les vocaux créés |
| `/setformat <format>` | Définit le format de nom personnalisé avec `{username}` |
| `/kick <membre>` | Expulse un utilisateur du vocal privé |
| `/allow <membre>` | Autorise un utilisateur à rejoindre même si le salon est verrouillé |
| `/deny <membre>` | Empêche un utilisateur de rejoindre le salon |
| `/lock` | Verrouille le salon vocal |
| `/unlock` | Déverrouille le salon vocal |
| `/rename <nom>` | Renomme le salon vocal |
| `/limit <nombre>` | Définit une limite de membres entre 2 et 99 |
| `/transfer <membre>` | Transfère la propriété du salon vocal |
| `/help` | Affiche les commandes disponibles |

## 📚 Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votreutilisateur/PrivateVoiceManager.git
   cd PrivateVoiceManager
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer le bot**
   - Créez un fichier `.env` :
     ```
     TOKEN=VOTRE_TOKEN
     APP_ID=ID_DU_BOT
     GUILD_ID=ID_DU_SERVEUR
     ```
   - Personnalisez `config.json` (présence du bot, ID owner, etc.)
   - Le format vocal global se définit dans `db.json` avec la clé `nameFormat` :
     ```json
     {
       "nameFormat": "🔊・{username}"
     }
     ```

4. **Déployer les commandes**
   ```bash
   node deploy-commands.js
   ```

5. **Lancer le bot**
   ```bash
   node index.js
   ```

## 📂 Structure des fichiers

- `commands/` — commandes slash
- `events/` — gestionnaire des events Discord (`voiceStateUpdate`, `channelDelete`, etc.)
- `db/db.json` — configuration du salon de setup, catégorie, logs, format global
- `db/voicedb.json` — liens salon vocal ↔ propriétaire
- `config.json` — configuration globale (présence, owner)

## 🔐 Permissions requises

- Gérer les salons (`Manage Channels`)
- Déplacer des membres (`Move Members`)
- Lire les messages/textes (`Read Messages`)
- Gérer les permissions (`Manage Roles/Permissions`)

## 🧱 Dépendances

- [discord.js](https://discord.js.org/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- Node.js 18+

## 🤝 Contribuer

Les contributions sont les bienvenues ! Ouvrez une _issue_ ou une _pull request_.

## 📞 Support

Un serveur support est en cours. En attendant, ouvrez une _issue_ sur GitHub si besoin.

> 🎧 Développé avec ❤️ par [@indeciss](https://github.com/ind3ciss) pour une expérience vocale premium sur Discord.
