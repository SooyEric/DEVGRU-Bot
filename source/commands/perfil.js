import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} from "discord.js";

import logger from "../utils/logger.js";

import {
    isRobloxUserInGroup
} from "../utils/robloxGroup.js";

import {
    getRobloxProfile
} from "../utils/robloxProfile.js";

import {
    createProfileRobloxAuthorization
} from "../utils/robloxProfileOAuth.js";

const EMBED_COLOR =
    "#ffaf1a";

const PROFILE_ROLE_ID =
    "1373365866657222819";

const INACTIVE_ROLE_ID =
    "1538434883045818378";

const PROFILE_UI_TIMEOUT =
    30_000;

const SQUADRONS = [
    {
        id: "1373365857928876243",
        name: "Red Squadron"
    },
    {
        id: "1373365858784514241",
        name: "Blue Squadron"
    },
    {
        id: "1373365859640279124",
        name: "Gold Squadron"
    },
    {
        id: "1420221604020879463",
        name: "Black Squadron"
    },
    {
        id: "1535716558322540594",
        name: "Silver Squadron"
    }
];

const RANKS = [
    {
        id: "1373365811858768005",
        name: "Admiral",
        short: "SO10"
    },
    {
        id: "1373365812383187047",
        name: "Vice Admiral",
        short: "SO9"
    },
    {
        id: "1373365813490483313",
        name: "Rear Admiral Upper Half",
        short: "SO8"
    },
    {
        id: "1373365814341799958",
        name: "Rear Admiral Lower Half",
        short: "SO7"
    },
    {
        id: "1373365815524724966",
        name: "Captain",
        short: "SO6"
    },
    {
        id: "1373365816539480267",
        name: "Commander",
        short: "SO5"
    },
    {
        id: "1373365817386860729",
        name: "Lieutenant Commander",
        short: "SO4"
    },
    {
        id: "1373365818112348235",
        name: "Lieutenant",
        short: "SO3"
    },
    {
        id: "1373365819383480370",
        name: "Lieutenant Junior Grade",
        short: "SO2"
    },
    {
        id: "1373365820217884815",
        name: "Ensign",
        short: "SO1"
    },
    {
        id: "1373365821543284796",
        name: "Master Chief Petty Officer",
        short: "SOE9"
    },
    {
        id: "1373365822281748637",
        name: "Senior Chief Petty Officer",
        short: "SOE8"
    },
    {
        id: "1373365823841894531",
        name: "Chief Petty Officer",
        short: "SOE7"
    },
    {
        id: "1373365824932548679",
        name: "Petty Officer First Class",
        short: "SOE6"
    },
    {
        id: "1373365827239280751",
        name: "Petty Officer Second Class",
        short: "SOE5"
    },
    {
        id: "1373365828388655196",
        name: "Petty Officer Third Class",
        short: "SOE4"
    },
    {
        id: "1373365829860593735",
        name: "Seaman",
        short: "SOE3"
    },
    {
        id: "1373365830359847036",
        name: "Seaman Apprentice",
        short: "SOE2"
    },
    {
        id: "1373365831454556312",
        name: "Seaman Recruit",
        short: "SOE1"
    }
];

const OCCUPATIONS = [
    {
        id: "1373365833618690059",
        name: "Squadron Commander"
    },
    {
        id: "1373365835862642713",
        name: "Squadron Deputy Commander"
    },
    {
        id: "1373365837129318474",
        name: "Squadron Executive Officer"
    },
    {
        id: "1373365839037988894",
        name: "Group Commander"
    },
    {
        id: "1373365839721529506",
        name: "Squad Leader"
    },
    {
        id: "1373365840677703865",
        name: "Team Operator"
    }
];

const ACTIVITY_START_ROLES = [
    "1373365833618690059",
    "1373365835862642713",
    "1373365837129318474",
    "1373365839037988894"
];

const CATEGORIES = [
    "General",
    "Servicio",
    "Actividad",
    "Ascensos",
    "Pagas"
];

const PAYMENTS = {
    "1373365815524724966": 70,
    "1373365816539480267": 65,
    "1373365817386860729": 65,
    "1373365818112348235": 60,
    "1373365819383480370": 60,
    "1373365820217884815": 55,
    "1373365821543284796": 55,
    "1373365822281748637": 50,
    "1373365823841894531": 50,
    "1373365824932548679": 45,
    "1373365827239280751": 45,
    "1373365828388655196": 40,
    "1373365829860593735": 40
};

