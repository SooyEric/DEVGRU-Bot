import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";

const EMBED_COLOR = "#ffaf1a";

function formatDate(date) {
    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
    }).format(date);
}

function getBoostLevel(tier) {
    return {
        0: "Nivel 0",
        1: "Nivel 1",
        2: "Nivel 2",
        3: "Nivel 3"
    }[tier] || "Nivel 0";
}

function createServerEmbed(guild, user, type = "server") {
    const iconURL =
        guild.iconURL({
            extension: "png",
            size: 128
        });

    const bannerURL =
        guild.bannerURL({
            extension: "png",
            size: 1024
        });

    const joinedAt =
        guild.members.cache.get(user.id)?.joinedAt;

    if (type === "icon") {
        const embed =
            new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setAuthor({
                    name: guild.name,
                    iconURL: iconURL || undefined
                })
                .setTitle("Icono del servidor");

        if (iconURL) {
            embed.setImage(iconURL);
        } else {
            embed.setDescription(
                "Este servidor no tiene un icono."
            );
        }

        embed.setFooter({
            text:
                `Unido el ${
                    joinedAt
                        ? formatDate(joinedAt)
                        : "desconocido"
                }`,
            iconURL:
                user.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        });

        return embed;
    }

    if (type === "banner") {
        const embed =
            new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setAuthor({
                    name: guild.name,
                    iconURL: iconURL || undefined
                })
                .setTitle("Banner del servidor");

        if (bannerURL) {
            embed.setImage(bannerURL);
        } else {
            embed.setDescription(
                "Este servidor no tiene un banner."
            );
        }

        embed.setFooter({
            text:
                `Unido el ${
                    joinedAt
                        ? formatDate(joinedAt)
                        : "desconocido"
                }`,
            iconURL:
                user.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        });

        return embed;
    }

    const members =
        guild.members.cache;

    const bots =
        members.filter(
            member => member.user.bot
        ).size;

    const humans =
        members.filter(
            member => !member.user.bot
        ).size;

    const roles =
        guild.roles.cache.filter(
            role => role.id !== guild.id
        ).size;

    const emojis =
        guild.emojis.cache.size;

    const stickers =
        guild.stickers.cache.size;

    const boosts =
        guild.premiumSubscriptionCount || 0;

    const boostLevel =
        getBoostLevel(
            guild.premiumTier
        );

    const embed =
        new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
                name: guild.name,
                iconURL: iconURL || undefined
            })
            .setDescription(
                `**ID del servidor:** \`${guild.id}\`\n` +
                `**Propietario:** <@${guild.ownerId}>\n` +
                `**Creación:** ${formatDate(guild.createdAt)}\n` +
                `**Link:** [discord.gg/devgru](https://discord.gg/devgru)`
            )
            .addFields(
                {
                    name: "Miembros",
                    value: `\`${humans}\``,
                    inline: true
                },
                {
                    name: "Bots",
                    value: `\`${bots}\``,
                    inline: true
                },
                {
                    name: "Roles",
                    value: `\`${roles}\``,
                    inline: true
                },
                {
                    name: "Mejoras",
                    value: `\`${boosts}\``,
                    inline: true
                },
                {
                    name: "Nivel",
                    value: `\`${boostLevel}\``,
                    inline: true
                },
                {
                    name: "Emojis",
                    value: `\`${emojis}\``,
                    inline: true
                },
                {
                    name: "Stickers",
                    value: `\`${stickers}\``,
                    inline: true
                }
            )
            .setFooter({
                text:
                    `Unido el ${
                        joinedAt
                            ? formatDate(joinedAt)
                            : "desconocido"
                    }`,
                iconURL:
                    user.displayAvatarURL({
                        extension: "png",
                        size: 128
                    })
            });

    return embed;
}

function createMenu() {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("serverinfo_menu")
                .setPlaceholder(
                    "Selecciona una categoría"
                )
                .addOptions(
                    {
                        label: "Servidor",
                        description:
                            "Información del servidor",
                        value: "server",
                        emoji: "🏠"
                    },
                    {
                        label: "Icono",
                        description:
                            "Ver el icono del servidor",
                        value: "icon",
                        emoji: "🖼️"
                    },
                    {
                        label: "Banner",
                        description:
                            "Ver el banner del servidor",
                        value: "banner",
                        emoji: "🎨"
                    }
                )
        );
}

export default {
    name: "serverinfo",
    permission: 2,

    async execute(message) {
        try {
            await message.guild.members.fetch();

            const embed =
                createServerEmbed(
                    message.guild,
                    message.author,
                    "server"
                );

            const menu =
                createMenu();

            const sentMessage =
                await message.reply({
                    embeds: [
                        embed
                    ],
                    components: [
                        menu
                    ]
                });

            const collector =
                sentMessage.createMessageComponentCollector({
                    filter: interaction =>
                        interaction.customId ===
                        "serverinfo_menu",
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

                    const selected =
                        interaction.values[0];

                    const updatedEmbed =
                        createServerEmbed(
                            message.guild,
                            message.author,
                            selected
                        );

                    await interaction.update({
                        embeds: [
                            updatedEmbed
                        ],
                        components: [
                            menu
                        ]
                    });
                }
            );

            collector.on(
                "end",
                async () => {
                    try {
                        await message.guild.members.fetch();

                        const updatedEmbed =
                            createServerEmbed(
                                message.guild,
                                message.author,
                                "server"
                            );

                        await sentMessage.edit({
                            embeds: [
                                updatedEmbed
                            ],
                            components: []
                        });
                    } catch {}
                }
            );

        } catch (error) {
            console.error(
                "Error en comando serverinfo:",
                error
            );

            await message.react("❌");
        }
    }
};