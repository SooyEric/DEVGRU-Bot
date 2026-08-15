export default {
    name: "purge",
    aliases: [
        "c"
    ],
    permission: 1,

    async execute(message, args) {
        const mode =
            args[0]?.toLowerCase();

        let amount = 50;
        let mediaOnly = false;
        let targetUser = null;

        /*
         * ============================================================
         * INTERPRETAR ARGUMENTOS
         * ============================================================
         */

        if (message.mentions.users.size > 0) {
            targetUser =
                message.mentions.users.first();

            amount =
                Number(args[1]) || 50;

            if (
                amount < 1 ||
                amount > 1000
            ) {
                try {
                    await message.react("❌");
                } catch {}

                return;
            }

        } else if (
            mode === "fotos" ||
            mode === "foto" ||
            mode === "media"
        ) {
            mediaOnly = true;

            amount =
                Number(args[1]) || 5;

            if (
                amount < 1 ||
                amount > 30
            ) {
                try {
                    await message.react("❌");
                } catch {}

                return;
            }

        } else {
            amount =
                Number(args[0]) || 50;

            if (
                amount < 1 ||
                amount > 1000
            ) {
                try {
                    await message.react("❌");
                } catch {}

                return;
            }
        }

        /*
         * ============================================================
         * PURGE
         * ============================================================
         */

        try {

            /*
             * ========================================================
             * PURGE POR USUARIO
             * ========================================================
             */

            if (targetUser) {

                const userMessages = [];

                let lastId =
                    message.id;

                while (
                    userMessages.length <
                    amount
                ) {

                    const messages =
                        await message.channel.messages.fetch({
                            limit: 100,
                            before: lastId
                        });

                    if (
                        messages.size === 0
                    ) {
                        break;
                    }

                    for (
                        const msg of messages.values()
                    ) {

                        if (
                            msg.author.id ===
                            targetUser.id
                        ) {
                            userMessages.push(
                                msg
                            );
                        }

                        if (
                            userMessages.length >=
                            amount
                        ) {
                            break;
                        }
                    }

                    lastId =
                        messages.last().id;
                }

                /*
                 * 1000 mensajes del usuario
                 * + el mensaje del comando.
                 */

                const messagesToDelete = [
                    message,
                    ...userMessages
                ];

                for (
                    let i = 0;
                    i <
                    messagesToDelete.length;
                    i += 100
                ) {

                    const batch =
                        messagesToDelete.slice(
                            i,
                            i + 100
                        );

                    if (
                        batch.length === 0
                    ) {
                        continue;
                    }

                    await message.channel.bulkDelete(
                        batch,
                        true
                    );
                }

                return;
            }

            /*
             * ========================================================
             * PURGE NORMAL
             * ========================================================
             */

            if (!mediaOnly) {

                /*
                 * amount = mensajes que queremos borrar
                 *
                 * +1 = mensaje que contiene -purge
                 */

                let remaining =
                    amount + 1;

                while (
                    remaining > 0
                ) {

                    const messages =
                        await message.channel.messages.fetch({
                            limit: Math.min(
                                100,
                                remaining
                            )
                        });

                    if (
                        messages.size === 0
                    ) {
                        break;
                    }

                    const batch =
                        messages.first(
                            Math.min(
                                100,
                                remaining
                            )
                        );

                    if (
                        batch.length === 0
                    ) {
                        break;
                    }

                    await message.channel.bulkDelete(
                        batch,
                        true
                    );

                    remaining -=
                        batch.length;
                }

                return;
            }

            /*
             * ========================================================
             * PURGE DE MEDIA
             * ========================================================
             */

            const mediaMessages = [];

            let lastId =
                message.id;

            while (
                mediaMessages.length <
                amount
            ) {

                const messages =
                    await message.channel.messages.fetch({
                        limit: 100,
                        before: lastId
                    });

                if (
                    messages.size === 0
                ) {
                    break;
                }

                for (
                    const msg of messages.values()
                ) {

                    const hasMedia =
                        msg.attachments.size > 0 ||
                        msg.embeds.some(
                            embed =>
                                embed.type ===
                                    "image" ||
                                embed.type ===
                                    "video" ||
                                embed.url
                        ) ||
                        /https?:\/\/\S+/i.test(
                            msg.content
                        );

                    if (
                        hasMedia
                    ) {
                        mediaMessages.push(
                            msg
                        );
                    }

                    if (
                        mediaMessages.length >=
                        amount
                    ) {
                        break;
                    }
                }

                lastId =
                    messages.last().id;
            }

            /*
             * Mensajes de media
             * + mensaje del comando.
             */

            const messagesToDelete = [
                message,
                ...mediaMessages
            ];

            for (
                let i = 0;
                i <
                messagesToDelete.length;
                i += 100
            ) {

                const batch =
                    messagesToDelete.slice(
                        i,
                        i + 100
                    );

                if (
                    batch.length === 0
                ) {
                    continue;
                }

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

            /*
             * El mensaje del comando puede haber
             * sido eliminado antes de llegar aquí.
             *
             * Por eso nunca dejamos que un
             * message.react() provoque otro error.
             */

            try {
                if (
                    message.channel &&
                    message.id
                ) {
                    await message.react(
                        "❌"
                    );
                }
            } catch {
                // El mensaje ya fue eliminado.
            }
        }
    }
};