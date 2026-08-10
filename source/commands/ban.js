import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import {
    initializeBanTable,
    saveBannedMember
} from "../utils/banManager.js";

const LOG_CHANNEL_ID = "1525379838095921172";
const WHITELIST = [
    "1458405471181476001"
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

        if (
            WHITELIST.includes(member.id) &&
            message.author.id !== "1458405471181476001"
        ) {
            await message.react("❌");
            return;
        }

        if (member.id === message.guild.ownerId) {
            await message.react("❌");
            return;
        }

        try {
            await initializeBanTable();

            const roleIds = member.roles.cache
                .filter(role => role.id !== message.guild.id)
                .map(role => role.id);

            const userEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle("Baneado de DEVGRU")
                .setDescription(
                    "Has sido baneado de DEVGRU.\n\n" +
                    "Ya no formas parte oficialmente de la organización."
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
                    `**Roles guardados:**\n` +
                    `${roleIds.length > 0
                        ? roleIds.map(id => `<@&${id}>`).join(" ")
                        : "Ninguno"}`
                );

            const restoreButton = new ButtonBuilder()
                .setCustomId(`restore_ban:${member.id}`)
                .setLabel("Restaurar")
                .setStyle(ButtonStyle.Primary);

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
                logMessage.id
            );

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