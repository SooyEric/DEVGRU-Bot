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

function createServerEmbed(
    guild,
    user,
    type = "server"
) {
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
        guild.members.cache.get(
            user.id
        )?.joinedAt;

    if (type === "icon") {
        const embed =
            new EmbedBuilder()
                .setColor(
                    EMBED_COLOR
                )
                .setTitle(
                    "Icono del servidor"
                )
                .setAuthor({
                    name: guild.name,
                    iconURL:
                        iconURL ||
                        undefined
                });

        if (iconURL) {
            embed.setImage(
                iconURL
            );
        } else {
            embed.setDescription(
                "Este servidor no tiene un icono."
            );
        }

        embed.setFooter({
            text:
                `Unido el ${
                    joinedAt
                        ? formatDate(
                            joinedAt
                        )
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
                .setColor(
                    EMBED_COLOR
                )
                .setTitle(
                    "Banner del servidor"
                )
                .setAuthor({
                    name: guild.name,
                    iconURL:
                        iconURL ||
                        undefined
                });

        if (bannerURL) {
            embed.setImage(
                bannerURL
            );
        } else {
            embed.setDescription(
                "Este servidor no tiene un banner."
            );
        }

        embed.setFooter({
            text:
                `Unido el ${
                    joinedAt
                        ? formatDate(
                            joinedAt
                        )
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

    const humans =
        guild.memberCount -
        guild.members.cache.filter(
            member =>
                member.user.bot
        ).size;

    const bots =
        guild.members.cache.filter(
            member =>
                member.user.bot
        ).size;

    const roles =
        guild.roles.cache.filter(
            role =>
                role.id !== guild.id
        ).size;

    const boosts =
        guild.premiumSubscriptionCount ||
        0;

    const level =
        getBoostLevel(
            guild.premiumTier
        );

    const emojis =
        guild.emojis.cache.size;

    const stickers =
        guild.stickers.cache.size;

    const embed =
        new EmbedBuilder()
            .setColor(
                EMBED_COLOR
            )
            .setTitle(
                "Información del Servidor"
            )
            .setAuthor({
                name: guild.name,
                iconURL:
                    iconURL ||
                    undefined
            })
            .setDescription(
                `<:boss:1538099028372365333> **Propietario**: <@${guild.ownerId}>\n` +
                `<:config:1538099479759294484> **ID del Servidor**: \`${guild.id}\`\n` +
                `<:time:1538102015241224192> **Creación**: <t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n` +
                `<:link:1538100394532806736> **Link**: \`discord.gg/devgru\`\n\n` +

                `<:persona:1538099937391288380> **Miembros**: \`${humans}\`\n` +
                `<:bots:1538102735558279268> **Bots**: \`${bots}\`\n` +
                `<:ping:1538103877306548234> **Roles**: \`${roles}\`\n` +
                `<:boost:1538100006249046027> **Mejoras**: \`${boosts}\`\n` +
                `<:lvl:1538099654149935176> **Nivel**: \`${level}\`\n` +
                `<:emojii:1538102791409504306> **Emojis**: \`${emojis}\`\n` +
                `<:star:1538104433248960532> **Stickers**: \`${stickers}\``
            )
            .setFooter({
                text:
                    `Unido el ${
                        joinedAt
                            ? formatDate(
                                joinedAt
                            )
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
                .setCustomId(
                    "serverinfo_menu"
                )
                .setPlaceholder(
                    "Selecciona una categoría"
                )
                .addOptions(
                    {
                        label: "Servidor",
                        value: "server",
                    },
                    {
                        label: "Icono",
                        value: "icon",
                    },
                    {
                        label: "Banner",
                        value: "banner",
                    }
                )
        );
}

export default {
    name: "serverinfo",

    permission: 2,

    async execute(
        message
    ) {
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
                    filter:
                        interaction =>
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

                    const embed =
                        createServerEmbed(
                            message.guild,
                            message.author,
                            selected
                        );

                    await interaction.update({
                        embeds: [
                            embed
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
                        const embed =
                            createServerEmbed(
                                message.guild,
                                message.author,
                                "server"
                            );

                        await sentMessage.edit({
                            embeds: [
                                embed
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

            await message.react(
                "❌"
            );
        }
    }
};