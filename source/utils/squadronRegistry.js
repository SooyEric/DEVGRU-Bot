import { EmbedBuilder } from "discord.js";
import { getDatabase } from "../database/postgres.js";

const COLOR = "#ffaf1a";

export const SQUADRONS = {
    red: {
        name: "Red Squadron",
        emoji: "<:red:1527450543692320869>",
        role: "1373365857928876243",
        channel: "1373366015576117459"
    },

    blue: {
        name: "Blue Squadron",
        emoji: "<:blue:1527449963758358608>",
        role: "1373365858784514241",
        channel: "1373366016754847816"
    },

    gold: {
        name: "Gold Squadron",
        emoji: "<:gold:1527451395848933626>",
        role: "1373365859640279124",
        channel: "1530329743465906338"
    },

    black: {
        name: "Black Squadron",
        emoji: "<:black:1527452013812650054>",
        role: "1420221604020879463",
        channel: "1420443595659280498"
    },

    silver: {
        name: "Silver Squadron",
        emoji: "<:silver:1535722714260578344>",
        role: "1535716558322540594",
        channel: "1535718026618478623"
    }
};

export const ROLES = {
    commander: "1373365833618690059",
    deputy: "1373365835862642713",
    executive: "1373365837129318474",
    groupCommander: "1373365839037988894",
    squadLeader: "1373365839721529506",
    operator: "1373365840677703865"
};

const AUTO_PLATES = [
    13, 14, 15, 16, 17, 18, 19,
    23, 24, 25, 26, 27, 28, 29
];

