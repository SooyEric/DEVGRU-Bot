import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";

export default {
    name: "banner",
    permission: 2,

    async execute(message, args) {
        try {
            let user;

            if (message.mentions.users.first()) {
                user =
                    message.mentions.users.first();
            } else if (args[0]) {
                const userId =
                    args[0].replace(/[<@!>]/g, "");

                if (
                    !/^\d{17,20}$/.test(userId)
                ) {
                    await message.react("❌");
                    return;
                }

                user =
                    await message.client.users.fetch(
                        userId
                    );
            } else {
                user =
                    message.author;
            }

            user =
                await message.client.users.fetch(
                    user.id,
                    {
                        force: true
                    }
                );

            const member =
                await message.guild.members.fetch(
                    user.id
                ).catch(() => null);

            const globalBanner =
                user.bannerURL({
                    extension: "png",
                    size: 4096
                });

            if (!globalBanner) {
                await message.react("❌");
                return;
            }

            const serverBanner =
                member?.bannerURL({
                    extension: "png",
                    size: 4096
                });

            const hasServerBanner =
                Boolean(serverBanner);

            const createEmbed =
                type => {
                    const banner =
                        type === "server" &&
                        serverBanner
                            ? serverBanner
                            : globalBanner;

                    return new EmbedBuilder()
                        .setColor(
                            "#ffaf1a"
                        )
                        .setTitle(
                            `Banner de ${user.username}`
                        )
                        .setImage(
                            banner
                        );
                };

            if (!hasServerBanner) {
                await message.reply({
                    embeds: [
                        createEmbed(
                            "global"
                        )
                    ]
                });

                return;
            }

            const menu =
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(
                                "banner_menu"
                            )
                            .setPlaceholder(
                                "Selecciona Banner"
                            )
                            .addOptions(
                                {
                                    label:
                                        "Global",
                                    value:
                                        "global"
                                },
                                {
                                    label:
                                        "Servidor",
                                    value:
                                        "server"
                                }
                            )
                    );

            let selectedBanner =
                "global";

            const sentMessage =
                await message.reply({
                    embeds: [
                        createEmbed(
                            selectedBanner
                        )
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
                            "banner_menu",
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

                    selectedBanner =
                        interaction.values[0];

                    await interaction.update({
                        embeds: [
                            createEmbed(
                                selectedBanner
                            )
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
                        await sentMessage.edit({
                            embeds: [
                                createEmbed(
                                    selectedBanner
                                )
                            ],
                            components: []
                        });
                    } catch {}
                }
            );

        } catch (error) {
            console.error(
                "Error en comando banner:",
                error
            );

            await message.react("❌");
        }
    }
};