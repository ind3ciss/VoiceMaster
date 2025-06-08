# 🔊 VoiceMaster

**VoiceMaster** est un bot Discord en **Discord.js** qui permet aux utilisateurs de créer, gérer et personnaliser leurs salons vocaux privés. Il est idéal pour les serveurs communautaires où les membres veulent discuter entre amis dans un espace privé contrôlé. Le bot est simple à configurer et à utiliser pour un serveur unique.

## ⚙️ Fonctionnalités

- **Création automatique de salons vocaux privés** via un salon "setup"
- **Format de nom personnalisable** (`/setformat`) avec `{username}`
- **Vocal lié à un salon texte pour commandes contextuelles**
- **Transfert de propriété** (`/transfer`)
- **Verrouillage / déverrouillage du salon** (`/lock`, `/unlock`)
- **Kick, allow, deny, rename, limit** dans les vocaux privés
- **Suppression automatique des salons inactifs**
- **Logs complets** si un salon de log est défini via `/setlog`

## 📊 Commandes principales

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
   git clone https://github.com/ind3ciss/VoiceMaster.git
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer le bot**
   - Renommer le fichier `.env.example` en `.env` et collez y les informations suivantes :
     ```
     TOKEN=VOTRE_TOKEN
     APP_ID=ID_DU_BOT
     ```
   - Personnalisez `config.json` (présence du bot, ID owner, etc.)
   - Le format vocal global se définit dans `db.json` avec la clé `nameFormat` :
     ```json
     {
       "owner": "VOTRE ID",
       "presence": {
            "status": "online",
            "activity": {
            "name": "VoiceMaster",
            "type": "Streaming",
            "url": "https://twitch.tv/beachbots"
            }
        }
     }
     ```

4. **Lancer le bot**
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

## 🔑 Dépendances

- [discord.js](https://discord.js.org/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- Node.js 18+

## ☎️ Serveur Support

Vous pouvez rejoindre notre serveur de support si vous avez un problème concernant notre bot avec ce lien : https://discord.gg/beachbots

## 🤍 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une pull request pour proposer des améliorations.

> 🌊 Bot développé par [@indeciss](https://github.com/ind3ciss) pour la gestion premium des vocaux privés de votre serveur