function createProfileTimeout(
    collector
) {
    let timeout = null;

    function reset() {
        clear();

        timeout =
            setTimeout(
                () => {
                    collector.stop(
                        "timeout"
                    );
                },
                PROFILE_UI_TIMEOUT
            );
    }

    function clear() {
        if (
            timeout
        ) {
            clearTimeout(
                timeout
            );

            timeout =
                null;
        }
    }

    return {
        reset,
        clear
    };
}

function getRank(
    member
) {
    for (
        const rank of RANKS
    ) {
        if (
            member.roles.cache.has(
                rank.id
            )
        ) {
            return `${rank.name} (${rank.short})`;
        }
    }

    return "Sin rango";
}

function getNextRank(
    member
) {
    const currentRankIndex =
        RANKS.findIndex(
            rank =>
                member.roles.cache.has(
                    rank.id
                )
        );

    if (
        currentRankIndex === -1
    ) {
        return "Sin rango";
    }

    const nextRank =
        RANKS[
            currentRankIndex - 1
        ];

    if (!nextRank) {
        return "Rango máximo";
    }

    return `${nextRank.name} (${nextRank.short})`;
}

function getPaymentRestriction(
    member
) {
    if (
        member.roles.cache.has(
            "1373365811858768005"
        ) ||
        member.roles.cache.has(
            "1373365812383187047"
        ) ||
        member.roles.cache.has(
            "1373365813490483313"
        ) ||
        member.roles.cache.has(
            "1373365814341799958"
        )
    ) {
        return (
            "<:lock:1538413056290197514> No recibes pagos."
        );
    }

    if (
        member.roles.cache.has(
            "1373365830359847036"
        ) ||
        member.roles.cache.has(
            "1373365831454556312"
        )
    ) {
        return (
            "<:lock:1538413056290197514> No puedes recibir pagos por el momento. Sube de rango y vuelve a consultar este apartado."
        );
    }

    return null;
}

function getPayment(
    member
) {
    for (
        const rank of RANKS
    ) {
        if (
            member.roles.cache.has(
                rank.id
            )
        ) {
            return PAYMENTS[
                rank.id
            ] ?? 0;
        }
    }

    return 0;
}

function getOccupation(
    member
) {
    for (
        const occupation of OCCUPATIONS
    ) {
        if (
            member.roles.cache.has(
                occupation.id
            )
        ) {
            return occupation.name;
        }
    }

    return "Sin ocupación";
}

function requiresActivityStart(
    member
) {
    return ACTIVITY_START_ROLES.some(
        roleId =>
            member.roles.cache.has(
                roleId
            )
    );
}

function getSquadron(
    member
) {
    for (
        const squadron of SQUADRONS
    ) {
        if (
            member.roles.cache.has(
                squadron.id
            )
        ) {
            return squadron.name;
        }
    }

    return "Sin escuadrón";
}

function getStatus(
    member
) {
    if (
        member.roles.cache.has(
            INACTIVE_ROLE_ID
        )
    ) {
        return "Inactivo";
    }

    return "Activo";
}

