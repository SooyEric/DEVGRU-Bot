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

const MAX_RANK_INDEX = 5;

const RANK_LOG_CHANNEL_ID = "1525393053656027136";

export default {
    name: "rango",
    permission: 1,

    async execute(message, args) {
        if (!args.length) {
            await message.react("❌");
            return;
        }

        let targetInput;
        let requestedRank = null;

        if (RANKS.some(rank => rank.short.toLowerCase() === args[0].toLowerCase())) {
            requestedRank = args[0].toUpperCase();
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
                    rank => rank.short.toLowerCase() === requestedRank.toLowerCase()
                );

                if (newRankIndex === -1) {
                    await message.react("❌");
                    return;
                }
            } else {
                newRankIndex = currentRankIndex + 1;
            }

            if (newRankIndex > MAX_RANK_INDEX) {
                await message.react("❌");
                return;
            }

            if (newRankIndex === currentRankIndex) {
                await message.react("❌");
                return;
            }

            const currentRank = RANKS[currentRankIndex];
            const newRank = RANKS[newRankIndex];

            const nickname = member.nickname;

            let newNickname;

            if (nickname) {
                const nicknameParts = nickname.split(" ");

                nicknameParts[0] = newRank.short;

                newNickname = nicknameParts.join(" ");
            } else {
                newNickname = newRank.short;
            }

            await member.roles.remove(currentRank.id);
            await member.roles.add(newRank.id);
            await member.setNickname(newNickname);

            const channel = await message.guild.channels.fetch(
                RANK_LOG_CHANNEL_ID
            );

            if (channel) {
                const embed = new EmbedBuilder()
                    .setColor("#ffaf1a")
                    .setDescription(
                        `El usuario ${member} fue ascendido a **${newRank.name} (${newRank.short})** por ${message.author}.`
                    );

                await channel.send({
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