import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";

const EMBED_COLOR =
    "#ffaf1a";

const PROFILE_ROLE_ID =
    "1373365866657222819";

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

const CATEGORIES = [
    "General",
    "Servicio",
    "Actividad",
    "Ascensos",
    "Pagas"
];

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
                "<:rango:1538381219631464448> **Próximo Ascenso**: `Elegible el 00/00/00`\n"
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
                "<:rango:1538381219631464448> **Siguiente Rango**: `Seaman Recruit (SOE2)`\n\n" +
                "<:time:1538102015241224192> **Horas Semanales**: `0/5h`\n" +
                "<:web:1538416206376206408> **Misiones Semanales**: `0/4`\n" +
                "<:web2:1538416317844160583> **Entrenamientos Semanales**: `0/1`\n" +
                "<:lock:1538413056290197514> **Elegible**: `No`"
            );

        case "Pagas":
            return (
                "## Pagas\n\n" +
                "<:lvl:1538099654149935176> **Pago de Rango**: `R$ 0/h`\n" +
                "<:gift:1538322136371044422> **Bonificaciones**: `R$ 0`\n" +
                "<:robux:1538413836405837855> **Total Semanal**: `R$ 0`\n\n" +
                "<:time:1538102015241224192> **Horas Semanales**: `0/5h`\n" +
                "<:web:1538416206376206408> **Misiones Semanales**: `0/4`\n" +
                "<:web2:1538416317844160583> **Entrenamientos Semanales**: `0/1`\n" +
                "<:lock:1538413056290197514> **Elegible**: `No`"
            );

        default:
            return (
                "## General\n\n" +
                `<:persona:1538099937391288380> **Usuario de Discord**: \`${member.user.username}\`\n` +
                "<:roblox:1538379754414145536> **Usuario de Roblox**: `No Registrado`\n\n" +
                `<:rango:1538381219631464448> **Rango**: \`${getRank(member)}\`\n` +
                `<:espada:1538399737206669312> **Ocupación**: \`${getOccupation(member)}\`\n` +
                `<:squad:1538380150746521651> **Escuadrón**: \`${getSquadron(member)}\``
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

    if (mentionedMember) {
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

        if (!target) {
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