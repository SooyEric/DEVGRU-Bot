import { EmbedBuilder } from "discord.js";

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

const MAX_RANK_INDEX = 14;

const RANK_LOG_CHANNEL_ID = "1525393053656027136";

export default {
    name: "rango",
    permission: 1,

    async execute(message, args) {
        if (!args[0]) {
            await message.react("❌");
            return;
        }

        let requestedRank = null;
        let targetInput = null;

        const rankIndex = RANKS.findIndex(
            rank => rank.short.toLowerCase() === args[0].toLowerCase()
        );

        if (rankIndex !== -1) {
            requestedRank = RANKS[rankIndex];
            targetInput = args[1];
        } else {
            targetInput = args[0];
        }

        if (!targetInput) {
            await message.react("❌");
            return;
        }

        let member;

        try {
            member = message.mentions.members.first();

            if (!member) {
                const userId = targetInput.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                member = await message.guild.members.fetch(userId);
            }

            if (!member) {
                await message.react("❌");
                return;
            }

            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });

        } catch {
            await message.react("❌");
            return;
        }

        try {
            const currentRankIndex = RANKS.findIndex(rank =>
                member.roles.cache.has(rank.id)
            );

            if (currentRankIndex === -1) {
                await message.react("❌");
                return;
            }

            let newRankIndex;

            if (requestedRank) {
                newRankIndex = RANKS.findIndex(
                    rank => rank.id === requestedRank.id
                );
            } else {
                newRankIndex = currentRankIndex + 1;
            }

            if (
                newRankIndex < 0 ||
                newRankIndex > MAX_RANK_INDEX ||
                newRankIndex === currentRankIndex
            ) {
                await message.react("❌");
                return;
            }

            const currentRank = RANKS[currentRankIndex];
            const newRank = RANKS[newRankIndex];

            let newNickname = member.nickname;

            if (newNickname) {
                const parts = newNickname.split(" ");

                parts[0] = newRank.short;

                newNickname = parts.join(" ");
            } else {
                newNickname = newRank.short;
            }

            await member.roles.remove(currentRank.id);
            await member.roles.add(newRank.id);
            await member.setNickname(newNickname);

            const action = newRankIndex > currentRankIndex
                ? "ascendido"
                : "descendido";

            const logChannel = await message.guild.channels.fetch(
                RANK_LOG_CHANNEL_ID
            );

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#ffaf1a")
                    .setDescription(
                        `El usuario ${member} fue **${action}** a **${newRank.name} (${newRank.short})** por ${message.author}.`
                    );

                await logChannel.send({
                    embeds: [embed]
                });
            }

            await message.react("✅");

        } catch (error) {
            console.error("Error en comando rango:", error);
            await message.react("❌");
        }
    }
};