const SNIPE_DURATION =
    10 * 60 * 1000;

const AUDIT_LOG_DELAY =
    1000;

const AUDIT_LOG_MAX_AGE =
    10 * 1000;

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

async function wasDeletedByAuthor(
    message
) {
    if (
        !message ||
        !message.guild ||
        !message.author
    ) {
        return false;
    }

    try {
        /*
         * Esperamos un momento para permitir
         * que Discord registre la acción en
         * el Audit Log.
         */
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    AUDIT_LOG_DELAY
                )
        );

        const auditLogs =
            await message.guild.fetchAuditLogs({
                type: 72,
                limit: 10
            });

        const now =
            Date.now();

        const entries =
            auditLogs.entries;

        for (
            const entry of entries.values()
        ) {
            const createdTimestamp =
                entry.createdTimestamp;

            if (
                !createdTimestamp ||
                now -
                    createdTimestamp >
                    AUDIT_LOG_MAX_AGE
            ) {
                continue;
            }

            /*
             * Discord normalmente registra el
             * usuario afectado en target.
             */
            const targetId =
                entry.target?.id;

            if (
                targetId !==
                message.author.id
            ) {
                continue;
            }

            /*
             * Si la entrada corresponde al
             * mensaje eliminado y el ejecutor
             * es el propio autor, aceptamos.
             */
            if (
                entry.executor?.id ===
                message.author.id
            ) {
                return true;
            }
        }

        /*
         * Si no encontramos una eliminación
         * coincidente en Audit Log, no guardamos
         * el mensaje.
         */
        return false;

    } catch (error) {
        console.error(
            "Error comprobando Audit Log para Snipe:",
            error
        );

        return false;
    }
}

export async function handleMessageDelete(
    message
) {
    if (
        !message ||
        !message.guild ||
        !message.author
    ) {
        return;
    }

    /*
     * Los bots no generan Snipes.
     */
    if (
        message.author.bot
    ) {
        return;
    }

    /*
     * Comprobamos quién realizó
     * la eliminación.
     */
    const deletedByAuthor =
        await wasDeletedByAuthor(
            message
        );

    if (
        !deletedByAuthor
    ) {
        return;
    }

    saveSnipe(
        message
    );
}

export function getSnipes(
    guildId
) {
    const guildCache =
        snipeCache.get(
            guildId
        );

    if (
        !guildCache
    ) {
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

    if (
        valid.length === 0
    ) {
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
        getSnipes(
            guildId
        );

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