export async function initializeSquadronRegistry() {
    const database = getDatabase();

    if (!database) return;

    await database.query(`
        CREATE TABLE IF NOT EXISTS squadron_registry (
            squadron TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            message_id TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
}

export async function saveSquadronMessage(
    squadron,
    channelId,
    messageId
) {
    const database = getDatabase();

    if (!database) {
        throw new Error("DATABASE_URL is not configured.");
    }

    await database.query(
        `
        INSERT INTO squadron_registry
            (squadron, channel_id, message_id)
        VALUES
            ($1, $2, $3)

        ON CONFLICT (squadron)
        DO UPDATE SET
            channel_id = EXCLUDED.channel_id,
            message_id = EXCLUDED.message_id,
            updated_at = NOW()
        `,
        [squadron, channelId, messageId]
    );
}

export async function getSquadronMessage(squadron) {
    const database = getDatabase();

    if (!database) return null;

    const result = await database.query(
        `
        SELECT *
        FROM squadron_registry
        WHERE squadron = $1
        `,
        [squadron]
    );

    return result.rows[0] || null;
}

export function getSquadron(member) {
    for (const [key, squadron] of Object.entries(SQUADRONS)) {
        if (member.roles.cache.has(squadron.role)) {
            return [key, squadron];
        }
    }

    return null;
}

export function getPlate(member) {
    const nickname = member.nickname;

    if (!nickname) return null;

    const match = nickname.match(/(\d{2})$/);

    if (!match) return null;

    return Number(match[1]);
}

function mention(member) {
    return `<@${member.id}>`;
}

function findMember(members, squadron, roleId) {
    return members.find(
        member =>
            member.roles.cache.has(roleId) &&
            member.roles.cache.has(squadron.role)
    );
}

function findByPlate(members, squadron, roleId, plate) {
    return members.find(
        member =>
            member.roles.cache.has(roleId) &&
            member.roles.cache.has(squadron.role) &&
            getPlate(member) === plate
    );
}

function buildSlot(member) {
    return member ? mention(member) : "";
}

export function buildTable(members, squadronKey) {
    const squadron = SQUADRONS[squadronKey];

    const commander = findMember(
        members,
        squadron,
        ROLES.commander
    );

    const deputy = findMember(
        members,
        squadron,
        ROLES.deputy
    );

    const executive = findMember(
        members,
        squadron,
        ROLES.executive
    );

    const group10 = findByPlate(
        members,
        squadron,
        ROLES.groupCommander,
        10
    );

    const group20 = findByPlate(
        members,
        squadron,
        ROLES.groupCommander,
        20
    );

    const squad11 = findByPlate(
        members,
        squadron,
        ROLES.squadLeader,
        11
    );

    const squad12 = findByPlate(
        members,
        squadron,
        ROLES.squadLeader,
        12
    );

    const squad21 = findByPlate(
        members,
        squadron,
        ROLES.squadLeader,
        21
    );

    const squad22 = findByPlate(
        members,
        squadron,
        ROLES.squadLeader,
        22
    );

    const operators10 = [];

    for (let plate = 13; plate <= 19; plate++) {
        operators10.push(
            findByPlate(
                members,
                squadron,
                ROLES.operator,
                plate
            )
        );
    }

    const operators20 = [];

    for (let plate = 23; plate <= 29; plate++) {
        operators20.push(
            findByPlate(
                members,
                squadron,
                ROLES.operator,
                plate
            )
        );
    }

    const operator10Text = operators10
        .map(member => buildSlot(member))
        .join("\n");

    const operator20Text = operators20
        .map(member => buildSlot(member))
        .join("\n");

    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(
            `${squadron.name} ${squadron.emoji}`
        )
        .setDescription(
            `<@&${squadron.role}>\n\n` +

            `**Squadron Commander (00):**\n` +
            `${buildSlot(commander)}\n\n` +

            `**Squadron Deputy Commander (01):**\n` +
            `${buildSlot(deputy)}\n\n` +

            `**Squadron Executive Officer (02):**\n` +
            `${buildSlot(executive)}\n\n` +

            `**Unidad 10**\n` +

            `**Group Commander (10):**\n` +
            `${buildSlot(group10)}\n\n` +

            `**Squad Leader (11):**\n` +
            `${buildSlot(squad11)}\n\n` +

            `**Squad Leader (12):**\n` +
            `${buildSlot(squad12)}\n\n` +

            `**Team Operator (13/19):**\n` +
            `${operator10Text || ""}\n\n` +

            `**Unidad 20**\n` +

            `**Group Commander (20):**\n` +
            `${buildSlot(group20)}\n\n` +

            `**Squad Leader (21):**\n` +
            `${buildSlot(squad21)}\n\n` +

            `**Squad Leader (22):**\n` +
            `${buildSlot(squad22)}\n\n` +

            `**Team Operator (23/29):**\n` +
            `${operator20Text || ""}`
        )
        .setFooter({
            text: `Última actualización`
        })
        .setTimestamp();
}

export async function assignPlate(member) {
    const squadronResult = getSquadron(member);

    if (!squadronResult) return false;

    const [squadronKey] = squadronResult;

    if (!member.roles.cache.has(ROLES.operator)) {
        return false;
    }

    if (getPlate(member) !== null) {
        return false;
    }

    const members = [
        ...member.guild.members.cache.values()
    ];

    const usedPlates = new Set();

    for (const other of members) {
        if (other.id === member.id) continue;

        const otherSquadron = getSquadron(other);

        if (
            !otherSquadron ||
            otherSquadron[0] !== squadronKey
        ) {
            continue;
        }

        const plate = getPlate(other);

        if (AUTO_PLATES.includes(plate)) {
            usedPlates.add(plate);
        }
    }

    const availablePlate = AUTO_PLATES.find(
        plate => !usedPlates.has(plate)
    );

    if (availablePlate === undefined) {
        return false;
    }

    const plateText = String(
        availablePlate
    ).padStart(2, "0");

    const baseNickname =
        member.nickname ||
        member.user.username;

    const newNickname = /\d{2}$/.test(baseNickname)
        ? baseNickname.replace(
            /\d{2}$/,
            plateText
        )
        : `${baseNickname} ${plateText}`;

    await member.setNickname(newNickname);

    return true;
}

export async function updateSquadronTable(
    guild,
    squadronKey
) {
    const squadron = SQUADRONS[squadronKey];

    if (!squadron) return;

    const registry = await getSquadronMessage(
        squadronKey
    );

    if (!registry) return;

    const channel = await guild.channels.fetch(
        registry.channel_id
    );

    if (!channel) return;

    const message = await channel.messages.fetch(
        registry.message_id
    );

    const members = [
        ...guild.members.cache.values()
    ];

    const embed = buildTable(
        members,
        squadronKey
    );

    await message.edit({
        embeds: [embed]
    });
}