import {
    EmbedBuilder
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

function getRobloxDisplay() {
    return "No Registrado";
}

function getProfileEmbed(
    member,
    requester
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
            `<:persona:1538099937391288380> **Usuario de Discord**: \`${member.user.username}\`\n` +
            `<:roblox:1538379754414145536> **Usuario de Roblox**: ${getRobloxDisplay()}\n\n` +
            `<:rango:1538381219631464448> **Rango**: \`${getRank(member)}\`\n` +
            `<:espada:1538399737206669312> **Ocupación**: \`${getOccupation(member)}\`\n` +
            `<:squad:1538380150746521651> **Escuadrón**: \`${getSquadron(member)}\``
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

        await message.reply({
            embeds: [
                getProfileEmbed(
                    target,
                    message.member
                )
            ]
        });
    }
};