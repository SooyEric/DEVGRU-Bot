import { EmbedBuilder } from "discord.js";

const RANKS = [
    {
        id: "1373365831454556312",
        short: "SOE1",
        name: "Seaman Recruit (SOE1)"
    },
    {
        id: "1373365830359847036",
        short: "SOE2",
        name: "Seaman Apprentice (SOE2)"
    },
    {
        id: "1373365829860593735",
        short: "SOE3",
        name: "Seaman (SOE3)"
    },
    {
        id: "1373365828388655196",
        short: "SOE4",
        name: "Petty Officer Third Class (SOE4)"
    },
    {
        id: "1373365827239280751",
        short: "SOE5",
        name: "Petty Officer Second Class (SOE5)"
    },
    {
        id: "1373365815524724966",
        short: "SOE6",
        name: "Petty Officer First Class (SOE6)"
    },
    {
        id: "1373365824932548679",
        short: "SOE7",
        name: "Chief Petty Officer (SOE7)"
    },
    {
        id: "1373365823841894531",
        short: "SOE8",
        name: "Senior Chief Petty Officer (SOE8)"
    },
    {
        id: "1373365822281748637",
        short: "SOE9",
        name: "Master Chief Petty Officer (SOE9)"
    },
    {
        id: "1373365821543284796",
        short: "SO1",
        name: "Ensign (SO1)"
    },
    {
        id: "1373365820217884815",
        short: "SO2",
        name: "Lieutenant Junior Grade (SO2)"
    },
    {
        id: "1373365819383480370",
        short: "SO3",
        name: "Lieutenant (SO3)"
    },
    {
        id: "1373365818112348235",
        short: "SO4",
        name: "Lieutenant Commander (SO4)"
    },
    {
        id: "1373365817386860729",
        short: "SO5",
        name: "Commander (SO5)"
    },
    {
        id: "1373365816539480267",
        short: "SO6",
        name: "Captain (SO6)"
    }
];

const OBTAINABLE_RANKS = RANKS.slice(0, 6);

const LOG_CHANNEL_ID = "1525393053656027136";

export default {
    name: "rangos",
    permission: 1,

    async execute(message, args) {
        const firstArg = args[0];
        const secondArg = args[1];

        if (!firstArg) {
            await message.react("❌");
            return;
        }

        let member;
        let targetRank = null;

        const rankInput = firstArg.toUpperCase();

        targetRank = OBTAINABLE_RANKS.find(
            rank => rank.short === rankInput
        );

        if (targetRank) {
            if (!secondArg) {
                await message.react("❌");
                return;
            }

            member = message.mentions.members.first();

            if (!member) {
                const userId = secondArg.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                try {
                    member = await message.guild.members.fetch(userId);
                } catch {
                    await message.react("❌");
                    return;
                }
            }
        } else {
            member = message.mentions.members.first();

            if (!member) {
                const userId = firstArg.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                try {
                    member = await message.guild.members.fetch(userId);
                } catch {
                    await message.react("❌");
                    return;
                }
            }
        }

        if (!member) {
            await message.react("❌");
            return;
        }

        try {
            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });

            const currentRankIndex = OBTAINABLE_RANKS.findIndex(rank =>
                member.roles.cache.has(rank.id)
            );

            if (currentRankIndex === -1) {
                await message.react("❌");
                return;
            }

            let newRankIndex;

            if (targetRank) {
                newRankIndex = OBTAINABLE_RANKS.findIndex(
                    rank => rank.id === targetRank.id
                );

                if (newRankIndex === currentRankIndex) {
                    await message.react("❌");
                    return;
                }
            } else {
                newRankIndex = currentRankIndex + 1;

                if (newRankIndex >= OBTAINABLE_RANKS.length) {
                    await message.react("❌");
                    return;
                }
            }

            const newRank = OBTAINABLE_RANKS[newRankIndex];
            const currentRank = OBTAINABLE_RANKS[currentRankIndex];

            let newNickname = member.nickname;

            if (newNickname) {
                const parts = newNickname.trim().split(/\s+/);

                if (parts.length > 0) {
                    parts[0] = newRank.short;
                    newNickname = parts.join(" ");
                }
            } else {
                newNickname = newRank.short;
            }

            await member.roles.remove(currentRank.id);
            await member.roles.add(newRank.id);
            await member.setNickname(newNickname);

            const logChannel =
                await message.guild.channels.fetch(LOG_CHANNEL_ID);

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#ffaf1a")
                    .setDescription(
                        `El usuario ${member} fue ${
                            newRankIndex > currentRankIndex
                                ? "ascendido"
                                : "descendido"
                        } a **${newRank.name}** por ${message.author}.`
                    );

                await logChannel.send({
                    embeds: [embed]
                });
            }

            await message.react("✅");

        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};