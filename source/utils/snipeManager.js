const SNIPE_TTL = 10 * 60 * 1000;
const MAX_SNIPE_MESSAGES = 100;

const snipeCache = new Map();

function getKey(guildId, channelId) {
    return `${guildId}:${channelId}`;
}

function cleanupExpired(key) {
    const messages = snipeCache.get(key);

    if (!messages) {
        return;
    }

    const now = Date.now();

    const validMessages = messages.filter(
        message =>
            now - message.deletedAt <
            SNIPE_TTL
    );

    if (validMessages.length === 0) {
        snipeCache.delete(key);
        return;
    }

    snipeCache.set(
        key,
        validMessages
    );
}

export function saveDeletedMessage(message) {
    if (
        !message.guild ||
        !message.channel ||
        !message.author
    ) {
        return;
    }

    const key =
        getKey(
            message.guild.id,
            message.channel.id
        );

    cleanupExpired(key);

    const messages =
        snipeCache.get(key) || [];

    const deletedMessage = {
        messageId:
            message.id,

        authorId:
            message.author.id,

        authorTag:
            message.author.tag,

        authorUsername:
            message.author.username,

        authorAvatar:
            message.author.displayAvatarURL({
                extension: "png",
                size: 256
            }),

        nickname:
            message.member?.displayName ||
            message.author.globalName ||
            message.author.username,

        content:
            message.content || "",

        attachments:
            [...message.attachments.values()]
                .map(
                    attachment => ({
                        name:
                            attachment.name,

                        url:
                            attachment.url,

                        contentType:
                            attachment.contentType ||
                            null,

                        size:
                            attachment.size
                    })
                ),

        embeds:
            message.embeds.map(
                embed =>
                    embed.toJSON()
            ),

        stickers:
            [...message.stickers.values()]
                .map(
                    sticker => ({
                        name:
                            sticker.name,

                        id:
                            sticker.id,

                        url:
                            sticker.url,

                        format:
                            sticker.format
                    })
                ),

        deletedAt:
            Date.now()
    };

    messages.unshift(
        deletedMessage
    );

    if (
        messages.length >
        MAX_SNIPE_MESSAGES
    ) {
        messages.length =
            MAX_SNIPE_MESSAGES;
    }

    snipeCache.set(
        key,
        messages
    );
}

export function getDeletedMessages(
    guildId,
    channelId
) {
    const key =
        getKey(
            guildId,
            channelId
        );

    cleanupExpired(key);

    return (
        snipeCache.get(key) ||
        []
    );
}

export function clearDeletedMessages(
    guildId,
    channelId
) {
    const key =
        getKey(
            guildId,
            channelId
        );

    snipeCache.delete(key);
}