import version from "../config/version.js";

const UPDATE_LOG_CHANNEL_ID = "1525379838095921172";

export async function logBotUpdate(client) {
    try {
        const channel = await client.channels.fetch(UPDATE_LOG_CHANNEL_ID);

        if (!channel) return;

        const embed = {
            title: "🟢 DEVGRU-Bot actualizado",
            color: 0x00ff00,
            fields: [
                {
                    name: "Versión",
                    value: `\`v${version.number}\``,
                    inline: true
                },
                {
                    name: "Tipo",
                    value: version.type,
                    inline: true
                },
                {
                    name: "Cambios",
                    value: version.description,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        };

        await channel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error("Failed to send update log:", error);
    }
}