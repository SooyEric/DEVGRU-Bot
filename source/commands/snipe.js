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

        const elapsed =
            Date.now() -
            deletedMessage.deletedAt;

        const embed =
            new EmbedBuilder()
                .setColor("#ffaf1a")
                .setAuthor({
                    name:
                        deletedMessage.nickname,

                    iconURL:
                        deletedMessage.authorAvatar
                })
                .setFooter({
                    text:
                        `Borrado hace ${formatTime(elapsed)} • ${page}/${messages.length} mensajes`,

                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                });

        /*
         * ============================================================
         * MENSAJE
         * ============================================================
         */

        if (
            deletedMessage.content
        ) {
            embed.setDescription(
                deletedMessage.content
            );
        }

        /*
         * ============================================================
         * ATTACHMENTS
         * ============================================================
         */

        const attachments =
            deletedMessage.attachments;

        if (
            attachments.length > 0
        ) {

            const image =
                attachments.find(
                    attachment =>
                        attachment.contentType?.startsWith(
                            "image/"
                        )
                );

            if (image) {
                embed.setImage(
                    image.url
                );
            }

            const otherAttachments =
                attachments.filter(
                    attachment =>
                        attachment !==
                            image
                );

            if (
                otherAttachments.length >
                0
            ) {
                embed.addFields({
                    name:
                        "📎 Archivos",
                    value:
                        otherAttachments
                            .map(
                                attachment =>
                                    `[${escapeMarkdown(
                                        attachment.name ||
                                        "Archivo"
                                    )}](${attachment.url})`
                            )
                            .join("\n")
                            .slice(
                                0,
                                1024
                            )
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
            embed.addFields({
                name:
                    "Stickers",
                value:
                    deletedMessage.stickers
                        .map(
                            sticker =>
                                `> ${sticker.name}`
                        )
                        .join("\n")
                        .slice(
                            0,
                            1024
                        )
            });
        }

        /*
         * ============================================================
         * EMBEDS
         * ============================================================
         */

        for (
            const originalEmbed of
            deletedMessage.embeds.slice(
                0,
                3
            )
        ) {

            if (
                originalEmbed.image?.url
            ) {
                embed.setImage(
                    originalEmbed.image.url
                );
            }

            if (
                originalEmbed.thumbnail?.url &&
                !originalEmbed.image?.url
            ) {
                embed.setThumbnail(
                    originalEmbed.thumbnail.url
                );
            }

            const lines = [];

            if (
                originalEmbed.title
            ) {
                lines.push(
                    `**${originalEmbed.title}**`
                );
            }

            if (
                originalEmbed.description
            ) {
                lines.push(
                    originalEmbed.description
                );
            }

            if (
                originalEmbed.url
            ) {
                lines.push(
                    `[Abrir enlace](${originalEmbed.url})`
                );
            }

            if (
                lines.length > 0
            ) {
                embed.addFields({
                    name:
                        "Contenido incrustado",
                    value:
                        lines
                            .join("\n")
                            .slice(
                                0,
                                1024
                            )
                });
            }
        }

        /*
         * ============================================================
         * ENVIAR
         * ============================================================
         */

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
            milliseconds /
            1000
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