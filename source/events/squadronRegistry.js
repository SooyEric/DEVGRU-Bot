import {
    SQUADRONS,
    getSquadron,
    getPlate,
    getPosition,
    buildTable
} from "../utils/squadronRegistry.js";

const AUTO_PLATES = [
    13, 14, 15, 16, 17, 18, 19,
    23, 24, 25, 26, 27, 28, 29
];

const updating = new Set();

async function getGuildMembers(guild) {
    await guild.members.fetch();
    return [...guild.members.cache.values()];
}

async function assignPlate(member) {
    const squadronResult = getSquadron(member);

    if (!squadronResult) return false;

    const [squadronKey] = squadronResult;

    if (!member.roles.cache.has("1373365840677703865")) {
        return false;
    }

    const currentPlate = getPlate(member);

    if (AUTO_PLATES.includes(currentPlate)) {
        return false;
    }

    const members = await getGuildMembers(member.guild);

    const usedPlates = new Set();

    for (const other of members) {
        if (other.id === member.id) continue;

        const otherSquadron = getSquadron(other);

        if (!otherSquadron || otherSquadron[0] !== squadronKey) {
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

    const nickname = member.nickname || member.user.username;

    const newNickname = /\d{2}$/.test(nickname)
        ? nickname.replace(/\d{2}$/, String(availablePlate).padStart(2, "0"))
        : `${nickname} ${String(availablePlate).padStart(2, "0")}`;

    await member.setNickname(newNickname);

    return true;
}

async function updateSquadron(guild, squadronKey) {
    const squadron = SQUADRONS[squadronKey];

    if (!squadron) return;

    const channel = await guild.channels.fetch(
        squadron.channel
    );

    if (!channel) return;

    const members = await getGuildMembers(guild);
    const embed = buildTable(members, squadronKey);

    let message = null;

    try {
        const messages = await channel.messages.fetch({
            limit: 100
        });

        message = messages.find(
            msg =>
                msg.author.id === guild.client.user.id &&
                msg.embeds[0]?.description?.startsWith(
                    `# ${squadron.name}`
                )
        );
    } catch {
    }

    if (!message) {
        message = await channel.send({
            embeds: [embed]
        });

        await message.pin().catch(() => {});
    } else {
        await message.edit({
            embeds: [embed]
        });
    }
}

async function updateAllSquadrons(guild) {
    for (const squadronKey of Object.keys(SQUADRONS)) {
        await updateSquadron(guild, squadronKey);
    }
}

async function handleMemberUpdate(member) {
    if (updating.has(member.id)) return;

    updating.add(member.id);

    try {
        const oldSquadron = getSquadron(member);

        if (
            member.roles.cache.has("1373365840677703865") &&
            !getPlate(member)
        ) {
            await assignPlate(member);
        }

        const newSquadron = getSquadron(member);

        const affectedSquadrons = new Set();

        if (oldSquadron) {
            affectedSquadrons.add(oldSquadron[0]);
        }

        if (newSquadron) {
            affectedSquadrons.add(newSquadron[0]);
        }

        for (const squadronKey of affectedSquadrons) {
            await updateSquadron(
                member.guild,
                squadronKey
            );
        }
    } finally {
        updating.delete(member.id);
    }
}

export default {
    name: "squadronRegistry",

    register(client) {
        client.on("guildMemberAdd", async member => {
            try {
                await assignPlate(member);

                const squadron = getSquadron(member);

                if (squadron) {
                    await updateSquadron(
                        member.guild,
                        squadron[0]
                    );
                }
            } catch (error) {
                console.error(
                    "Error registering new member:",
                    error
                );
            }
        });

        client.on("guildMemberRemove", async member => {
            try {
                await updateAllSquadrons(member.guild);
            } catch (error) {
                console.error(
                    "Error updating squadron after member removal:",
                    error
                );
            }
        });

        client.on(
            "guildMemberUpdate",
            async (oldMember, newMember) => {
                try {
                    await handleMemberUpdate(newMember);
                } catch (error) {
                    console.error(
                        "Error updating squadron registry:",
                        error
                    );
                }
            }
        );
    }
};