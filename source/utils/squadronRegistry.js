import {
    EmbedBuilder
} from "discord.js";

const EMBED_COLOR = "#ffaf1a";

const SQUADRONS = {
    red: {
        name: "Red Squadron",
        group: "Alpha",
        emoji: "<:red:1527450543692320869>",
        role: "1373365857928876243",
        channel: "1373366015576117459"
    },

    blue: {
        name: "Blue Squadron",
        group: "Bravo",
        emoji: "<:blue:1527449963758358608>",
        role: "1373365858784514241",
        channel: "1373366016754847816"
    },

    gold: {
        name: "Gold Squadron",
        group: "Charlie",
        emoji: "<:gold:1527451395848933626>",
        role: "1373365859640279124",
        channel: "1530329743465906338"
    },

    black: {
        name: "Black Squadron",
        group: "Delta",
        emoji: "<:black:1527452013812650054>",
        role: "1420221604020879463",
        channel: "1420443595659280498"
    },

    silver: {
        name: "Silver Squadron",
        group: "Echo",
        emoji: "<:silver:1535722714260578344>",
        role: "1535716558322540594",
        channel: "1535718026618478623"
    }
};

const POSITIONS = {
    SQUADRON_COMMANDER: "1373365833618690059",
    SQUADRON_DEPUTY_COMMANDER: "1373365835862642713",
    EXECUTIVE_OFFICER: "1373365837129318474",
    GROUP_COMMANDER: "1373365839037988894",
    SQUAD_LEADER: "1373365839721529506",
    TEAM_OPERATOR: "1373365840677703865"
};

const AUTO_PLATES = [
    13, 14, 15, 16, 17, 18, 19,
    23, 24, 25, 26, 27, 28, 29
];

const TABLE_MESSAGES = new Map();

function getSquadron(member) {
    return Object.entries(SQUADRONS).find(
        ([, squadron]) =>
            member.roles.cache.has(squadron.role)
    );
}

function getPlate(member) {
    if (!member.nickname) return null;

    const match = member.nickname.match(/(\d{2})$/);

    if (!match) return null;

    return Number(match[1]);
}

function hasRole(member, roleId) {
    return member.roles.cache.has(roleId);
}

function getPosition(member) {
    if (hasRole(member, POSITIONS.SQUADRON_COMMANDER)) {
        return {
            type: "squadronCommander",
            plate: 0
        };
    }

    if (hasRole(member, POSITIONS.SQUADRON_DEPUTY_COMMANDER)) {
        return {
            type: "deputyCommander",
            plate: 1
        };
    }

    if (hasRole(member, POSITIONS.EXECUTIVE_OFFICER)) {
        return {
            type: "executiveOfficer",
            plate: 2
        };
    }

    const plate = getPlate(member);

    if (hasRole(member, POSITIONS.GROUP_COMMANDER)) {
        if (plate === 10 || plate === 20) {
            return {
                type: "groupCommander",
                plate
            };
        }

        return null;
    }

    if (hasRole(member, POSITIONS.SQUAD_LEADER)) {
        if ([11, 12, 21, 22].includes(plate)) {
            return {
                type: "squadLeader",
                plate
            };
        }

        return null;
    }

    if (hasRole(member, POSITIONS.TEAM_OPERATOR)) {
        if (AUTO_PLATES.includes(plate)) {
            return {
                type: "teamOperator",
                plate
            };
        }

        return null;
    }

    return null;
}

function findMember(members, predicate) {
    return members.find(predicate);
}

function mention(member) {
    return member ? `<@${member.id}>` : "";
}

function findPlateMember(members, plate) {
    return members.find(member => {
        const memberPlate = getPlate(member);

        return memberPlate === plate;
    });
}

function buildTable(memberList, squadron) {
    const members = memberList.filter(member => {
        const result = getSquadron(member);

        return result?.[0] === squadron;
    });

    const getByPosition = (type, plate = null) => {
        return members.find(member => {
            const position = getPosition(member);

            if (!position || position.type !== type) {
                return false;
            }

            if (plate !== null && position.plate !== plate) {
                return false;
            }

            return true;
        });
    };

    const commander = getByPosition("squadronCommander");
    const deputy = getByPosition("deputyCommander");
    const executive = getByPosition("executiveOfficer");

    const group10 = getByPosition("groupCommander", 10);
    const leader11 = getByPosition("squadLeader", 11);
    const leader12 = getByPosition("squadLeader", 12);

    const group20 = getByPosition("groupCommander", 20);
    const leader21 = getByPosition("squadLeader", 21);
    const leader22 = getByPosition("squadLeader", 22);

    const teamOperators = plate => {
        const member = findPlateMember(members, plate);

        if (!member) return "";

        const position = getPosition(member);

        if (!position || position.type !== "teamOperator") {
            return "";
        }

        return mention(member);
    };

    const operatorPlates1 = AUTO_PLATES.filter(
        plate => plate >= 13 && plate <= 19
    );

    const operatorPlates2 = AUTO_PLATES.filter(
        plate => plate >= 23 && plate <= 29
    );

    const operators1 = operatorPlates1
        .map(teamOperators)
        .filter(Boolean);

    const operators2 = operatorPlates2
        .map(teamOperators)
        .filter(Boolean);

    const lines = [
        `# ${squadron.name} ${squadron.emoji}`,
        `<@&${squadron.role}>`,
        "",
        `Squadron Commander (00):`,
        mention(commander),
        "",
        `Squadron Deputy Commander (01):`,
        mention(deputy),
        "",
        `Squadron Executive Officer (02):`,
        mention(executive),
        "",
        "**Unidad 10**",
        `Group Commander (10):`,
        mention(group10),
        "",
        `Squad Leader (11):`,
        mention(leader11),
        "",
        `Squad Leader (12):`,
        mention(leader12),
        "",
        "Team Operator (13/19):",
        ...operators1,
        "",
        "**Unidad 20**",
        `Group Commander (20):`,
        mention(group20),
        "",
        `Squad Leader (21):`,
        mention(leader21),
        "",
        `Squad Leader (22):`,
        mention(leader22),
        "",
        "Team Operator (23/29):",
        ...operators2
    ];

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setDescription(lines.join("\n"))
        .setFooter({
            text: `Última actualización: ${new Date().toLocaleString(
                "es-MX",
                {
                    timeZone: "America/Mexico_City",
                    dateStyle: "short",
                    timeStyle: "short"
                }
            )}`
        });

    return embed;
}

export {
    SQUADRONS,
    POSITIONS,
    AUTO_PLATES,
    getSquadron,
    getPlate,
    getPosition,
    buildTable
};