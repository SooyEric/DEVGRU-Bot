import {
    EmbedBuilder
} from "discord.js";

import {
    getDeletedMessages
} from "../utils/snipeManager.js";

export default {
    name: "snipe",
    aliases: [
        "s"
    ],
    permission: 2,

    async execute(message, args) {

        const messages =
            getDeletedMessages(
                message.guild.id,
                message.channel.id
            );

        if (
            messages.length === 0
        ) {
            await message.react("❌");
            return;
        }

        let page =
            Number(args[0]) || 1;

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > messages.length
        ) {
            await message.react("❌");
            return;
        }

        const deletedMessage =
            messages[page - 1];

        const embed =
            new EmbedBuilder()
                .setColor("#ffaf1a")
                .setAuthor({
                    name:
                        deletedMessage.nickname,

                    iconURL:
                        deletedMessage.authorAvatar
                })
                .setDescription(
                    deletedMessage.content ||
                    null
                )
                .setFooter({
                    text:
                        `Borrado hace ${formatTime(
                            Date.now() -
                            deletedMessage.deletedAt
                        )} • ${page}/${messages.length} mensajes`,
                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                });

        /*
         * ============================================================
         * ATTACHMENTS
         * ============================================================
         */

        if (
            deletedMessage.attachments.length >
            0
        ) {
            const firstAttachment =
                deletedMessage.attachments[0];

            const contentType =
                firstAttachment.contentType ||
                "";

            if (
                contentType.startsWith(
                    "image/"
                )
            ) {
                embed.setImage(
                    firstAttachment.url
                );
            } else {
                embed.addFields({
                    name:
                        "📎 Archivo",
                    value:
                        deletedMessage.attachments
                            .map(
                                attachment =>
                                    `[${escapeMarkdown(
                                        attachment.name
                                    )}](${attachment.url})`
                            )
                            .join("\n")
                });
            }
        }

        /*
         * ============================================================
         * STICKERS
         * ============================================================
         */

        if (
            deletedMessage.stickers.length >
            0
        ) {
            const stickerText =
                deletedMessage.stickers
                    .map(
                        sticker =>
                            `> 🏷️ ${sticker.name}`
                    )
                    .join("\n");

            embed.addFields({
                name:
                    "Stickers",
                value:
                    stickerText
            });
        }

        /*
         * ============================================================
         * EMBEDS
         * ============================================================
         */

        if (
            deletedMessage.embeds.length >
            0
        ) {
            const externalEmbeds =
                deletedMessage.embeds.filter(
                    originalEmbed =>
                        !originalEmbed.image &&
                        !originalEmbed.thumbnail
                );

            for (
                const originalEmbed of
                externalEmbeds.slice(0, 3)
            ) {
                const fieldLines = [];

                if (
                    originalEmbed.title
                ) {
                    fieldLines.push(
                        `**${originalEmbed.title}**`
                    );
                }

                if (
                    originalEmbed.description
                ) {
                    fieldLines.push(
                        originalEmbed.description
                    );
                }

                if (
                    originalEmbed.url
                ) {
                    fieldLines.push(
                        `[Abrir enlace](${originalEmbed.url})`
                    );
                }

                if (
                    fieldLines.length > 0
                ) {
                    embed.addFields({
                        name:
                            "Contenido incrustado",
                        value:
                            fieldLines.join(
                                "\n"
                            ).slice(
                                0,
                                1024
                            )
                    });
                }
            }
        }

        await message.channel.send({
            embeds: [
                embed
            ]
        });
    }
};

function formatTime(
    milliseconds
) {
    const seconds =
        Math.floor(
            milliseconds / 1000
        );

    if (
        seconds < 60
    ) {
        return `${seconds}s`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (
        minutes < 60
    ) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    return `${hours}h`;
}

function escapeMarkdown(
    text
) {
    return text.replace(
        /([\\`*_{}[\]()<>#+\-.!|])/g,
        "\\$1"
    );
}