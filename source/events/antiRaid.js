import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AuditLogEvent,
    ChannelType
} from "discord.js";

import {
    saveAntiRaidRoles
} from "../utils/antiRaidManager.js";

const LOG_CHANNEL_ID = "1525379838095921172";

const WHITELIST_ROLES = [
    "1397135262823485550",
    "1394406230348529674",
    "1373365803491266683"
];

const REMOVABLE_ROLES = [
    "1373365802337566862",
    "1525041035024007188"
];

const PING_LIMIT = 5;
const TIME_WINDOW = 60 * 1000;
const AUDIT_LOG_MAX_AGE = 10 * 1000;

const pingTracker = new Map();
const actionLocks = new Set();

function isWhitelisted(member) {
    return WHITELIST_ROLES.some(roleId =>
        member.roles.cache.has(roleId)
    );
}

function isRecentAuditLog(entry) {
    if (!entry?.createdTimestamp) return false;

    return (
        Date.now() - entry.createdTimestamp <=
        AUDIT_LOG_MAX_AGE
    );
}

async function getExecutor(guild, type, targetId) {
    const auditLogs =
        await guild.fetchAuditLogs({
            type,
            limit: 5
        });

    const entry =
        auditLogs.entries.find(
            entry =>
                entry.target?.id === targetId &&
                isRecentAuditLog(entry)
        );

    if (!entry?.executor?.id) {
        return null;
    }

    try {
        const member =
            await guild.members.fetch(
                entry.executor.id
            );

        return {
            member,
            entry
        };

    } catch {
        return null;
    }
}

async function getLogChannel(guild) {
    try {
        return await guild.channels.fetch(
            LOG_CHANNEL_ID
        );
    } catch {
        return null;
    }
}

async function penalize(member, reason) {
    if (!member || isWhitelisted(member)) {
        return null;
    }

    const rolesToSave =
        member.roles.cache
            .filter(
                role =>
                    role.id !== member.guild.id &&
                    !role.managed &&
                    !role.permissions.has(
                        "Administrator"
                    )
            )
            .map(role => role.id);

    if (rolesToSave.length > 0) {
        try {
            await saveAntiRaidRoles(
                member.id,
                rolesToSave
            );
        } catch (error) {
            console.error(
                "Error guardando roles Anti-Raid:",
                error
            );
        }
    }

    const removableRoles =
        member.roles.cache.filter(
            role =>
                role.id !== member.guild.id &&
                !role.managed &&
                (
                    REMOVABLE_ROLES.includes(
                        role.id
                    ) ||
                    role.editable
                )
        );

    if (removableRoles.size > 0) {
        try {
            await member.roles.remove(
                removableRoles,
                `Anti-Raid: ${reason}`
            );
        } catch (error) {
            console.error(
                "Error removiendo roles Anti-Raid:",
                error
            );
        }
    }

    const channel =
        await getLogChannel(
            member.guild
        );

    if (!channel) {
        return rolesToSave;
    }

    const embed =
        new EmbedBuilder()
            .setColor("#ffaf1a")
            .setTitle(
                "⚠️ Acción Anti-Raid"
            )
            .setDescription(
                `**Usuario:** ${member}\n` +
                `**ID:** \`${member.id}\`\n` +
                `**Motivo:** ${reason}\n\n` +
                `**Acción:** Se removieron los roles del usuario.\n\n` +
                `**Roles guardados para restauración:**\n` +
                `${
                    rolesToSave.length > 0
                        ? rolesToSave
                            .map(
                                id =>
                                    `<@&${id}>`
                            )
                            .join(" ")
                        : "Ninguno"
                }`
            )
            .setTimestamp();

    const restoreButton =
        new ButtonBuilder()
            .setCustomId(
                `restore_antiraid:${member.id}`
            )
            .setLabel(
                "Restaurar roles"
            )
            .setStyle(
                ButtonStyle.Secondary
            );

    const row =
        new ActionRowBuilder()
            .addComponents(
                restoreButton
            );

    await channel.send({
        content:
            WHITELIST_ROLES
                .map(
                    roleId =>
                        `<@&${roleId}>`
                )
                .join(" "),
        embeds: [
            embed
        ],
        components: [
            row
        ]
    });

    return rolesToSave;
}

