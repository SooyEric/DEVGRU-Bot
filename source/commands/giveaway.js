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

const initializedClients =
    new WeakSet();

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
            `<:gift:1538322136371044422> **Premio**: \`${
                config.prize ||
                "No configurado"
            }\`\n` +

            `<:time:1538102015241224192> **Duración**: \`${
                config.duration
                    ? formatDuration(
                        config.duration
                    )
                    : "No configurada"
            }\`\n` +

            `<:win:1538323077912334356> **Ganadores**: \`${
                config.winners ||
                "No configurado"
            }\`\n` +

            `<:info:1538323825542963270> **Requisitos**: \`${
                config.requirements ||
                "Sin requisitos"
            }\``
        );
}

function getConfigButtons() {
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
                "<:gwa:1538324626621337692> Giveaway"
            )
            .setDescription(
                `# ${giveaway.prize} <:premio:1538335648262389822>\n\n` +

                `<:win:1538323077912334356> **Ganadores**: \`${giveaway.winnersCount}\`\n` +

                `<:grupo:1538323345831895090> **Participantes**: \`${giveaway.participants.size}\`\n` +

                `<:info:1538323825542963270> **Requisitos**: \`${
                    giveaway.requirements ||
                    "Sin requisitos"
                }\`\n\n` +

                (
                    ended
                        ? "**Giveaway Finalizado**"
                        : `<:time:1538102015241224192> **Finaliza**: <t:${endTimestamp}:R>`
                )
            )
