import {
    EmbedBuilder
} from "discord.js";

const EMBED_COLOR =
    "#ffaf1a";

function getNextBadgeTimestamp(
    premiumSinceTimestamp
) {
    if (!premiumSinceTimestamp) {
        return null;
    }

    const start =
        new Date(
            premiumSinceTimestamp
        );

    const now =
        new Date();

    const months =
        [
            3,
            6,
            9,
            12,
            15,
            18,
            24
        ];

    for (
        const month of months
    ) {
        const next =
            new Date(
                start
            );

        next.setMonth(
            next.getMonth() +
                month
        );

        if (
            next.getTime() >
            now.getTime()
        ) {
            return next;
        }
    }

    const next =
        new Date(
            start
        );

    next.setMonth(
        next.getMonth() +
            24
    );

    while (
        next.getTime() <=
        now.getTime()
    ) {
        next.setMonth(
            next.getMonth() +
                12
        );
    }

    return next;
}

function formatDuration(
    timestamp
) {
    if (!timestamp) {
        return "No disponible";
    }

    return `<t:${Math.floor(
        timestamp / 1000
    )}:R>`;
}

export default {
    name: "uid",
    permission: 2,

    async execute(
        message,
        args
    ) {
        try {
            let user;

            if (
                message.mentions.users.first()
            ) {
                user =
                    message.mentions.users.first();

            } else if (
                args[0]
            ) {
                const userId =
                    args[0].replace(
                        /[<@!>]/g,
                        ""
                    );

                if (
                    !/^\d{17,20}$/.test(
                        userId
                    )
                ) {
                    await message.react(
                        "❌"
                    );

                    return;
                }

                user =
                    await message.client.users.fetch(
                        userId,
                        {
                            force: true
                        }
                    );

            } else {
                user =
                    message.author;
            }

            user =
                await message.client.users.fetch(
                    user.id,
                    {
                        force: true
                    }
                );

            const member =
                await message.guild.members.fetch(
                    user.id
                ).catch(
                    () => null
                );

            const nickname =
                member?.displayName ||
                user.globalName ||
                user.username;

            const avatar =
                user.displayAvatarURL({
                    extension:
                        user.avatar?.startsWith(
                            "a_"
                        )
                            ? "gif"
                            : "png",
                    size: 4096
                });

            const createdTimestamp =
                user.createdTimestamp;

            const joinedTimestamp =
                member?.joinedTimestamp;

            const premiumSinceTimestamp =
                member?.premiumSinceTimestamp ||
                null;

            const nextBadgeTimestamp =
                getNextBadgeTimestamp(
                    premiumSinceTimestamp
                );

            const embed =
                new EmbedBuilder()
                    .setColor(
                        EMBED_COLOR
                    )
                    .setAuthor({
                        name:
                            nickname,
                        iconURL:
                            avatar
                    })
                    .setTitle(
                        "Información del Usuario"
                    )
                    .setDescription(
                        `<:persona:1538099937391288380> **Usuario**: \`${user.username}\`\n` +
                        `<:config:1538099479759294484> **ID del Usuario**: \`${user.id}\`\n\n` +
                        `<:boost:1538100006249046027> **Nitro**: ${
                            premiumSinceTimestamp
                                ? formatDuration(
                                    premiumSinceTimestamp
                                )
                                : "No disponible"
                        }\n` +
                        `<:lvl:1538099654149935176> **Next Badge**: ${
                            nextBadgeTimestamp
                                ? `<t:${Math.floor(
                                    nextBadgeTimestamp.getTime() /
                                    1000
                                )}:R>`
                                : "No disponible"
                        }\n` +
                        `<:time:1538102015241224192> **Creado**: ${formatDuration(
                            createdTimestamp
                        )}\n` +
                        `<:tiempo:1538308636265160714> **Unido**: ${
                            joinedTimestamp
                                ? formatDuration(
                                    joinedTimestamp
                                )
                                : "No está en el servidor"
                        }`
                    )
                    .setThumbnail(
                        avatar
                    )
                    .setImage(
                        avatar
                    )
                    .setFooter({
                        text:
                            `Solicitado por ${message.author.username}`,
                        iconURL:
                            message.author.displayAvatarURL({
                                extension: "png",
                                size: 128
                            })
                    });

            await message.reply({
                embeds: [
                    embed
                ]
            });

        } catch (error) {
            console.error(
                "Error en comando uid:",
                error
            );

            await message.react(
                "❌"
            );
        }
    }
};