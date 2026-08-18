import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

const ROLES_PER_PAGE = 10;
const TIMEOUT = 30 * 1000;

function createEmbed(
    guild,
    roles,
    page,
    totalPages
) {
    const start =
        page * ROLES_PER_PAGE;

    const pageRoles =
        roles.slice(
            start,
            start + ROLES_PER_PAGE
        );

    const description =
        pageRoles.length > 0
            ? pageRoles
                .map(
                    (role, index) => {
                        const globalIndex =
                            start + index + 1;

                        const number =
                            String(
                                globalIndex
                            ).padStart(
                                2,
                                "0"
                            );

                        return (
                            \`${number}\ ${role} - \`${role.id}\``
                        );
                    }
                )
                .join("\n")
            : "No hay roles para mostrar.";

    return new EmbedBuilder()
        .setColor("#ffaf1a")
        .setAuthor({
            name: guild.name,
            iconURL:
                guild.iconURL({
                    size: 64
                }) || undefined
        })
        .setTitle(
            `Roles en ${guild.name}`
        )
        .setDescription(
            description
        )
        .setFooter({
            text:
                `Página ${page + 1} de ${totalPages}`
        });
}

function createButtons() {
    const leftButton =
        new ButtonBuilder()
            .setCustomId(
                "roles_previous"
            )
            .setEmoji(
                "<:left:1538544846459899955>"
            )
            .setStyle(
                ButtonStyle.Secondary
            );

    const rightButton =
        new ButtonBuilder()
            .setCustomId(
                "roles_next"
            )
            .setEmoji(
                "<:right:1538541644695998545>"
            )
            .setStyle(
                ButtonStyle.Secondary
            );

    const deleteButton =
        new ButtonBuilder()
            .setCustomId(
                "roles_delete"
            )
            .setEmoji(
                "<:cancel:1538544866659672144>"
            )
            .setStyle(
                ButtonStyle.Danger
            );

    return new ActionRowBuilder()
        .addComponents(
            leftButton,
            rightButton,
            deleteButton
        );
}

export default {
    name: "roles",
    permission: 2,

    async execute(message) {

        const roles =
            message.guild.roles.cache
                .filter(
                    role =>
                        role.id !==
                            message.guild.id &&
                        !role.managed
                )
                .sort(
                    (a, b) =>
                        b.position -
                        a.position
                );

        const roleList =
            [...roles.values()];

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    roleList.length /
                    ROLES_PER_PAGE
                )
            );

        let currentPage = 0;

        const sentMessage =
            await message.channel.send({
                embeds: [
                    createEmbed(
                        message.guild,
                        roleList,
                        currentPage,
                        totalPages
                    )
                ],
                components: [
                    createButtons()
                ]
            });

        const collector =
            sentMessage.createMessageComponentCollector();

        let inactivityTimeout;

        const resetInactivityTimer =
            () => {
                clearTimeout(
                    inactivityTimeout
                );

                inactivityTimeout =
                    setTimeout(
                        () => {
                            collector.stop(
                                "timeout"
                            );
                        },
                        TIMEOUT
                    );
            };

        resetInactivityTimer();

        collector.on(
            "collect",
            async interaction => {

                if (
                    interaction.user.id !==
                    message.author.id
                ) {
                    await interaction.reply({
                        content:
                            "❌ Estos botones no te pertenecen.",
                        ephemeral: true
                    });

                    return;
                }

                if (
                    interaction.customId ===
                    "roles_delete"
                ) {
                    await interaction.message.delete();

                    collector.stop(
                        "deleted"
                    );

                    return;
                }

                if (
                    interaction.customId ===
                    "roles_previous"
                ) {
                    currentPage =
                        currentPage === 0
                            ? totalPages - 1
                            : currentPage - 1;
                }

                if (
                    interaction.customId ===
                    "roles_next"
                ) {
                    currentPage =
                        currentPage ===
                        totalPages - 1
                            ? 0
                            : currentPage + 1;
                }

                await interaction.update({
                    embeds: [
                        createEmbed(
                            message.guild,
                            roleList,
                            currentPage,
                            totalPages
                        )
                    ],
                    components: [
                        createButtons()
                    ]
                });

                resetInactivityTimer();
            }
        );

        collector.on(
            "end",
            async (
                collected,
                reason
            ) => {

                clearTimeout(
                    inactivityTimeout
                );

                if (
                    reason ===
                    "deleted"
                ) {
                    return;
                }

                try {
                    await sentMessage.edit({
                        components: []
                    });
                } catch {
                }
            }
        );
    }
};