function getCategoryContent(
    category,
    member,
    robloxProfile
) {
    switch (
        category
    ) {
        case "Servicio":
            return (
                "## Servicio\n\n" +
                "<:fecha:1538412361965375528> **Fecha de Ingreso**: `00/00/00`\n" +
                "<:tiempo:1538308636265160714> **Tiempo de Servicio**: `0 meses`\n" +
                "<:espada:1538399737206669312> **Ultimo Ascenso**: `00/00/00`\n" +
                "<:rango:1538381219631464448> **Próximo Ascenso**: `Elegible el 00/00/00`"
            );

        case "Actividad":
            return (
                "## Actividad\n\n" +
                "<:time:1538102015241224192> **Horas Semanales**: `0.0h`\n" +
                "<:tiempo:1538308636265160714> **Horas Totales**: `00.0h`\n" +
                "<:web:1538416206376206408> **Misiones**: `0`\n" +
                "<:web2:1538416317844160583> **Entrenamientos**: `0`\n" +
                "<:fecha:1538412361965375528> **Ultima Actividad**: `00/00/00`"
            );

        case "Ascensos":
            return (
                "## Ascensos\n\n" +
                `<:rango:1538381219631464448> **Siguiente Rango**: \`${getNextRank(member)}\`\n\n` +
                (
                    requiresActivityStart(
                        member
                    )
                        ? "<:boss:1538099028372365333> **Iniciar Actividad**: `0/1`\n"
                        : ""
                ) +
                "<:time:1538102015241224192> **Horas Semanales**: `0/5h`\n" +
                "<:web:1538416206376206408> **Misiones Semanales**: `0/5`\n" +
                "<:web2:1538416317844160583> **Entrenamientos Semanales**: `0/1`\n" +
                "<:lock:1538413056290197514> **Elegible**: `No`"
            );

        case "Pagas": {
            const paymentRestriction =
                getPaymentRestriction(
                    member
                );

            if (
                paymentRestriction
            ) {
                return (
                    "## Pagas\n\n" +
                    paymentRestriction
                );
            }

            return (
                "## Pagas\n\n" +
                `<:lvl:1538099654149935176> **Pago de Rango**: \`R$ ${getPayment(member)}/h\`\n` +
                "<:gift:1538322136371044422> **Bonificaciones**: `R$ 0`\n" +
                "<:robux:1538413836405837855> **Total Semanal**: `R$ 0`\n\n" +
                (
                    requiresActivityStart(
                        member
                    )
                        ? "<:boss:1538099028372365333> **Iniciar Actividad**: `0/1`\n"
                        : ""
                ) +
                "<:time:1538102015241224192> **Horas Semanales**: `0/5h`\n" +
                "<:web:1538416206376206408> **Misiones Semanales**: `0/5`\n" +
                "<:web2:1538416317844160583> **Entrenamientos Semanales**: `0/1`\n" +
                "<:lock:1538413056290197514> **Elegible**: `No`"
            );
        }

        default:
            return (
                "## General\n\n" +
                `<:persona:1538099937391288380> **Usuario de Discord**: \`${member.user.username}\`\n` +
                (
                    robloxProfile
                        ? `<:roblox:1538379754414145536> **Usuario de Roblox**: [${robloxProfile.roblox_username}](${robloxProfile.roblox_profile_url})\n\n`
                        : "<:roblox:1538379754414145536> **Usuario de Roblox**: `No Registrado`\n\n"
                ) +
                `<:rango:1538381219631464448> **Rango**: \`${getRank(member)}\`\n` +
                `<:espada:1538399737206669312> **Ocupación**: \`${getOccupation(member)}\`\n` +
                `<:squad:1538380150746521651> **Escuadrón**: \`${getSquadron(member)}\`\n` +
                `<:info:1538323825542963270> **Estado**: \`${getStatus(member)}\``
            );
    }
}

function getProfileEmbed(
    member,
    requester,
    category,
    robloxProfile
) {
    const nickname =
        member.nickname ||
        member.user.username;

    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setAuthor({
            name:
                `Solicitado por ${requester.user.username}`,
            iconURL:
                requester.user.displayAvatarURL({
                    size: 128,
                    extension: "png"
                })
        })
        .setTitle(
            `Perfil de ${nickname}`
        )
        .setDescription(
            getCategoryContent(
                category,
                member,
                robloxProfile
            )
        )
        .setFooter({
            text:
                `Información solicitada el ${new Date().toLocaleString(
                    "es-MX",
                    {
                        timeZone:
                            "America/Mexico_City",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )`
        });
}

function getCategoryMenu(
    selectedCategory
) {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    "perfil_category"
                )
                .setPlaceholder(
                    selectedCategory
                )
                .addOptions(
                    CATEGORIES.map(
                        category => ({
                            label:
                                category,
                            value:
                                category,
                            default:
                                category ===
                                selectedCategory
                        })
                    )
                )
        );
}

function getNoProfileMessage() {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "<:info:1538323825542963270> Esta persona no tiene un perfil."
                )
        );
}

function getRobloxNotLinkedMessage() {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "<:info:1538323825542963270> Esta persona necesita vincular una cuenta de Roblox para mostrar su perfil."
                )
        );
}

function getRobloxNotInGroupMessage() {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "<:info:1538323825542963270> Esta persona necesita unirse al grupo de Roblox para mostrar su perfil."
                )
        );
}

