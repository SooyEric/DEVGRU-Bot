import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    AuditLogEvent
} from "discord.js";

const EMBED_COLOR =
    "#ffaf1a";

const PROFILE_ROLE_ID =
    "1373365866657222819";

const INACTIVE_ROLE_ID =
    "1538434883045818378";

const RANK_LOG_CHANNEL_ID =
    "1525393053656027136";

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
        short: "SO10",
        pay: 0
    },
    {
        id: "1373365812383187047",
        name: "Vice Admiral",
        short: "SO9",
        pay: 0
    },
    {
        id: "1373365813490483313",
        name: "Rear Admiral Upper Half",
        short: "SO8",
        pay: 0
    },
    {
        id: "1373365814341799958",
        name: "Rear Admiral Lower Half",
        short: "SO7",
        pay: 0
    },
    {
        id: "1373365815524724966",
        name: "Captain",
        short: "SO6",
        pay: 70
    },
    {
        id: "1373365816539480267",
        name: "Commander",
        short: "SO5",
        pay: 65
    },
    {
        id: "1373365817386860729",
        name: "Lieutenant Commander",
        short: "SO4",
        pay: 65
    },
    {
        id: "1373365818112348235",
        name: "Lieutenant",
        short: "SO3",
        pay: 60
    },
    {
        id: "1373365819383480370",
        name: "Lieutenant Junior Grade",
        short: "SO2",
        pay: 60
    },
    {
        id: "1373365820217884815",
        name: "Ensign",
        short: "SO1",
        pay: 55
    },
    {
        id: "1373365821543284796",
        name: "Master Chief Petty Officer",
        short: "SOE9",
        pay: 55
    },
    {
        id: "1373365822281748637",
        name: "Senior Chief Petty Officer",
        short: "SOE8",
        pay: 50
    },
    {
        id: "1373365823841894531",
        name: "Chief Petty Officer",
        short: "SOE7",
        pay: 50
    },
    {
        id: "1373365824932548679",
        name: "Petty Officer First Class",
        short: "SOE6",
        pay: 45
    },
    {
        id: "1373365827239280751",
        name: "Petty Officer Second Class",
        short: "SOE5",
        pay: 45
    },
    {
        id: "1373365828388655196",
        name: "Petty Officer Third Class",
        short: "SOE4",
        pay: 40
    },
    {
        id: "1373365829860593735",
        name: "Seaman",
        short: "SOE3",
        pay: 40
    },
    {
        id: "1373365830359847036",
        name: "Seaman Apprentice",
        short: "SOE2",
        pay: 0
    },
    {
        id: "1373365831454556312",
        name: "Seaman Recruit",
        short: "SOE1",
        pay: 0
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

function getRankData(member) {
    for (const rank of RANKS) {
        if (
            member.roles.cache.has(
                rank.id
            )
        ) {
            return rank;
        }
    }

    return null;
}

function getRank(member) {
    const rank =
        getRankData(member);

    if (!rank) {
        return "Sin rango";
    }

    return `${rank.name} (${rank.short})`;
}

function getNextRank(member) {
    const currentIndex =
        RANKS.findIndex(
            rank =>
                member.roles.cache.has(
                    rank.id
                )
        );

    if (
        currentIndex === -1 ||
        currentIndex === 0
    ) {
        return "Ninguno";
    }

    const nextRank =
        RANKS[currentIndex - 1];

    return `${nextRank.name} (${nextRank.short})`;
}

function getPaymentRestriction(member) {
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

function getOccupation(member) {
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

function requiresActivityStart(member) {
    return ACTIVITY_START_ROLES.some(
        roleId =>
            member.roles.cache.has(
                roleId
            )
    );
}

function getSquadron(member) {
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

function getStatus(member) {
    if (
        member.roles.cache.has(
            INACTIVE_ROLE_ID
        )
    ) {
        return "Inactivo";
    }

    return "Activo";
}

function formatDate(date) {
    if (!date) {
        return "00/00/00";
    }

    return new Intl.DateTimeFormat(
        "es-MX",
        {
            timeZone:
                "America/Mexico_City",
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
        }
    ).format(date);
}

function formatServiceTime(date) {
    if (!date) {
        return "0 días";
    }

    const now =
        new Date();

    let years =
        now.getFullYear() -
        date.getFullYear();

    let months =
        now.getMonth() -
        date.getMonth();

    let days =
        now.getDate() -
        date.getDate();

    if (days < 0) {
        months--;

        const previousMonth =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                0
            );

        days +=
            previousMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];

    if (years > 0) {
        parts.push(
            `${years} ${years === 1 ? "año" : "años"}`
        );
    }

    if (months > 0) {
        parts.push(
            `${months} ${months === 1 ? "mes" : "meses"}`
        );
    }

    if (days > 0) {
        parts.push(
            `${days} ${days === 1 ? "día" : "días"}`
        );
    }

    if (parts.length === 0) {
        return "0 días";
    }

    return parts.join(", ");
}

async function getProfileJoinDate(
    guild,
    member
) {
    try {
        const logs =
            await guild.fetchAuditLogs({
                type:
                    AuditLogEvent.MemberRoleUpdate,
                limit: 100
            });

        const entries =
            logs.entries
                .filter(
                    entry =>
                        entry.target?.id ===
                            member.id &&
                        entry.changes?.some(
                            change =>
                                change.key ===
                                    "$add" &&
                                Array.isArray(
                                    change.new
                                ) &&
                                change.new.some(
                                    role =>
                                        role.id ===
                                        PROFILE_ROLE_ID
                                )
                        )
                )
                .sort(
                    (a, b) =>
                        b.createdTimestamp -
                        a.createdTimestamp
                );

        if (
            entries.size === 0
        ) {
            return null;
        }

        return entries.first()
            .createdAt;

    } catch (error) {
        console.error(
            "Error obteniendo fecha de ingreso:",
            error
        );

        return null;
    }
}

async function getLastPromotionDate(
    guild,
    member
) {
    try {
        const channel =
            await guild.channels.fetch(
                RANK_LOG_CHANNEL_ID
            );

        if (
            !channel ||
            !channel.isTextBased()
        ) {
            return null;
        }

        let before;
        let checked = 0;

        while (
            checked < 1000
        ) {
            const options = {
                limit: 100
            };

            if (before) {
                options.before =
                    before;
            }

            const messages =
                await channel.messages.fetch(
                    options
                );

            if (
                messages.size === 0
            ) {
                break;
            }

            const ordered =
                [...messages.values()]
                    .sort(
                        (a, b) =>
                            b.createdTimestamp -
                            a.createdTimestamp
                    );

            for (
                const message of ordered
            ) {
                const mentions =
                    message.mentions.users;

                const firstMention =
                    mentions.first();

                if (
                    firstMention &&
                    firstMention.id ===
                        member.id
                ) {
                    return message.createdAt;
                }
            }

            checked +=
                messages.size;

            before =
                messages.last().id;

            if (
                messages.size < 100
            ) {
                break;
            }
        }

        return null;

    } catch (error) {
        console.error(
            "Error obteniendo último ascenso:",
            error
        );

        return null;
    }
}

function addDays(
    date,
    days
) {
    if (!date) {
        return null;
    }

    const result =
        new Date(date);

    result.setDate(
        result.getDate() + days
    );

    return result;
}

function getPayment(
    member
) {
    const rank =
        getRankData(member);

    if (!rank) {
        return 0;
    }

    return rank.pay;
}

async function getProfileData(
    member
) {
    const [
        joinDate,
        lastPromotionDate
    ] = await Promise.all([
        getProfileJoinDate(
            member.guild,
            member
        ),
        getLastPromotionDate(
            member.guild,
            member
        )
    ]);

    return {
        joinDate,
        serviceTime:
            formatServiceTime(
                joinDate
            ),
        lastPromotionDate,
        nextPromotionDate:
            addDays(
                lastPromotionDate,
                7
            ),
        payment:
            getPayment(member),
        nextRank:
            getNextRank(member),
        status:
            getStatus(member)
    };
}

function getCategoryContent(
    category,
    member,
    data
) {
    switch (category) {

        case "Servicio":
            return (
                "## Servicio\n\n" +
                `<:fecha:1538412361965375528> **Fecha de Ingreso**: \`${formatDate(data.joinDate)}\`\n` +
                `<:tiempo:1538308636265160714> **Tiempo de Servicio**: \`${data.serviceTime}\`\n` +
                `<:espada:1538399737206669312> **Ultimo Ascenso**: \`${formatDate(data.lastPromotionDate)}\`\n` +
                `<:rango:1538381219631464448> **Próximo Ascenso**: \`${data.nextPromotionDate ? `Elegible el ${formatDate(data.nextPromotionDate)}` : "Pendiente"}\`\n`
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
                `<:rango:1538381219631464448> **Siguiente Rango**: \`${data.nextRank}\`\n\n` +
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
                `<:lvl:1538099654149935176> **Pago de Rango**: \`R$ ${data.payment}/h\`\n` +
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
                `<:info:1538323825542963270> **Estado**: \`${data.status}\``
            );
    }
}

function getProfileEmbed(
    member,
    requester,
    category,
    data
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
                data
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

function createProfileCollector(
    profileMessage,
    target,
    requester,
    data
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
                        currentCategory,
                        data
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
                            currentCategory,
                            data
                        )
                    ],
                    components: []
                });
            } catch {
                // El mensaje ya no existe.
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
        try {
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

            const data =
                await getProfileData(
                    target
                );

            const profileMessage =
                await message.reply({
                    embeds: [
                        getProfileEmbed(
                            target,
                            message.member,
                            "General",
                            data
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
                data
            );

        } catch (error) {
            console.error(
                "Error en comando perfil:",
                error
            );

            await message.react(
                "❌"
            );
        }
    }
};