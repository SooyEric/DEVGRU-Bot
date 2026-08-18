import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";

export default {
    name: "avatar",
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

            const globalAvatar =
                user.displayAvatarURL({
                    extension:
                        user.avatar?.startsWith("a_")
                            ? "gif"
                            : "png",
                    size: 4096
                });

            const serverAvatar =
                member?.avatar
                    ? member.avatar.startsWith("a_")
                        ? member.avatarURL({
                            extension: "gif",
                            size: 4096
                        })
                        : member.avatarURL({
                            extension: "png",
                            size: 4096
                        })
                    : null;

            const createEmbed =
                type => {
                    const avatar =
                        type === "server" &&
                        serverAvatar
                            ? serverAvatar
                            : globalAvatar;

                    return new EmbedBuilder()
                        .setColor(
                            "#ffaf1a"
                        )
                        .setTitle(
                            `Avatar de ${user.username}`
                        )
                        .setImage(
                            avatar
                        );
                };

            if (!serverAvatar) {
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
                                "avatar_menu"
                            )
                            .setPlaceholder(
                                "Selecciona Avatar"
                            )
                            .addOptions(
                            {
                                    label: "Global",
                                    value: "global",
                                    emoji: {
                                        id: "1539096076366258269",
                                        name: "global"
                                    }
                                },
                                {
                                    label: "Servidor",
                                    value: "server",
                                    emoji: {
                                        id: "1539095904156385412",
                                        name: "home"
                                }
                            )
                    );

            let selectedAvatar =
                "global";

            const sentMessage =
                await message.reply({
                    embeds: [
                        createEmbed(
                            selectedAvatar
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
                            "avatar_menu",
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

                    collector.resetTimer();

                    selectedAvatar =
                        interaction.values[0];

                    await interaction.update({
                        embeds: [
                            createEmbed(
                                selectedAvatar
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
                                    selectedAvatar
                                )
                            ],
                            components: []
                        });
                    } catch {}
                }
            );

        } catch (error) {
            console.error(
                "Error en comando avatar:",
                error
            );

            await message.react("❌");
        }
    }
};