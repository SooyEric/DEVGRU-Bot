const COMMAND_LOG_CHANNEL_ID = "1525379838095921172";

export async function logCommandError(
    message,
    commandName,
    reason,
    error = null
) {
    try {
        const channel = await message.client.channels.fetch(
            COMMAND_LOG_CHANNEL_ID
        );

        if (!channel) return;

        const embed = {
            title: "❌ Error de comando",
            color: 0xff0000,
            fields: [
                {
                    name: "Comando",
                    value: `\`${commandName}\``,
                    inline: true
                },
                {
                    name: "Usuario",
                    value: `${message.author.tag} (<@${message.author.id}>)`,
                    inline: true
                },
                {
                    name: "Servidor",
                    value: `${message.guild?.name || "Desconocido"} (${message.guild?.id || "N/A"})`,
                    inline: false
                },
                {
                    name: "Canal",
                    value: `${message.channel?.name || "Desconocido"} (${message.channel?.id || "N/A"})`,
                    inline: false
                },
                {
                    name: "Argumentos",
                    value: message.content
                        ? `\`${message.content.slice(0, 1000)}\``
                        : "Sin argumentos",
                    inline: false
                },
                {
                    name: "Motivo",
                    value: `\`${String(reason).slice(0, 1000)}\``,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        };

        if (error?.stack) {
            embed.fields.push({
                name: "Error técnico",
                value: `\`\`\`\n${error.stack.slice(0, 1500)}\n\`\`\``,
                inline: false
            });
        }

        await channel.send({
            embeds: [embed]
        });
    } catch (loggingError) {
        console.error(
            "Failed to send command error log:",
            loggingError
        );
    }
}