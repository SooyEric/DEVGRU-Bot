import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

const EMBED_COLOR =
    "#ffaf1a";

const GIVEAWAY_CHANNEL_ID =
    "1525029698843709595";

const giveaways =
    new Map();

function parseDuration(
    input
) {
    if (!input) {
        return null;
    }

    const match =
        input
            .trim()
            .toLowerCase()
            .match(
                /^(\d+)\s*(s|m|h|d|w)$/
            );

    if (!match) {
        return null;
    }

    const amount =
        Number(match[1]);

    const unit =
        match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return (
        amount *
        multipliers[unit]
    );
}

function formatDuration(
    duration
) {
    const seconds =
        Math.floor(
            duration / 1000
        );

    if (
        seconds <
        60
    ) {
        return `${seconds}s`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (
        minutes <
        60
    ) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (
        hours <
        24
    ) {
        return `${hours}h`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    if (
        days <
        7
    ) {
        return `${days}d`;
    }

    const weeks =
        Math.floor(
            days / 7
        );

    return `${weeks}w`;
}

function getConfigEmbed(
    config
) {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            "Configuración del Giveaway"
        )
        .setDescription(
            `**Premio:** ${
                config.prize ||
                "No configurado"
            }\n` +
            `**Duración:** ${
                config.duration
                    ? formatDuration(
                        config.duration
                    )
                    : "No configurada"
            }\n` +
            `**Ganadores:** ${
                config.winners ||
                "No configurado"
            }`
        );
}

function getConfigButtons(
    config
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "giveaway_configure"
                )
                .setLabel(
                    "Configurar"
                )
                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    "giveaway_publish"
                )
                .setLabel(
                    "Publicar"
                )
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    "giveaway_cancel"
                )
                .setLabel(
                    "✕"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

function getGiveawayEmbed(
    giveaway,
    ended = false
) {
    const endTimestamp =
        Math.floor(
            giveaway.endAt /
                1000
        );

    const embed =
        new EmbedBuilder()
            .setColor(
                EMBED_COLOR
            )
            .setTitle(
                "🎉 Giveaway"
            )
            .setDescription(
                `## ${giveaway.prize}\n\n` +
                `**Ganadores:** \`${giveaway.winnersCount}\`\n` +
                `**Participantes:** \`${giveaway.participants.size}\`\n\n` +
                (
                    ended
                        ? "**Giveaway finalizado**"
                        : `**Finaliza:** <t:${endTimestamp}:R>`
                )
            )
            .setTimestamp(
                giveaway.endAt
            );

    if (ended) {
        const winners =
            giveaway.winners;

        embed.addFields({
            name:
                "🏆 Ganador(es)",
            value:
                winners.length > 0
                    ? winners
                        .map(
                            id =>
                                `<@${id}>`
                        )
                        .join("\n")
                    : "No hubo participantes."
        });
    }

    return embed;
}

function getGiveawayButtons(
    giveaway,
    ended = false
) {
    if (ended) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `giveaway_reroll:${giveaway.id}`
                    )
                    .setLabel(
                        "Reroll"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `giveaway_participants:${giveaway.id}`
                    )
                    .setLabel(
                        "Participantes"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );
    }

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `giveaway_join:${giveaway.id}`
                )
                .setLabel(
                    "🎉 Participar"
                )
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

function pickWinners(
    giveaway
) {
    const participants =
        [...giveaway.participants];

    if (
        participants.length === 0
    ) {
        return [];
    }

    const winners = [];

    while (
        winners.length <
            giveaway.winnersCount &&
        participants.length > 0
    ) {
        const index =
            Math.floor(
                Math.random() *
                participants.length
            );

        winners.push(
            participants[index]
        );

        participants.splice(
            index,
            1
        );
    }

    return winners;
}

async function finishGiveaway(
    giveaway,
    client
) {
    if (
        giveaway.ended
    ) {
        return;
    }

    giveaway.ended =
        true;

    giveaway.winners =
        pickWinners(
            giveaway
        );

    try {
        const channel =
            await client.channels.fetch(
                GIVEAWAY_CHANNEL_ID
            );

        if (!channel) {
            return;
        }

        const message =
            await channel.messages.fetch(
                giveaway.messageId
            );

        await message.edit({
            embeds: [
                getGiveawayEmbed(
                    giveaway,
                    true
                )
            ],
            components: [
                getGiveawayButtons(
                    giveaway,
                    true
                )
            ]
        });

        if (
            giveaway.winners.length > 0
        ) {
            await channel.send({
                content:
                    `🎉 ${giveaway.winners
                        .map(
                            id =>
                                `<@${id}>`
                        )
                        .join(
                            ", "
                        )} ha${giveaway.winners.length === 1 ? "" : "n"} ganado **${giveaway.prize}**.`
            });
        } else {
            await channel.send({
                content:
                    `🎉 El giveaway de **${giveaway.prize}** terminó sin participantes.`
            });
        }

    } catch (error) {
        console.error(
            "Error finalizando giveaway:",
            error
        );
    }
}

