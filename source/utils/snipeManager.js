const SNIPE_DURATION =
    10 * 60 * 1000;

const snipeCache =
    new Map();

function getGuildCache(guildId) {
    if (!snipeCache.has(guildId)) {
        snipeCache.set(
            guildId,
            []
        );
    }

    return snipeCache.get(guildId);
}

export function saveSnipe(message) {
    if (
        !message ||
        !message.guild ||
        !message.author
    ) {
        return;
    }

    const attachments =
        [...message.attachments.values()]
            .map(attachment => ({
                name:
                    attachment.name ||
                    "archivo",
                url:
                    attachment.url,
                contentType:
                    attachment.contentType ||
                    null
            }));

    const entry = {
        messageId:
            message.id,

        guildId:
            message.guild.id,

        channelId:
            message.channel.id,

        authorId:
            message.author.id,

        authorUsername:
            message.author.username,

        authorAvatar:
            message.author.displayAvatarURL({
                extension: "png",
                size: 128
            }),

        nickname:
            message.member?.displayName ||
            message.author.globalName ||
            message.author.username,

        content:
            message.content || "",

        attachments,

        createdTimestamp:
            message.createdTimestamp,

        deletedTimestamp:
            Date.now()
    };

    const guildCache =
        getGuildCache(
            message.guild.id
        );

    guildCache.unshift(
        entry
    );

    while (
        guildCache.length > 100
    ) {
        guildCache.pop();
    }
}

export function getSnipes(
    guildId
) {
    const guildCache =
        snipeCache.get(guildId);

    if (!guildCache) {
        return [];
    }

    const now =
        Date.now();

    const valid =
        guildCache.filter(
            entry =>
                now -
                    entry.deletedTimestamp <
                SNIPE_DURATION
        );

    if (valid.length === 0) {
        snipeCache.delete(
            guildId
        );

        return [];
    }

    snipeCache.set(
        guildId,
        valid
    );

    return valid;
}

export function getSnipe(
    guildId,
    index
) {
    const snipes =
        getSnipes(guildId);

    return (
        snipes[index] ||
        null
    );
}

export function clearGuildSnipes(
    guildId
) {
    snipeCache.delete(
        guildId
    );
}

export function cleanupSnipes() {
    const now =
        Date.now();

    for (
        const [
            guildId,
            entries
        ] of snipeCache
    ) {
        const valid =
            entries.filter(
                entry =>
                    now -
                        entry.deletedTimestamp <
                    SNIPE_DURATION
            );

        if (
            valid.length === 0
        ) {
            snipeCache.delete(
                guildId
            );
        } else {
            snipeCache.set(
                guildId,
                valid
            );
        }
    }
}

setInterval(
    cleanupSnipes,
    60 * 1000
);