export default {
    name: "purge",
    permission: 1,

    async execute(message, args) {
        const mode = args[0]?.toLowerCase();

        let amount = 50;
        let filterMedia = false;

        if (mode === "fotos" || mode === "media") {
            filterMedia = true;
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
            const target = amount + 1;
            let deleted = 0;

            while (deleted < target) {
                const remaining = target - deleted;
                const fetchLimit = Math.min(100, remaining);

                const messages =
                    await message.channel.messages.fetch({
                        limit: fetchLimit
                    });

                if (messages.size === 0) break;

                let toDelete;

                if (filterMedia) {
                    toDelete = messages.filter(msg =>
                        msg.attachments.size > 0 ||
                        msg.embeds.some(embed =>
                            embed.type === "image" ||
                            embed.type === "video" ||
                            embed.url
                        ) ||
                        /https?:\/\/\S+/i.test(msg.content)
                    );
                } else {
                    toDelete = messages;
                }

                if (toDelete.size === 0) break;

                const batch = toDelete.first(
                    Math.min(100, remaining)
                );

                if (!batch.length) break;

                await message.channel.bulkDelete(
                    batch,
                    true
                );

                deleted += batch.length;
            }

        } catch (error) {
            console.error("Error en comando purge:", error);
            await message.react("❌");
        }
    }
};