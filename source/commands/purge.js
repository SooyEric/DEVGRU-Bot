export default {
    name: "purge",
    permission: 1,

    async execute(message, args) {
        const mode = args[0]?.toLowerCase();

        let amount = 50;
        let mediaOnly = false;

        if (
            mode === "fotos" ||
            mode === "foto" ||
            mode === "media"
        ) {
            mediaOnly = true;
            amount = Number(args[1]) || 5;

            if (amount < 1 || amount > 30) {
                await message.react("❌");
                return;
            }
        } else {
            amount = Number(args[0]) || 50;

            if (amount < 1 || amount > 1000) {
                await message.react("❌");
                return;
            }
        }

        try {
            if (!mediaOnly) {
                let remaining = amount + 1;

                while (remaining > 0) {
                    const messages =
                        await message.channel.messages.fetch({
                            limit: Math.min(100, remaining)
                        });

                    if (messages.size === 0) break;

                    const batch = messages.first(
                        Math.min(100, remaining)
                    );

                    await message.channel.bulkDelete(
                        batch,
                        true
                    );

                    remaining -= batch.length;
                }

                return;
            }

            let mediaMessages = [];
            let lastId = message.id;

            while (mediaMessages.length < amount) {
                const messages =
                    await message.channel.messages.fetch({
                        limit: 100,
                        before: lastId
                    });

                if (messages.size === 0) break;

                for (const msg of messages.values()) {
                    const hasMedia =
                        msg.attachments.size > 0 ||
                        msg.embeds.some(embed =>
                            embed.type === "image" ||
                            embed.type === "video" ||
                            embed.url
                        ) ||
                        /https?:\/\/\S+/i.test(msg.content);

                    if (hasMedia) {
                        mediaMessages.push(msg);
                    }

                    if (mediaMessages.length >= amount) {
                        break;
                    }
                }

                lastId =
                    messages.last().id;
            }

            const messagesToDelete = [
                message,
                ...mediaMessages
            ];

            for (
                let i = 0;
                i < messagesToDelete.length;
                i += 100
            ) {
                const batch =
                    messagesToDelete.slice(
                        i,
                        i + 100
                    );

                await message.channel.bulkDelete(
                    batch,
                    true
                );
            }

        } catch (error) {
            console.error(
                "Error en comando purge:",
                error
            );

            await message.react("❌");
        }
    }
};