function registerPing(member) {
    const now = Date.now();

    const timestamps =
        pingTracker.get(
            member.id
        ) || [];

    const recent =
        timestamps.filter(
            timestamp =>
                now - timestamp <
                TIME_WINDOW
        );

    recent.push(now);

    pingTracker.set(
        member.id,
        recent
    );

    return recent.length;
}

function registerAction(key) {
    const now = Date.now();

    const timestamps =
        pingTracker.get(key) || [];

    const recent =
        timestamps.filter(
            timestamp =>
                now - timestamp <
                TIME_WINDOW
        );

    recent.push(now);

    pingTracker.set(
        key,
        recent
    );

    return recent.length;
}

async function recreateRole(role) {
    const guild =
        role.guild;

    const newRole =
        await guild.roles.create({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            mentionable:
                role.mentionable,
            permissions:
                role.permissions.bitfield,
            reason:
                "Anti-Raid: Restauración automática de rol eliminado"
        });

    try {
        await newRole.setPosition(
            role.position,
            {
                reason:
                    "Anti-Raid: Restauración de posición del rol"
            }
        );
    } catch (error) {
        console.error(
            "Error restaurando posición del rol:",
            error
        );
    }

    return newRole;
}

function getChannelCreateOptions(channel) {
    const options = {
        name:
            channel.name,

        type:
            channel.type,

        position:
            channel.rawPosition,

        permissionOverwrites:
            channel.permissionOverwrites.cache.map(
                overwrite => ({
                    id:
                        overwrite.id,

                    allow:
                        overwrite.allow.bitfield,

                    deny:
                        overwrite.deny.bitfield,

                    type:
                        overwrite.type
                })
            )
    };

    if (channel.parentId) {
        options.parent =
            channel.parentId;
    }

    if (
        channel.type ===
            ChannelType.GuildText ||
        channel.type ===
            ChannelType.GuildAnnouncement
    ) {
        options.topic =
            channel.topic ??
            undefined;

        options.nsfw =
            channel.nsfw;

        options.rateLimitPerUser =
            channel.rateLimitPerUser;
    }

    if (
        channel.type ===
            ChannelType.GuildVoice ||
        channel.type ===
            ChannelType.GuildStageVoice
    ) {
        options.bitrate =
            channel.bitrate;

        options.userLimit =
            channel.userLimit;

        if (channel.rtcRegion) {
            options.rtcRegion =
                channel.rtcRegion;
        }

        if (channel.videoQualityMode) {
            options.videoQualityMode =
                channel.videoQualityMode;
        }
    }

    if (
        channel.type ===
            ChannelType.GuildForum ||
        channel.type ===
            ChannelType.GuildMedia
    ) {
        options.topic =
            channel.topic ??
            undefined;

        options.nsfw =
            channel.nsfw;

        options.rateLimitPerUser =
            channel.rateLimitPerUser;

        if (
            channel.defaultAutoArchiveDuration
        ) {
            options.defaultAutoArchiveDuration =
                channel.defaultAutoArchiveDuration;
        }

        if (
            channel.defaultThreadRateLimitPerUser
        ) {
            options.defaultThreadRateLimitPerUser =
                channel.defaultThreadRateLimitPerUser;
        }
    }

    return options;
}

async function recreateChannel(channel) {
    const guild =
        channel.guild;

    const options =
        getChannelCreateOptions(
            channel
        );

    const newChannel =
        await guild.channels.create(
            options
        );

    try {
        await newChannel.setPosition(
            channel.rawPosition,
            {
                reason:
                    "Anti-Raid: Restauración automática de canal"
            }
        );
    } catch (error) {
        console.error(
            "Error restaurando posición del canal:",
            error
        );
    }

    return newChannel;
}

