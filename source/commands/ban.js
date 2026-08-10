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
    "1123741316052959232",
    "1364453430470643786",
    "1461956206846541869",
    "1480808578712338486",
    "775808555600576522",
    "889960167960084500",
    "1242361617199399004",
    "735572457917907028",
    "1024737406483701781",
    "1414816775610306631"
];
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

            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });

        } catch {
            await message.react("❌");
            return;
        }

        if (
            ANTIBAN_USERS.includes(member.id) &&
            message.author.id !== OWNER_ID
        ) {
            await message.react("❌");
            return;
        }

        if (member.id === message.guild.ownerId) {
            await message.react("❌");
            return;
        }

        try {
            if (!member.bannable) {
                console.error(
                    `No se puede banear a ${member.user.tag}. ` +
                    `Bot: ${message.guild.members.me?.roles.highest?.name} ` +
                    `Objetivo: ${member.roles.highest?.name}`
                );

                await message.react("❌");
                return;
            }

            const roleIds = member.roles.cache
                .filter(role => role.id !== message.guild.id)
                .map(role => role.id);

            const nickname = member.nickname;

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

            const logEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle("Usuario baneado")
                .setDescription(
                    `**Usuario:** ${member}\n` +
                    `**ID:** \`${member.id}\`\n` +
                    `**Ejecutado por:** ${message.author}\n\n` +
                    `**Nickname guardado:** ${nickname || "Ninguno"}\n\n` +
                    `**Roles guardados:**\n` +
                    `${
                        roleIds.length
                            ? roleIds.map(id => `<@&${id}>`).join(" ")
                            : "Ninguno"
                    }`
                );

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

            const logMessage = await logChannel.send({
                embeds: [logEmbed],
                components: [row]
            });

            await saveBannedMember(
                member.id,
                roleIds,
                nickname,
                logMessage.id
            );

            await message.guild.bans.create(member.id, {
                reason: `Ban ejecutado por ${message.author.tag}`,
                deleteMessageSeconds: 0
            });

            const banCheck = await message.guild.bans.fetch(member.id)
                .catch(() => null);

            if (!banCheck) {
                throw new Error(
                    "Discord no confirmó el ban del usuario."
                );
            }

            await message.react("✅");

        } catch (error) {
            console.error("Error en comando ban:", error);
            await message.react("❌");
        }
    }
};