.setFooter({
    text: `Creado el ${new Date(giveaway.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "America/Mexico_City"
    })} a las ${new Date(giveaway.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Mexico_City"
    }).replace(" ", "").toLowerCase()}`
});

    if (
        ended
    ) {
        embed.addFields({
            name:
                "<:wina:1538328677836791808> Ganador(es)",
            value:
                giveaway.winners.length > 0
                    ? giveaway.winners
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
    if (
        ended
    ) {
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
                    "Participar"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

function pickWinners(
    giveaway,
    excluded = []
) {
    const excludedSet =
        new Set(
            excluded
        );

    const participants =
        [
            ...giveaway.participants
        ].filter(
            id =>
                !excludedSet.has(
                    id
                )
        );

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

function pickSingleWinner(
    giveaway,
    excluded = []
) {
    const excludedSet =
        new Set(
            excluded
        );

    const available =
        [
            ...giveaway.participants
        ].filter(
            id =>
                !excludedSet.has(
                    id
                )
        );

    if (
        available.length ===
        0
    ) {
        return null;
    }

    return available[
        Math.floor(
            Math.random() *
            available.length
        )
    ];
}

async function getGiveawayMessage(
    giveaway,
    client
) {
    const channel =
        await client.channels.fetch(
            giveaway.channelId
        );

    if (!channel) {
        return null;
    }

    return channel.messages.fetch(
        giveaway.messageId
    );
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
        const message =
            await getGiveawayMessage(
                giveaway,
                client
            );

        if (!message) {
            return;
        }

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

        const channel =
            message.channel;

        if (
            giveaway.winners.length >
            0
        ) {
            await channel.send({
                content:
                    `<:gwa:1538324626621337692> ${giveaway.winners
                        .map(
                            id =>
                                `<@${id}>`
                        )
                        .join(
                            ", "
                        )} ha${
                        giveaway.winners.length ===
                        1
                            ? ""
                            : "n"
                    } ganado **${
                        giveaway.prize
                    }**.`
            });
        } else {
            await channel.send({
                content:
                    `<:gwa:1538324626621337692> El giveaway de **${giveaway.prize}** terminó sin participantes.`
            });
        }

    } catch (
        error
    ) {
        console.error(
            "Error finalizando giveaway:",
            error
        );
    }
}

function initializeGiveawayInteractions(
    client
) {
    if (
        initializedClients.has(
            client
        )
    ) {
        return;
    }

    initializedClients.add(
        client
    );

    client.on(
        "interactionCreate",
        async interaction => {
            if (
                !interaction.isButton()
            ) {
                return;
            }

            const parts =
                interaction.customId.split(
                    ":"
                );

            const action =
                parts[0];

            if (
                ![
                    "giveaway_join",
                    "giveaway_reroll",
                    "giveaway_participants"
                ].includes(
                    action
                )
            ) {
                return;
            }

            const giveawayId =
                parts[1];

            const giveaway =
                giveaways.get(
                    giveawayId
                );

            if (!giveaway) {
                await interaction.reply({
                    content:
                        "Este giveaway ya no está disponible.",
                    ephemeral:
                        true
                });

                return;
            }

            if (
                action ===
                "giveaway_join"
            ) {
                if (
                    giveaway.ended
                ) {
                    await interaction.reply({
                        content:
                            "Este giveaway ya terminó.",
                        ephemeral:
                            true
                    });

                    return;
                }

                if (
                    giveaway.participants.has(
                        interaction.user.id
                    )
                ) {
                    giveaway.participants.delete(
                        interaction.user.id
                    );

                    await interaction.reply({
                        content:
                            "Has salido del giveaway.",
                        ephemeral:
                            true
                    });
                } else {
                    giveaway.participants.add(
                        interaction.user.id
                    );

                    await interaction.reply({
                        content:
                            "Has entrado al giveaway.",
                        ephemeral:
                            true
                    });
                }

                try {
                    await interaction.message.edit({
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
                } catch {}

                return;
            }

            if (
                action ===
                "giveaway_participants"
            ) {
                if (
                    !giveaway.ended
                ) {
                    await interaction.reply({
                        content:
                            "El giveaway todavía está activo.",
                        ephemeral:
                            true
                    });

                    return;
                }

                const participants =
                    [
                        ...giveaway.participants
                    ];

                if (
                    participants.length ===
                    0
                ) {
                    await interaction.reply({
                        content:
                            "No hubo participantes.",
                        ephemeral:
                            true
                    });

                    return;
                }

                const list =
                    participants
                        .map(
                            (
                                id,
                                index
                            ) =>
                                `${
                                    index +
                                    1
                                }. <@${id}>`
                        )
                        .join(
                            "\n"
                        );

                const chunks = [];

                for (
                    let i = 0;
                    i < list.length;
                    i += 1900
                ) {
                    chunks.push(
                        list.slice(
                            i,
                            i + 1900
                        )
                    );
                }

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                EMBED_COLOR
                            )
                            .setTitle(
                                "Participantes"
                            )
                            .setDescription(
                                chunks[0]
                            )
                    ],
                    ephemeral:
                        true
                });

                return;
            }

            if (
                action ===
                "giveaway_reroll"
            ) {
                if (
                    !giveaway.ended
                ) {
                    await interaction.reply({
                        content:
                            "El giveaway todavía está activo.",
                        ephemeral:
                            true
                    });

                    return;
                }

                if (
                    interaction.user.id !==
                    giveaway.ownerId
                ) {
                    await interaction.reply({
                        content:
                            "Solo quien creó el giveaway puede hacer reroll.",
                        ephemeral:
                            true
                    });

                    return;
                }

                const modal =
                    new ModalBuilder()
                        .setCustomId(
                            `giveaway_reroll_modal:${giveaway.id}`
                        )
                        .setTitle(
                            "Reroll de ganador"
                        );

                const winnerInput =
                    new TextInputBuilder()
                        .setCustomId(
                            "giveaway_winner_id"
                        )
                        .setLabel(
                            "ID del ganador a reemplazar"
                        )
                        .setPlaceholder(
                            "ID de Discord"
                        )
                        .setStyle(
                            TextInputStyle.Short
                        )
                        .setRequired(
                            true
                        );

                modal.addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            winnerInput
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
                                    giveaway.ownerId
                        });

                    const winnerId =
                        submitted.fields
                            .getTextInputValue(
                                "giveaway_winner_id"
                            )
                            .replace(
                                /[<@!>]/g,
                                ""
                            )
                            .trim();

                    if (
                        !/^\d{17,20}$/.test(
                            winnerId
                        )
                    ) {
                        await submitted.reply({
                            content:
                                "ID de usuario inválido.",
                            ephemeral:
                                true
                        });

                        return;
                    }

                    if (
                        !giveaway.winners.includes(
                            winnerId
                        )
                    ) {
                        await submitted.reply({
                            content:
                                "Ese usuario no es uno de los ganadores actuales.",
                            ephemeral:
                                true
                        });

                        return;
                    }

                    const newWinner =
                        pickSingleWinner(
                            giveaway,
                            [
                                ...giveaway.winners,
                                winnerId
                            ]
                        );

                    if (
                        !newWinner
                    ) {
                        await submitted.reply({
                            content:
                                "No hay participantes disponibles para reemplazar a este ganador.",
                            ephemeral:
                                true
                        });

                        return;
                    }

                    giveaway.participants.delete(
                        winnerId
                    );

                    const winnerIndex =
                        giveaway.winners.indexOf(
                            winnerId
                        );

                    giveaway.winners[
                        winnerIndex
                    ] =
                        newWinner;

                    await submitted.update({
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

                    await interaction.message.channel.send({
                        content:
                            `<:gwa:1538324626621337692> <@${newWinner}> ha ganado el reroll de **${giveaway.prize}**.`
                    });

                } catch {}

                return;
            }
        }
    );
}

export default {
    name:
        "giveaway",
    aliases: [
        "gw"
    ],
    permission:
        1,

    async execute(
        message
    ) {
        initializeGiveawayInteractions(
            message.client
        );

        const config = {
            ownerId:
                message.author.id,

            prize:
                null,

            duration:
                null,

            winners:
                null,

            requirements:
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
                    getConfigButtons()
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

                    const requirementsInput =
                        new TextInputBuilder()
                            .setCustomId(
                                "giveaway_requirements"
                            )
                            .setLabel(
                                "Requisitos (opcional)"
                            )
                            .setPlaceholder(
                                "Ejemplo: Ser miembro de DEVGRU"
                            )
                            .setStyle(
                                TextInputStyle.Paragraph
                            )
                            .setRequired(
                                false
                            )
                            .setMaxLength(
                                1000
                            )
                            .setValue(
                                config.requirements ||
                                ""
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
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                requirementsInput
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
                            submitted.fields
                                .getTextInputValue(
                                    "giveaway_prize"
                                )
                                .trim();

                        const duration =
                            parseDuration(
                                submitted.fields
                                    .getTextInputValue(
                                        "giveaway_duration"
                                    )
                            );

                        const winners =
                            Number(
                                submitted.fields
                                    .getTextInputValue(
                                        "giveaway_winners"
                                    )
                            );

                        const requirements =
                            submitted.fields
                                .getTextInputValue(
                                    "giveaway_requirements"
                                )
                                .trim();

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

                        config.requirements =
                            requirements ||
                            null;

                        await submitted.update({
                            embeds: [
                                getConfigEmbed(
                                    config
                                )
                            ],

                            components: [
                                getConfigButtons()
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
                            
                            createdAt:
    Date.now(),

                        prize:
                            config.prize,

                        winnersCount:
                            config.winners,

                        requirements:
                            config.requirements,

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