async function logRecreatedRole(
    guild,
    executor,
    oldRole,
    newRole
) {
    const channel =
        await getLogChannel(
            guild
        );

    if (!channel) return;

    const embed =
        new EmbedBuilder()
            .setColor("#ffaf1a")
            .setTitle(
                "⚠️ Acción Anti-Raid"
            )
            .setDescription(
                `**Usuario:** ${executor}\n` +
                `**ID:** \`${executor.id}\`\n\n` +
                `**Acción:** Rol eliminado + rol creado\n\n` +
                `**Rol eliminado:** ${oldRole.name}\n` +
                `**Rol creado:** ${newRole}\n` +
                `**ID nuevo:** \`${newRole.id}\`\n\n` +
                `**Color:** \`${oldRole.hexColor}\`\n` +
                `**Posición:** \`${oldRole.position}\`\n` +
                `**Administrador:** ${
                    oldRole.permissions.has(
                        "Administrator"
                    )
                        ? "Sí"
                        : "No"
                }`
            )
            .setTimestamp();

    await channel.send({
        content:
            WHITELIST_ROLES
                .map(
                    roleId =>
                        `<@&${roleId}>`
                )
                .join(" "),
        embeds: [
            embed
        ]
    });
}

async function logRecreatedChannel(
    guild,
    executor,
    oldChannel,
    newChannel
) {
    const channel =
        await getLogChannel(
            guild
        );

    if (!channel) return;

    const embed =
        new EmbedBuilder()
            .setColor("#ffaf1a")
            .setTitle(
                "⚠️ Acción Anti-Raid"
            )
            .setDescription(
                `**Usuario:** ${executor}\n` +
                `**ID:** \`${executor.id}\`\n\n` +
                `**Acción:** Canal eliminado + canal creado\n\n` +
                `**Canal eliminado:** #${oldChannel.name}\n` +
                `**Canal creado:** ${newChannel}\n` +
                `**ID nuevo:** \`${newChannel.id}\`\n\n` +
                `**Tipo:** \`${oldChannel.type}\`\n` +
                `**Posición:** \`${oldChannel.rawPosition}\`\n` +
                `**Categoría:** ${
                    oldChannel.parent
                        ? oldChannel.parent.name
                        : "Ninguna"
                }`
            )
            .setTimestamp();

    await channel.send({
        content:
            WHITELIST_ROLES
                .map(
                    roleId =>
                        `<@&${roleId}>`
                )
                .join(" "),
        embeds: [
            embed
        ]
    });
}