async function getTargetMember(
    message,
    args
) {
    const mentionedMember =
        message.mentions.members.first();

    if (
        mentionedMember
    ) {
        return mentionedMember;
    }

    if (
        args[0] &&
        /^\d{17,20}$/.test(
            args[0]
        )
    ) {
        try {
            return await message.guild.members.fetch(
                args[0]
            );
        } catch {
            return null;
        }
    }

    return message.member;
}

async function findRobloxUser(
    username
) {
    const response =
        await fetch(
            "https://users.roblox.com/v1/usernames/users",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        usernames: [
                            username
                        ],
                        excludeBannedUsers:
                            true
                    })
            }
        );

    if (
        !response.ok
    ) {
        throw new Error(
            `Roblox API respondió ${response.status}.`
        );
    }

    const data =
        await response.json();

    const user =
        data.data?.[0];

    if (
        !user
    ) {
        return null;
    }

    return {
        id:
            String(
                user.id
            ),

        username:
            user.name,

        displayName:
            user.displayName,

        profileUrl:
            `https://www.roblox.com/users/${user.id}/profile`
    };
}

function getRobloxLinkEmbed() {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            "<:roblox:1538379754414145536> Vinculación de Roblox"
        )
        .setDescription(
            "Para continuar deberás vincular una cuenta de Roblox válida.\n\n" +
            "Tu cuenta de Roblox quedará vinculada a tu cuenta de Discord."
        );
}

function getRobloxLinkButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "perfil_roblox_link"
                )
                .setEmoji(
                    "<:txt:1539307435372585111>"
                )
                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    "perfil_roblox_cancel"
                )
                .setEmoji(
                    "<:cancel:1538544866659672144>"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

function getRobloxUsernameModal() {
    return new ModalBuilder()
        .setCustomId(
            "perfil_roblox_username_modal"
        )
        .setTitle(
            "Vincular cuenta de Roblox"
        )
        .addComponents(
            new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId(
                            "roblox_username"
                        )
                        .setLabel(
                            "Usuario de Roblox"
                        )
                        .setPlaceholder(
                            "Ej. AsquerosamenteRicoo"
                        )
                        .setStyle(
                            TextInputStyle.Short
                        )
                        .setRequired(
                            true
                        )
                        .setMinLength(
                            3
                        )
                        .setMaxLength(
                            20
                        )
                )
        );
}

function getRobloxVerificationEmbed(
    robloxUser
) {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            "<:roblox:1538379754414145536> Verificar Cuenta"
        )
        .setDescription(
            `Cuenta encontrada: [${robloxUser.username}](${robloxUser.profileUrl})\n\n` +
            "Presiona el botón para confirmar que eres el propietario de esta cuenta mediante Roblox OAuth."
        );
}

