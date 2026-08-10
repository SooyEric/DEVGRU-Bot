import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

import {
    initializeBanTable,
    saveBannedMember
} from "../utils/banManager.js";

const LOG_CHANNEL_ID = "1525379838095921172";

const OWNER_ID = "1458405471181476001";

const ANTIBAN_USERS = [
    "1123741316052959232"
];

const EMBED_COLOR = "#ffaf1a";

export default {
    name: "ban",
    permission: 1,

    async execute(message, args) {
        const targetInput = args[0];

        if (!targetInput) {
            await message.react("❌");
            return;
        }

        let member;

        try {
            member = message.mentions.members.first();

            if (!member) {
                const userId = targetInput.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                member = await message.guild.members.fetch(userId);
            }

            if (!member) {
                await message.react("❌");
                return;
            }

            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });

        } catch {
            await message.react("❌");
            return;
        }

        /*
         * ANTIBAN
         *
         * Los usuarios de ANTIBAN no pueden ser baneados
         * por usuarios normales con permiso nivel 1.
         *
         * OWNER_ID puede saltarse esta protección.
         */
        if (
            ANTIBAN_USERS.includes(member.id) &&
            message.author.id !== OWNER_ID
        ) {
            await message.react("❌");
            return;
        }

        /*
         * El dueño del servidor tampoco puede ser baneado
         * por el bot.
         */
        if (
            member.id === message.guild.ownerId &&
            message.author.id !== OWNER_ID
        ) {
            await message.react("❌");
            return;
        }

        try {
            await initializeBanTable();

            /*
             * Guardamos todos los roles del usuario
             * excepto @everyone.
             */
            const roleIds = member.roles.cache
                .filter(role => role.id !== message.guild.id)
                .map(role => role.id);

            /*
             * DM antes del ban.
             */
            const userEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle("Baneado de DEVGRU")
                .setDescription(
                    "Has sido baneado de DEVGRU.\n\n" +
                    "Ya no formas parte del servidor."
                );

            await member.send({
                embeds: [userEmbed]
            }).catch(() => {});

            /*
             * Embed del registro.
             */
            const logEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle("Usuario baneado")
                .setDescription(
                    `**Usuario:** ${member}\n` +
                    `**ID:** \`${member.id}\`\n` +
                    `**Ejecutado por:** ${message.author}\n\n` +
                    `**Roles guardados:**\n` +
                    `${
                        roleIds.length > 0
                            ? roleIds.map(id => `<@&${id}>`).join(" ")
                            : "Ninguno"
                    }`
                );

            /*
             * Botón Restaurar.
             *
             * Discord no tiene un ButtonStyle amarillo nativo.
             * Secondary es el estilo neutral disponible.
             */
            const restoreButton = new ButtonBuilder()
                .setCustomId(`restore_ban:${member.id}`)
                .setLabel("Restaurar")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(restoreButton);

            const logChannel = await message.guild.channels.fetch(
                LOG_CHANNEL_ID
            );

            if (!logChannel) {
                await message.react("❌");
                return;
            }

            /*
             * IMPORTANTE:
             * Primero guardamos la información en PostgreSQL.
             */
            const logMessage = await logChannel.send({
                embeds: [logEmbed],
                components: [row]
            });

            await saveBannedMember(
                member.id,
                roleIds,
                logMessage.id
            );

            /*
             * BAN REAL DEL USUARIO.
             */
            await member.ban({
                reason: `Ban ejecutado por ${message.author.tag}`
            });

            await message.react("✅");

        } catch (error) {
            console.error("Error en comando ban:", error);
            await message.react("❌");
        }
    }
};