const SNIPE_EXPIRATION =
    10 * 60 * 1000;

const MAX_SNIPES_PER_CHANNEL = 100;

const snipeCache = new Map();

/*
 * ============================================================
 * CREAR CLAVE DEL CANAL
 * ============================================================
 */

function getChannelKey(
    guildId,
    channelId
) {
    return `${guildId}:${channelId}`;
}

/*
 * ============================================================
 * GUARDAR MENSAJE
 * ============================================================
 */

export function saveSnipe(
    message
) {
    if (
        !message ||
        !message.guild ||
        !message.channel
    ) {
        return;
    }

    const channelKey =
        getChannelKey(
            message.guild.id,
            message.channel.id
        );

    const now =
        Date.now();

    const attachments =
        [...message.attachments.values()]
            .map(
                attachment => ({
                    name:
                        attachment.name,

                    url:
                        attachment.url,

                    proxyURL:
                        attachment.proxyURL,

                    contentType:
                        attachment.contentType,

                    size:
                        attachment.size
                })
            );

    const embeds =
        message.embeds.map(
            embed =>
                embed.toJSON()
        );

    const stickers =
        [...message.stickers.values()]
            .map(
                sticker => ({
                    id:
                        sticker.id,

                    name:
                        sticker.name,

                    url:
                        sticker.url,

                    format:
                        sticker.format
                })
            );

    const snipe = {
        messageId:
            message.id,

        guildId:
            message.guild.id,

        channelId:
            message.channel.id,

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
            message.member?.nickname ||
            message.author.globalName ||
            message.author.username,

        content:
            message.content || "",

        attachments,

        embeds,

        stickers,

        createdTimestamp:
            message.createdTimestamp,

        deletedTimestamp:
            now,

        deletedAt:
            new Date(now)
    };

    let snipes =
        snipeCache.get(
            channelKey
        );

    if (!snipes) {
        snipes = [];

        snipeCache.set(
            channelKey,
            snipes
        );
    }

    /*
     * El más reciente siempre queda primero.
     */

    snipes.unshift(
        snipe
    );

    /*
     * Máximo 100 mensajes.
     */

    if (
        snipes.length >
        MAX_SNIPES_PER_CHANNEL
    ) {
        snipes.length =
            MAX_SNIPES_PER_CHANNEL;
    }

    /*
     * Limpieza automática.
     */

    cleanupSnipes(
        channelKey
    );
}

/*
 * ============================================================
 * OBTENER SNIPES
 * ============================================================
 */

export function getSnipes(
    guildId,
    channelId
) {
    const channelKey =
        getChannelKey(
            guildId,
            channelId
        );

    cleanupSnipes(
        channelKey
    );

    return (
        snipeCache.get(
            channelKey
        ) || []
    );
}

/*
 * ============================================================
 * OBTENER UN SNIPE
 * ============================================================
 */

export function getSnipe(
    guildId,
    channelId,
    index
) {
    const snipes =
        getSnipes(
            guildId,
            channelId
        );

    return (
        snipes[index] ||
        null
    );
}

/*
 * ============================================================
 * ELIMINAR SNIPES EXPIRADOS
 * ============================================================
 */

function cleanupSnipes(
    channelKey
) {
    const snipes =
        snipeCache.get(
            channelKey
        );

    if (!snipes) {
        return;
    }

    const now =
        Date.now();

    const validSnipes =
        snipes.filter(
            snipe =>
                now -
                    snipe.deletedTimestamp <
                SNIPE_EXPIRATION
        );

    if (
        validSnipes.length === 0
    ) {
        snipeCache.delete(
            channelKey
        );

        return;
    }

    snipeCache.set(
        channelKey,
        validSnipes
    );
}

/*
 * ============================================================
 * LIMPIEZA GLOBAL
 * ============================================================
 *
 * Se ejecuta periódicamente para evitar que
 * la memoria conserve canales antiguos.
 */

setInterval(
    () => {
        for (
            const channelKey of
            snipeCache.keys()
        ) {
            cleanupSnipes(
                channelKey
            );
        }
    },
    60 * 1000
).unref();