function getRobloxVerificationButtons(
    authorizationUrl
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel(
                    "Verificar"
                )
                .setStyle(
                    ButtonStyle.Link
                )
                .setURL(
                    authorizationUrl
                ),

            new ButtonBuilder()
                .setCustomId(
                    "perfil_roblox_cancel"
                )
                .setEmoji(
                    "<:cancel:1538544866659672144>"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

function createRobloxLinkCollector(
    profileMessage,
    requester
) {
    const collector =
        profileMessage.createMessageComponentCollector();

    const profileTimeout =
        createProfileTimeout(
            collector
        );

    profileTimeout.reset();

    collector.on(
        "collect",
        async interaction => {
            if (
                interaction.user.id !==
                requester.user.id
            ) {
                await interaction.reply({
                    content:
                        "No es tu interacción.",
                    ephemeral:
                        true
                });

                return;
            }

            profileTimeout.reset();

            if (
                interaction.customId ===
                "perfil_roblox_cancel"
            ) {
                await interaction.message
                    .delete()
                    .catch(() => {});

                collector.stop(
                    "cancelled"
                );

                return;
            }

            if (
                interaction.customId ===
                "perfil_roblox_link"
            ) {
                try {
                    await interaction.showModal(
                        getRobloxUsernameModal()
                    );

                    const modalInteraction =
                        await interaction.awaitModalSubmit({
                            time:
                                PROFILE_UI_TIMEOUT,

                            filter:
                                submitted =>
                                    submitted.user.id ===
                                        requester.user.id &&
                                    submitted.customId ===
                                        "perfil_roblox_username_modal"
                        });

                    profileTimeout.reset();

                    const username =
                        modalInteraction.fields
                            .getTextInputValue(
                                "roblox_username"
                            )
                            .trim();

                    await modalInteraction.deferUpdate();

                    let robloxUser;

                    try {
                        robloxUser =
                            await findRobloxUser(
                                username
                            );
                    } catch (error) {
                        logger.error(
                            "[ROBLOX] Error buscando usuario:",
                            error
                        );

                        profileTimeout.reset();

                        await profileMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(
                                        EMBED_COLOR
                                    )
                                    .setTitle(
                                        "Error"
                                    )
                                    .setDescription(
                                        "No se pudo consultar Roblox en este momento. Inténtalo nuevamente."
                                    )
                            ],
                            components: [
                                getRobloxLinkButton()
                            ]
                        });

                        return;
                    }

                    if (
                        !robloxUser
                    ) {
                        profileTimeout.reset();

                        await profileMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(
                                        EMBED_COLOR
                                    )
                                    .setTitle(
                                        "Cuenta no encontrada"
                                    )
                                    .setDescription(
                                        `No encontramos una cuenta de Roblox con el usuario \`${username}\`.\n\n` +
                                        "Comprueba que hayas escrito correctamente tu nombre de usuario."
                                    )
                            ],
                            components: [
                                getRobloxLinkButton()
                            ]
                        });

                        return;
                    }

                    const authorizationUrl =
                        createProfileRobloxAuthorization(
                            requester.user.id,
                            robloxUser.id,
                            robloxUser.username,
                            profileMessage.channel.id,
                            profileMessage.id
                        );

                    await profileMessage.edit({
                        embeds: [
                            getRobloxVerificationEmbed(
                                robloxUser
                            )
                        ],
                        components: [
                            getRobloxVerificationButtons(
                                authorizationUrl
                            )
                        ]
                    });

                    profileTimeout.reset();

                    logger.info(
                        `[ROBLOX] Usuario encontrado: ${robloxUser.username} (${robloxUser.id})`
                    );

                } catch (error) {
                    logger.error(
                        "[ROBLOX] Error procesando modal:",
                        error
                    );

                    return;
                }

                return;
            }
        }
    );

    collector.on(
        "end",
        async () => {
            profileTimeout.clear();

            if (
                profileMessage.deleted
            ) {
                return;
            }

            try {
                await profileMessage.edit({
                    components: []
                });
            } catch {
            }
        }
    );
}

function createProfileCollector(
    profileMessage,
    target,
    requester,
    robloxProfile
) {
    let currentCategory =
        "General";

    const collector =
        profileMessage.createMessageComponentCollector();

    const profileTimeout =
        createProfileTimeout(
            collector
        );

    profileTimeout.reset();

    collector.on(
        "collect",
        async interaction => {
            if (
                interaction.customId !==
                "perfil_category"
            ) {
                return;
            }

            if (
                interaction.user.id !==
                requester.user.id
            ) {
                await interaction.reply({
                    content:
                        "No es tu interacción.",
                    ephemeral:
                        true
                });

                return;
            }

            currentCategory =
                interaction.values[0];

            await interaction.update({
                embeds: [
                    getProfileEmbed(
                        target,
                        requester,
                        currentCategory,
                        robloxProfile
                    )
                ],
                components: [
                    getCategoryMenu(
                        currentCategory
                    )
                ]
            });

            profileTimeout.reset();
        }
    );

    collector.on(
        "end",
        async () => {
            profileTimeout.clear();

            try {
                await profileMessage.edit({
                    embeds: [
                        getProfileEmbed(
                            target,
                            requester,
                            currentCategory,
                            robloxProfile
                        )
                    ],
                    components: []
                });
            } catch {
            }
        }
    );
}

function createGroupCollector(
    groupMessage,
    requester
) {
    const collector =
        groupMessage.createMessageComponentCollector();

    const profileTimeout =
        createProfileTimeout(
            collector
        );

    profileTimeout.reset();

    collector.on(
        "collect",
        async interaction => {
            if (
                interaction.user.id !==
                requester.user.id
            ) {
                await interaction.reply({
                    content:
                        "No es tu interacción.",
                    ephemeral:
                        true
                });

                return;
            }

            profileTimeout.reset();

            if (
                interaction.customId ===
                "perfil_roblox_group_cancel"
            ) {
                await interaction.message
                    .delete()
                    .catch(() => {});

                collector.stop(
                    "cancelled"
                );
            }
        }
    );

    collector.on(
        "end",
        async () => {
            profileTimeout.clear();

            try {
                await groupMessage.edit({
                    components: []
                });
            } catch {
            }
        }
    );
}

