import {
    EmbedBuilder
} from "discord.js";

import {
    getSnipes,
    getSnipe
} from "../utils/snipeManager.js";

function formatDeletedTime(
    timestamp
) {
    const seconds = Math.floor(
        (
            Date.now() -
            timestamp
        ) / 1000
    );

    if (seconds < 60) {
        return `${seconds} segundos`;
    }

    const minutes = Math.floor(
        seconds / 60
    );

    if (minutes < 60) {
        return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    return `${hours} hora${hours !== 1 ? "s" : ""}`;
}

export default {
    name: "snipe",

    aliases: [
        "s"
    ],

    permission: 2,

    async execute(
        message,
        args
    ) {
        const requestedPage =
            Number(args[0]) || 1;

        const snipes =
            getSnipes(
                message.guild.id
            );

        if (
            snipes.length === 0
        ) {
            await message.react(
                "❌"
            );

            return;
        }

        if (
            requestedPage < 1 ||
            requestedPage > snipes.length
        ) {
            await message.react(
                "❌"
            );

            return;
        }

        const snipe =
            getSnipe(
                message.guild.id,
                requestedPage - 1
            );

        if (!snipe) {
            await message.react(
                "❌"
            );

            return;
        }

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

        if (
            snipe.content
        ) {
            embed.setDescription(
                snipe.content
            );
        }

        if (
            snipe.attachments.length > 0
        ) {
            const firstAttachment =
                snipe.attachments[0];

            const isImage =
                firstAttachment.contentType?.startsWith(
                    "image/"
                );

            if (isImage) {
                embed.setImage(
                    firstAttachment.url
                );
            } else {
                const attachmentText =
                    snipe.attachments
                        .map(
                            attachment =>
                                `📎 [${attachment.name}](${attachment.url})`
                        )
                        .join("\n");

                const currentDescription =
                    embed.data.description ||
                    "";

                embed.setDescription(
                    currentDescription
                        ? `${currentDescription}\n\n${attachmentText}`
                        : attachmentText
                );
            }
        }

        if (
            snipe.content &&
            snipe.attachments.length > 1
        ) {
            const additionalAttachments =
                snipe.attachments
                    .slice(1)
                    .map(
                        attachment =>
                            `📎 [${attachment.name}](${attachment.url})`
                    )
                    .join("\n");

            embed.setDescription(
                `${embed.data.description}\n\n${additionalAttachments}`
            );
        }

        embed.setFooter({
            text:
                `Borrado hace ${formatDeletedTime(
                    snipe.deletedTimestamp
                )} • ${requestedPage}/${snipes.length} mensajes`,
            iconURL:
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        });

        await message.reply({
            embeds: [
                embed
            ]
        });
    }
};