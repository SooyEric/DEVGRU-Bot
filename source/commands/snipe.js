import {
    EmbedBuilder
} from "discord.js";

import {
    getSnipes
} from "../utils/snipeManager.js";

/*
 * ============================================================
 * FORMATEAR TIEMPO
 * ============================================================
 */

function formatElapsedTime(
    timestamp
) {
    const elapsed =
        Math.max(
            0,
            Date.now() -
                timestamp
        );

    const seconds =
        Math.floor(
            elapsed / 1000
        );

    if (
        seconds < 60
    ) {
        return `${seconds} segundo${
            seconds === 1
                ? ""
                : "s"
        }`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (
        minutes < 60
    ) {
        return `${minutes} minuto${
            minutes === 1
                ? ""
                : "s"
        }`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    return `${hours} hora${
        hours === 1
            ? ""
            : "s"
    }`;
}

/*
 * ============================================================
 * AÑADIR ATTACHMENTS
 * ============================================================
 */

function addAttachments(
    embed,
    attachments
) {
    if (
        !attachments ||
        attachments.length === 0
    ) {
        return;
    }

    const image =
        attachments.find(
            attachment =>
                attachment.contentType?.startsWith(
                    "image/"
                ) ||
                /\.(png|jpe?g|gif|webp)$/i.test(
                    attachment.name ||
                    ""
                )
        );

    if (image) {
        embed.setImage(
            image.url
        );
    }

    const attachmentText =
        attachments
            .map(
                attachment =>
                    `📎 [${attachment.name || "Archivo"}](${attachment.url})`
            )
            .join("\n");

    if (
        attachmentText
    ) {
        embed.addFields({
            name:
                "Archivos",
            value:
                attachmentText.slice(
                    0,
                    1024
                )
        });
    }
}

/*
 * ============================================================
 * AÑADIR EMBEDS DEL MENSAJE ORIGINAL
 * ============================================================
 */

function addOriginalEmbeds(
    embed,
    originalEmbeds
) {
    if (
        !originalEmbeds ||
        originalEmbeds.length === 0
    ) {
        return;
    }

    const links =
        originalEmbeds
            .map(
                originalEmbed =>
                    originalEmbed.url
                        ? `🔗 ${originalEmbed.url}`
                        : null
            )
            .filter(Boolean);

    if (
        links.length > 0
    ) {
        embed.addFields({
            name:
                "Contenido incrustado",
            value:
                links
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
 * COMANDO
 * ============================================================
 */

export default {
    name: "snipe",
    permission: 2,

    aliases: [
        "s"
    ],

    async execute(
        message,
        args
    ) {

        const snipes =
            getSnipes(
                message.guild.id,
                message.channel.id
            );

        if (
            snipes.length === 0
        ) {
            try {
                await message.react(
                    "❌"
                );
            } catch {}

            return;
        }

        /*
         * ========================================================
         * PÁGINA
         * ========================================================
         */

        let page =
            Number(
                args[0]
            ) || 1;

        if (
            !Number.isInteger(
                page
            )
        ) {
            page = 1;
        }

        /*
         * Si se pasa de la última página,
         * mostramos la última.
         */

        if (
            page < 1
        ) {
            page = 1;
        }

        if (
            page > snipes.length
        ) {
            page =
                snipes.length;
        }

        /*
         * Array empieza en 0.
         */

        const snipe =
            snipes[
                page - 1
            ];

        if (!snipe) {
            try {
                await message.react(
                    "❌"
                );
            } catch {}

            return;
        }

        /*
         * ========================================================
         * EMBED
         * ========================================================
         */

        const embed =
            new EmbedBuilder()
                .setColor(
                    "#ffaf1a"
                )
                .setAuthor({
                    name:
                        snipe.nickname,
                    iconURL:
                        snipe.authorAvatar
                });

        /*
         * ========================================================
         * CONTENIDO
         * ========================================================
         */

        if (
            snipe.content
        ) {
            embed.setDescription(
                snipe.content
            );
        }

        /*
         * ========================================================
         * ATTACHMENTS
         * ========================================================
         */

        addAttachments(
            embed,
            snipe.attachments
        );

        /*
         * ========================================================
         * EMBEDS ORIGINALES
         * ========================================================
         */

        addOriginalEmbeds(
            embed,
            snipe.embeds
        );

        /*
         * ========================================================
         * STICKERS
         * ========================================================
         */

        if (
            snipe.stickers?.length >
            0
        ) {
            const stickerText =
                snipe.stickers
                    .map(
                        sticker =>
                            `🎟️ ${sticker.name}`
                    )
                    .join("\n");

            embed.addFields({
                name:
                    "Stickers",
                value:
                    stickerText.slice(
                        0,
                        1024
                    )
            });
        }

        /*
         * ========================================================
         * SI NO HAY NINGÚN CONTENIDO
         * ========================================================
         */

        if (
            !snipe.content &&
            (!snipe.attachments ||
                snipe.attachments.length === 0) &&
            (!snipe.embeds ||
                snipe.embeds.length === 0) &&
            (!snipe.stickers ||
                snipe.stickers.length === 0)
        ) {
            embed.setDescription(
                "*[Mensaje sin contenido visible]*"
            );
        }

        /*
         * ========================================================
         * FOOTER
         * ========================================================
         */

        embed.setFooter({
            text:
                `Borrado hace ${formatElapsedTime(
                    snipe.deletedTimestamp
                )} • ${page}/${snipes.length} mensajes`,
            iconURL:
                message.author.displayAvatarURL({
                    extension:
                        "png",
                    size:
                        128
                })
        });

        /*
         * ========================================================
         * ENVIAR
         * ========================================================
         */

        await message.channel.send({
            embeds: [
                embed
            ]
        });
    }
};