import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

const EMBED_COLOR = "#ffaf1a";

const EMOJI_REGEX =
    /<(a?):([a-zA-Z0-9_]+):(\d{17,20})>/;

function getEmojiFromText(
    text
) {
    if (!text) {
        return null;
    }

    const match =
        text.match(
            EMOJI_REGEX
        );

    if (!match) {
        return null;
    }

    return {
        animated:
            match[1] === "a",
        name:
            match[2],
        id:
            match[3],
        url:
            `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] ? "gif" : "png"}?size=4096`
    };
}

async function getSource(
    message
) {
    let sourceMessage =
        message;

    if (
        message.reference?.messageId
    ) {
        try {
            sourceMessage =
                await message.channel.messages.fetch(
                    message.reference.messageId
                );
        } catch {
            sourceMessage =
                message;
        }
    }

    const emoji =
        getEmojiFromText(
            sourceMessage.content
        );

    if (emoji) {
        return {
            type: "emoji",
            url: emoji.url,
            animated:
                emoji.animated
        };
    }

    if (
        sourceMessage.stickers.size > 0
    ) {
        const sticker =
            sourceMessage.stickers.first();

        if (
            sticker.format === 1 ||
            sticker.format === 2
        ) {
            return {
                type: "sticker",
                url: sticker.url,
                format: sticker.format
            };
        }
    }

    const attachment =
        sourceMessage.attachments
            .find(
                attachment =>
                    attachment.contentType?.startsWith(
                        "image/"
                    )
            );

    if (attachment) {
        return {
            type: "image",
            url:
                attachment.url,
            contentType:
                attachment.contentType
        };
    }

    return null;
}

function getAttachmentSource(
    message
) {
    const attachment =
        message.attachments
            .find(
                attachment =>
                    attachment.contentType?.startsWith(
                        "image/"
                    )
            );

    if (!attachment) {
        return null;
    }

    return {
        type: "image",
        url:
            attachment.url,
        contentType:
            attachment.contentType
    };
}

function createInitialEmbed() {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            "Añadir contenido"
        )
        .setDescription(
            "¿Cómo deseas añadir este contenido?"
        );
}

function createButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "stl_emoji"
                )
                .setLabel(
                    "Emoji"
                )
                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    "stl_sticker"
                )
                .setLabel(
                    "Sticker"
                )
                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    "stl_cancel"
                )
                .setLabel(
                    "✕"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

function createResultEmbed(
    type,
    result
) {
    const embed =
        new EmbedBuilder()
            .setColor(
                EMBED_COLOR
            );

    if (type === "emoji") {
        embed
            .setTitle(
                "Emoji agregado"
            )
            .setDescription(
                `${result}`
            );
    } else {
        embed
            .setTitle(
                "Sticker agregado"
            )
            .setImage(
                result.url
            );
    }

    return embed;
}

function getEmojiExtension(
    source
) {
    if (
        source.animated
    ) {
        return "gif";
    }

    const contentType =
        source.contentType ||
        "";

    if (
        contentType.includes(
            "webp"
        )
    ) {
        return "webp";
    }

    return "png";
}

function getStickerFormat(
    source
) {
    if (
        source.format === 2
    ) {
        return 2;
    }

    return 1;
}

export default {
    name: "stl",

    permission: 1,

    async execute(
        message
    ) {
        let source =
            await getSource(
                message
            );

        if (!source) {
            source =
                getAttachmentSource(
                    message
                );
        }

        if (!source) {
            await message.react(
                "❌"
            );

            return;
        }

        try {

            if (
                source.type === "emoji"
            ) {
                const extension =
                    source.animated
                        ? "gif"
                        : "png";

                const emoji =
                    await message.guild.emojis.create({
                        attachment:
                            source.url,
                        name:
                            `stl_${Date.now()}`,
                        reason:
                            `Emoji agregado por ${message.author.tag}`
                    });

                await message.reply({
                    embeds: [
                        createResultEmbed(
                            "emoji",
                            emoji
                        )
                    ]
                });

                return;
            }

            if (
                source.type === "sticker"
            ) {
                const sticker =
                    await message.guild.stickers.create({
                        file:
                            source.url,
                        name:
                            ".gg/devgru",
                        tags:
                            ".gg/devgru",
                        reason:
                            `Sticker agregado por ${message.author.tag}`
                    });

                await message.reply({
                    embeds: [
                        createResultEmbed(
                            "sticker",
                            sticker
                        )
                    ]
                });

                return;
            }

            const sentMessage =
                await message.reply({
                    embeds: [
                        createInitialEmbed()
                    ],
                    components: [
                        createButtons()
                    ]
                });

            const collector =
                sentMessage.createMessageComponentCollector({
                    filter:
                        interaction =>
                            [
                                "stl_emoji",
                                "stl_sticker",
                                "stl_cancel"
                            ].includes(
                                interaction.customId
                            ),
                    idle: 30000
                });

            collector.on(
                "collect",
                async interaction => {
                    if (
                        interaction.user.id !==
                        message.author.id
                    ) {
                        await interaction.reply({
                            content:
                                "Esta interacción no te pertenece.",
                            ephemeral: true
                        });

                        return;
                    }

                    if (
                        interaction.customId ===
                        "stl_cancel"
                    ) {
                        await interaction.message.delete()
                            .catch(() => {});

                        collector.stop(
                            "cancelled"
                        );

                        return;
                    }

                    try {
                        if (
                            interaction.customId ===
                            "stl_emoji"
                        ) {
                            const extension =
                                source.contentType?.includes(
                                    "gif"
                                )
                                    ? "gif"
                                    : source.contentType?.includes(
                                        "webp"
                                    )
                                        ? "webp"
                                        : "png";

                            const emoji =
                                await message.guild.emojis.create({
                                    attachment:
                                        source.url,
                                    name:
                                        `stl_${Date.now()}`,
                                    reason:
                                        `Emoji agregado por ${message.author.tag}`
                                });

                            await interaction.update({
                                embeds: [
                                    createResultEmbed(
                                        "emoji",
                                        emoji
                                    )
                                ],
                                components: []
                            });

                            collector.stop(
                                "completed"
                            );

                            return;
                        }

                        if (
                            interaction.customId ===
                            "stl_sticker"
                        ) {
                            const sticker =
                                await message.guild.stickers.create({
                                    file:
                                        source.url,
                                    name:
                                        ".gg/devgru",
                                    tags:
                                        ".gg/devgru",
                                    reason:
                                        `Sticker agregado por ${message.author.tag}`
                                });

                            await interaction.update({
                                embeds: [
                                    createResultEmbed(
                                        "sticker",
                                        sticker
                                    )
                                ],
                                components: []
                            });

                            collector.stop(
                                "completed"
                            );
                        }

                    } catch (error) {
                        console.error(
                            "Error agregando contenido:",
                            error
                        );

                        await interaction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(
                                        EMBED_COLOR
                                    )
                                    .setTitle(
                                        "No se pudo agregar"
                                    )
                                    .setDescription(
                                        "❌ No se pudo agregar el contenido al servidor."
                                    )
                            ],
                            components: []
                        });

                        collector.stop(
                            "error"
                        );
                    }
                }
            );

            collector.on(
                "end",
                async (
                    _,
                    reason
                ) => {
                    if (
                        reason ===
                            "cancelled" ||
                        reason ===
                            "completed" ||
                        reason ===
                            "error"
                    ) {
                        return;
                    }

                    try {
                        await sentMessage.edit({
                            components: []
                        });
                    } catch {}
                }
            );

        } catch (error) {
            console.error(
                "Error en comando stl:",
                error
            );

            await message.react(
                "❌"
            );
        }
    }
};