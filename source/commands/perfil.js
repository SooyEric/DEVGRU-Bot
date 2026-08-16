import {
    EmbedBuilder
} from "discord.js";

const EMBED_COLOR =
    "#ffaf1a";

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
        id: "1373365831454556312",
        name: "Seaman Recruit",
        short: "SOE1"
    },
    {
        id: "1373365830359847036",
        name: "Seaman Apprentice",
        short: "SOE2"
    },
    {
        id: "1373365829860593735",
        name: "Seaman",
        short: "SOE3"
    },
    {
        id: "1373365828388655196",
        name: "Petty Officer Third Class",
        short: "SOE4"
    },
    {
        id: "1373365827239280751",
        name: "Petty Officer Second Class",
        short: "SOE5"
    },
    {
        id: "1373365824932548679",
        name: "Petty Officer First Class",
        short: "SOE6"
    },
    {
        id: "1373365823841894531",
        name: "Chief Petty Officer",
        short: "SOE7"
    },
    {
        id: "1373365822281748637",
        name: "Senior Chief Petty Officer",
        short: "SOE8"
    },
    {
        id: "1373365821543284796",
        name: "Master Chief Petty Officer",
        short: "SOE9"
    },
    {
        id: "1373365820217884815",
        name: "Ensign",
        short: "SO1"
    },
    {
        id: "1373365819383480370",
        name: "Lieutenant Junior Grade",
        short: "SO2"
    },
    {
        id: "1373365818112348235",
        name: "Lieutenant",
        short: "SO3"
    },
    {
        id: "1373365817386860729",
        name: "Lieutenant Commander",
        short: "SO4"
    },
    {
        id: "1373365816539480267",
        name: "Commander",
        short: "SO5"
    },
    {
        id: "1373365815524724966",
        name: "Captain",
        short: "SO6"
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
            return rank.short;
        }
    }

    return "Sin rango";
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

function getProfileEmbed(
    member
) {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            `Perfil de @${member.user.username}`
        )
        .setThumbnail(
            member.user.displayAvatarURL({
                size: 256,
                extension: "png"
            })
        )
        .setDescription(
            `<:persona:1538099937391288380> **Usuario de Discord**: \`${member.user.username}\`\n\n` +
            `<:rango:1538381219631464448> **Rango**: \`${getRank(member)}\`\n` +
            `<:squad:1538380150746521651> **Escuadrón**: \`${getSquadron(member)}\``
        )
        .setFooter({
            text:
                `Información solicitada • ${new Date().toLocaleString(
                    "es-MX",
                    {
                        dateStyle: "short",
                        timeStyle: "short"
                    }
                )}`
        });
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

        await message.reply({
            embeds: [
                getProfileEmbed(
                    target
                )
            ]
        });
    }
};