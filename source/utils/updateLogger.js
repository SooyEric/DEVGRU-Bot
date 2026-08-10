import { EmbedBuilder } from "discord.js";
import version from "../config/version.js";

const UPDATE_LOG_CHANNEL_ID = "1525379838095921172";

export async function logBotUpdate(client) {
    try {
        const channel = await client.channels.fetch(
            UPDATE_LOG_CHANNEL_ID
        );

        if (!channel) return;

        const messages = await channel.messages.fetch({
            limit: 20
        });

        const lastUpdate = messages.find(
            message =>
                message.author.id === client.user.id &&
                message.embeds.length > 0 &&
                message.embeds[0].title === "DEVGRU Bot actualizado"
        );

        if (lastUpdate) {
            const description = lastUpdate.embeds[0].description || "";

            if (
                description.includes(
                    `**Versión:** \`v${version.number}\``
                )
            ) {
                return;
            }
        }

        const embed = new EmbedBuilder()
            .setColor("#ffaf1a")
            .setTitle("DEVGRU Bot actualizado")
            .setDescription(
                `**Versión:** \`v${version.number}\`\n` +
                `**Tipo:** ${version.type}\n\n` +
                `**Cambios:**\n${version.description}`
            )
            .setTimestamp();

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {
        console.error("Failed to send update log:", error);
    }
}