export default {
    name:
        "perfil",

    permission:
        2,

    async execute(
        message,
        args
    ) {
        const target =
            await getTargetMember(
                message,
                args
            );

        if (
            !target
        ) {
            return;
        }

        const isSelf =
            target.id ===
            message.author.id;

        const robloxProfile =
            await getRobloxProfile(
                target.id
            );

        if (
            !isSelf &&
            !target.roles.cache.has(
                PROFILE_ROLE_ID
            )
        ) {
            await message.reply({
                components: [
                    getNoProfileMessage()
                ],
                flags:
                    MessageFlags.IsComponentsV2
            });

            return;
        }

        if (
            !isSelf &&
            !robloxProfile
        ) {
            await message.reply({
                components: [
                    getRobloxNotLinkedMessage()
                ],
                flags:
                    MessageFlags.IsComponentsV2
            });

            return;
        }

        if (
            !isSelf &&
            robloxProfile
        ) {
            let isInGroup;

            try {
                isInGroup =
                    await isRobloxUserInGroup(
                        robloxProfile.roblox_id
                    );
            } catch (error) {
                logger.error(
                    "[ROBLOX GROUP] Error comprobando membresía del perfil:",
                    error
                );

                await message.reply({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
                                        "<:info:1538323825542963270> No se pudo comprobar la membresía de esta persona en el grupo de Roblox."
                                    )
                            )
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                return;
            }

            if (
                !isInGroup
            ) {
                await message.reply({
                    components: [
                        getRobloxNotInGroupMessage()
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                return;
            }
        }

        if (
            isSelf
        ) {

            if (
                !robloxProfile
            ) {
                const profileMessage =
                    await message.reply({
                        embeds: [
                            getRobloxLinkEmbed()
                        ],
                        components: [
                            getRobloxLinkButton()
                        ]
                    });

                createRobloxLinkCollector(
                    profileMessage,
                    message.member
                );

                return;
            }

            let isInGroup;

            try {
                isInGroup =
                    await isRobloxUserInGroup(
                        robloxProfile.roblox_id
                    );
            } catch (error) {
                logger.error(
                    "[ROBLOX GROUP] Error comprobando membresía:",
                    error
                );

                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                "#ff4d4d"
                            )
                            .setDescription(
                                "No se pudo comprobar tu membresía en el grupo de Roblox. Inténtalo nuevamente en unos momentos."
                            )
                    ]
                });

                return;
            }

            if (
                !isInGroup
            ) {
                const groupMessage =
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    EMBED_COLOR
                                )
                                .setTitle(
                                    "<:roblox:1538379754414145536> Solicitud al grupo de Roblox"
                                )
                                .setDescription(
                                    "Tu cuenta de Roblox está vinculada correctamente.\n\n" +
                                    "Para continuar, debes unirte al grupo oficial de DEVGRU en Roblox."
                                )
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel(
                                            "Unirse"
                                        )
                                        .setStyle(
                                            ButtonStyle.Link
                                        )
                                        .setURL(
                                            "https://www.roblox.com/communities/34479953/DEVGRU-Seal-Team-Six#!/about"
                                        ),

                                    new ButtonBuilder()
                                        .setCustomId(
                                            "perfil_roblox_group_cancel"
                                        )
                                        .setEmoji(
                                            "<:cancel:1538544866659672144>"
                                        )
                                        .setStyle(
                                            ButtonStyle.Danger
                                        )
                                )
                        ]
                    });

                createGroupCollector(
                    groupMessage,
                    message.member
                );

                return;
            }
        }

        const profileMessage =
            await message.reply({
                embeds: [
                    getProfileEmbed(
                        target,
                        message.member,
                        "General",
                        robloxProfile
                    )
                ],
                components: [
                    getCategoryMenu(
                        "General"
                    )
                ]
            });

        createProfileCollector(
            profileMessage,
            target,
            message.member,
            robloxProfile
        );
    }
};