export default {
    name:
        "giveaway",

    permission:
        1,

    async execute(
        message
    ) {
        const config = {
            ownerId:
                message.author.id,

            prize:
                null,

            duration:
                null,

            winners:
                null
        };

        const sentMessage =
            await message.reply({
                ephemeral:
                    true,
                embeds: [
                    getConfigEmbed(
                        config
                    )
                ],
                components: [
                    getConfigButtons(
                        config
                    )
                ]
            });

        const collector =
            sentMessage.createMessageComponentCollector({
                idle:
                    120000
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
                        ephemeral:
                            true
                    });

                    return;
                }

                if (
                    interaction.customId ===
                    "giveaway_cancel"
                ) {
                    await interaction.update({
                        content:
                            "Giveaway cancelado.",
                        embeds: [],
                        components: []
                    });

                    collector.stop(
                        "cancelled"
                    );

                    return;
                }

                if (
                    interaction.customId ===
                    "giveaway_configure"
                ) {
                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                "giveaway_modal"
                            )
                            .setTitle(
                                "Configurar Giveaway"
                            );

                    const prizeInput =
                        new TextInputBuilder()
                            .setCustomId(
                                "giveaway_prize"
                            )
                            .setLabel(
                                "Premio"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(
                                true
                            )
                            .setMaxLength(
                                100
                            )
                            .setValue(
                                config.prize ||
                                ""
                            );

                    const durationInput =
                        new TextInputBuilder()
                            .setCustomId(
                                "giveaway_duration"
                            )
                            .setLabel(
                                "Duración"
                            )
                            .setPlaceholder(
                                "Ejemplo: 10m, 2h, 3d"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(
                                true
                            )
                            .setValue(
                                config.duration
                                    ? formatDuration(
                                        config.duration
                                    )
                                    : ""
                            );

                    const winnersInput =
                        new TextInputBuilder()
                            .setCustomId(
                                "giveaway_winners"
                            )
                            .setLabel(
                                "Número de ganadores"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(
                                true
                            )
                            .setValue(
                                config.winners
                                    ? String(
                                        config.winners
                                    )
                                    : "1"
                            );

                    modal.addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                prizeInput
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                durationInput
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                winnersInput
                            )
                    );

                    await interaction.showModal(
                        modal
                    );

                    try {
                        const submitted =
                            await interaction.awaitModalSubmit({
                                time:
                                    120000,
                                filter:
                                    modalInteraction =>
                                        modalInteraction.user.id ===
                                        message.author.id
                            });

                        const prize =
                            submitted.fields.getTextInputValue(
                                "giveaway_prize"
                            ).trim();

                        const duration =
                            parseDuration(
                                submitted.fields.getTextInputValue(
                                    "giveaway_duration"
                                )
                            );

                        const winners =
                            Number(
                                submitted.fields.getTextInputValue(
                                    "giveaway_winners"
                                )
                            );

                        if (
                            !prize ||
                            !duration ||
                            duration <
                                10000 ||
                            !Number.isInteger(
                                winners
                            ) ||
                            winners <
                                1 ||
                            winners >
                                100
                        ) {
                            await submitted.reply({
                                content:
                                    "Configuración inválida.",
                                ephemeral:
                                    true
                            });

                            return;
                        }

                        config.prize =
                            prize;

                        config.duration =
                            duration;

                        config.winners =
                            winners;

                        await submitted.update({
                            embeds: [
                                getConfigEmbed(
                                    config
                                )
                            ],
                            components: [
                                getConfigButtons(
                                    config
                                )
                            ]
                        });

                    } catch {}
                    
                    return;
                }

                if (
                    interaction.customId ===
                    "giveaway_publish"
                ) {
                    if (
                        !config.prize ||
                        !config.duration ||
                        !config.winners
                    ) {
                        await interaction.reply({
                            content:
                                "Configura el giveaway primero.",
                            ephemeral:
                                true
                        });

                        return;
                    }

                    const channel =
                        await message.guild.channels.fetch(
                            GIVEAWAY_CHANNEL_ID
                        ).catch(
                            () => null
                        );

                    if (
                        !channel
                    ) {
                        await interaction.reply({
                            content:
                                "No se encontró el canal del giveaway.",
                            ephemeral:
                                true
                        });

                        return;
                    }

                    const giveawayId =
                        `${message.id}-${Date.now()}`;

                    const endAt =
                        Date.now() +
                        config.duration;

                    const giveaway = {
                        id:
                            giveawayId,

                        guildId:
                            message.guild.id,

                        channelId:
                            GIVEAWAY_CHANNEL_ID,

                        messageId:
                            null,

                        ownerId:
                            message.author.id,

                        prize:
                            config.prize,

                        winnersCount:
                            config.winners,

                        participants:
                            new Set(),

                        winners:
                            [],

                        endAt,

                        ended:
                            false
                    };

                    const giveawayMessage =
                        await channel.send({
                            embeds: [
                                getGiveawayEmbed(
                                    giveaway
                                )
                            ],
                            components: [
                                getGiveawayButtons(
                                    giveaway
                                )
                            ]
                        });

                    giveaway.messageId =
                        giveawayMessage.id;

                    giveaways.set(
                        giveaway.id,
                        giveaway
                    );

                    setTimeout(
                        () =>
                            finishGiveaway(
                                giveaway,
                                message.client
                            ),
                        config.duration
                    );

                    await interaction.update({
                        content:
                            "Giveaway publicado correctamente.",
                        embeds: [],
                        components: []
                    });

                    collector.stop(
                        "published"
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
                        "published"
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
    },

    giveaways
};