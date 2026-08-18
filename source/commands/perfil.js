import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

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
    member
) {
    switch (category) {
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
                    requiresActivityStart(member)
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
                    requiresActivityStart(member)
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
                "<:roblox:1538379754414145536> **Usuario de Roblox**: `No Registrado`\n\n" +
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
    category
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
                member
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
                )}`
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

function getNoProfileEmbed() {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setDescription(
            "Esta persona no tiene un perfil."
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
            "Vinculación de Roblox"
        )
        .setDescription(
            "Para continuar, primero debes vincular una cuenta de Roblox válida con tu cuenta de Discord.\n\n" +
            "Tu cuenta de Roblox quedará vinculada permanentemente a este Discord."
        );
}

function getRobloxLinkButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "perfil_roblox_link"
                )
                .setLabel(
                    "Vincular"
                )
                .setStyle(
                    ButtonStyle.Secondary
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
            "Verificar cuenta de Roblox"
        )
        .setDescription(
            "Has indicado la siguiente cuenta de Roblox:\n\n" +
            `**[${robloxUser.username}](${robloxUser.profileUrl})**\n\n` +
            "Presiona **Verificar** para confirmar que eres el propietario de esta cuenta mediante Roblox OAuth."
        );
}

function getRobloxVerificationButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "perfil_roblox_verify"
                )
                .setLabel(
                    "Verificar"
                )
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    "perfil_roblox_cancel"
                )
                .setLabel(
                    "✕"
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
    let selectedRobloxUser =
        null;

    const collector =
        profileMessage.createMessageComponentCollector({
            time:
                5 * 60 * 1000
        });

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

            if (
                interaction.customId ===
                "perfil_roblox_link"
            ) {
                await interaction.showModal(
                    getRobloxUsernameModal()
                );

                try {
                    const modalInteraction =
                        await interaction.awaitModalSubmit({
                            time:
                                60_000,

                            filter:
                                submitted =>
                                    submitted.user.id ===
                                    requester.user.id &&
                                    submitted.customId ===
                                    "perfil_roblox_username_modal"
                        });

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
                    } catch {
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

                    selectedRobloxUser =
                        robloxUser;

                    await profileMessage.edit({
                        embeds: [
                            getRobloxVerificationEmbed(
                                robloxUser
                            )
                        ],
                        components: [
                            getRobloxVerificationButtons()
                        ]
                    });

                } catch {
                    return;
                }

                return;
            }

            if (
                interaction.customId ===
                "perfil_roblox_cancel"
            ) {
                collector.stop(
                    "cancelled"
                );

                await interaction.message.delete()
                    .catch(() => {});

                return;
            }

            if (
                interaction.customId ===
                "perfil_roblox_verify"
            ) {
                if (
                    !selectedRobloxUser
                ) {
                    await interaction.reply({
                        content:
                            "Primero debes seleccionar una cuenta de Roblox.",
                        ephemeral:
                            true
                    });

                    return;
                }

                try {
                    const authorizationUrl =
                        createProfileRobloxAuthorization(
                            requester.user.id,
                            selectedRobloxUser.username,
                            profileMessage.channel.id,
                            profileMessage.id
                        );

                    await interaction.reply({
                        content:
                            "Continúa con Roblox para verificar que eres el propietario de esta cuenta.",
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel(
                                            "Continuar con Roblox"
                                        )
                                        .setStyle(
                                            ButtonStyle.Link
                                        )
                                        .setURL(
                                            authorizationUrl
                                        )
                                )
                        ],
                        ephemeral:
                            true
                    });

                } catch {
                    await interaction.reply({
                        content:
                            "No se pudo iniciar la verificación de Roblox. Inténtalo nuevamente.",
                        ephemeral:
                            true
                    });
                }

                return;
            }
        }
    );

    collector.on(
        "end",
        async () => {
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
    requester
) {
    let currentCategory =
        "General";

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
                    60_000
                );
        };

    const collector =
        profileMessage.createMessageComponentCollector();

    resetInactivityTimer();

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
                        currentCategory
                    )
                ],
                components: [
                    getCategoryMenu(
                        currentCategory
                    )
                ]
            });

            resetInactivityTimer();
        }
    );

    collector.on(
        "end",
        async () => {
            clearTimeout(
                inactivityTimeout
            );

            try {
                await profileMessage.edit({
                    embeds: [
                        getProfileEmbed(
                            target,
                            requester,
                            currentCategory
                        )
                    ],
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

        if (
            !isSelf &&
            !target.roles.cache.has(
                PROFILE_ROLE_ID
            )
        ) {
            await message.reply({
                embeds: [
                    getNoProfileEmbed()
                ]
            });

            return;
        }
        
        if (
    isSelf
) {
    const robloxProfile =
        await getRobloxProfile(
            message.author.id
        );

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
}

        const profileMessage =
            await message.reply({
                embeds: [
                    getProfileEmbed(
                        target,
                        message.member,
                        "General"
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
            message.member
        );
    }
};