export default {
    register(client) {

        /*
         * @EVERYONE
         */

        client.on(
            "messageCreate",
            async message => {

                if (message.author.bot) {
                    return;
                }

                const member =
                    message.member;

                if (
                    !member ||
                    isWhitelisted(member)
                ) {
                    return;
                }

                if (
                    !message.mentions.everyone
                ) {
                    return;
                }

                const count =
                    registerPing(
                        member
                    );

                if (
                    count >
                    PING_LIMIT
                ) {
                    pingTracker.delete(
                        member.id
                    );

                    await penalize(
                        member,
                        "Más de 5 menciones de @everyone en un minuto."
                    );
                }
            }
        );

        /*
         * BOT NUEVO
         */

        client.on(
            "guildMemberAdd",
            async member => {

                if (!member.user.bot) {
                    return;
                }

                await penalize(
                    member,
                    "Introducción de un bot al servidor."
                );
            }
        );

        /*
         * CANAL ELIMINADO
         */

        client.on(
            "channelDelete",
            async channel => {

                const guild =
                    channel.guild;

                if (!guild) {
                    return;
                }

                const lockKey =
                    `channelDelete:${channel.id}`;

                if (
                    actionLocks.has(
                        lockKey
                    )
                ) {
                    return;
                }

                actionLocks.add(
                    lockKey
                );

                try {

                    const result =
                        await getExecutor(
                            guild,
                            AuditLogEvent.ChannelDelete,
                            channel.id
                        );

                    if (!result) {
                        return;
                    }

                    const {
                        member: executor
                    } = result;

                    if (
                        isWhitelisted(
                            executor
                        )
                    ) {
                        return;
                    }

                    const newChannel =
                        await recreateChannel(
                            channel
                        );

                    await logRecreatedChannel(
                        guild,
                        executor,
                        channel,
                        newChannel
                    );

                    const count =
                        registerAction(
                            `channelRaid:${executor.id}`
                        );

                    if (
                        count >= 2
                    ) {
                        pingTracker.delete(
                            `channelRaid:${executor.id}`
                        );

                        await penalize(
                            executor,
                            "Eliminación de 2 canales en menos de un minuto."
                        );
                    }

                } catch (error) {

                    console.error(
                        "Error Anti-Raid channelDelete:",
                        error
                    );

                } finally {

                    actionLocks.delete(
                        lockKey
                    );
                }
            }
        );

        /*
         * ROL ELIMINADO
         */

        client.on(
            "roleDelete",
            async role => {

                const guild =
                    role.guild;

                const lockKey =
                    `roleDelete:${role.id}`;

                if (
                    actionLocks.has(
                        lockKey
                    )
                ) {
                    return;
                }

                actionLocks.add(
                    lockKey
                );

                try {

                    const result =
                        await getExecutor(
                            guild,
                            AuditLogEvent.RoleDelete,
                            role.id
                        );

                    if (!result) {
                        return;
                    }

                    const {
                        member: executor
                    } = result;

                    if (
                        isWhitelisted(
                            executor
                        )
                    ) {
                        return;
                    }

                    const newRole =
                        await recreateRole(
                            role
                        );

                    await logRecreatedRole(
                        guild,
                        executor,
                        role,
                        newRole
                    );

                    const count =
                        registerAction(
                            `roleRaid:${executor.id}`
                        );

                    if (
                        count >= 2
                    ) {
                        pingTracker.delete(
                            `roleRaid:${executor.id}`
                        );

                        await penalize(
                            executor,
                            "Eliminación de 2 roles en menos de un minuto."
                        );
                    }

                } catch (error) {

                    console.error(
                        "Error Anti-Raid roleDelete:",
                        error
                    );

                } finally {

                    actionLocks.delete(
                        lockKey
                    );
                }
            }
        );

        /*
         * ASIGNACIÓN DE ADMINISTRADOR
         */

        client.on(
            "guildMemberUpdate",
            async (
                oldMember,
                newMember
            ) => {

                try {

                    const addedAdminRole =
                        newMember.roles.cache.find(
                            role =>
                                role.permissions.has(
                                    "Administrator"
                                ) &&
                                !oldMember.roles.cache.has(
                                    role.id
                                )
                        );

                    if (
                        !addedAdminRole
                    ) {
                        return;
                    }

                    const auditLogs =
                        await newMember.guild.fetchAuditLogs({
                            type:
                                AuditLogEvent.MemberRoleUpdate,
                            limit: 5
                        });

                    const entry =
                        auditLogs.entries.find(
                            entry =>
                                entry.target?.id ===
                                    newMember.id &&
                                isRecentAuditLog(
                                    entry
                                )
                        );

                    if (
                        !entry?.executor?.id
                    ) {
                        return;
                    }

                    const executor =
                        await newMember.guild.members.fetch(
                            entry.executor.id
                        );

                    if (
                        isWhitelisted(
                            executor
                        )
                    ) {
                        return;
                    }

                    await penalize(
                        executor,
                        `Asignación de permisos de administrador al usuario ${newMember}.`
                    );

                } catch (error) {

                    console.error(
                        "Error Anti-Raid admin:",
                        error
                    );
                }
            }
        );
    }
};