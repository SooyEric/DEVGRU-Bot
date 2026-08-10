import { EmbedBuilder } from "discord.js";

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

const pingTracker = new Map();

function isWhitelisted(member) {
    return WHITELIST_ROLES.some(roleId =>
        member.roles.cache.has(roleId)
    );
}

async function penalize(member, reason) {
    if (isWhitelisted(member)) return;

    const removableRoles = member.roles.cache.filter(role =>
        REMOVABLE_ROLES.includes(role.id) ||
        role.id !== member.guild.id
    );

    if (removableRoles.size > 0) {
        await member.roles.remove(removableRoles);
    }

    const channel = await member.guild.channels.fetch(
        LOG_CHANNEL_ID
    );

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor("#ffaf1a")
        .setTitle("⚠️ Acción Anti-Raid")
        .setDescription(
            `**Usuario:** ${member}\n` +
            `**ID:** \`${member.id}\`\n` +
            `**Motivo:** ${reason}\n\n` +
            `**Acción:** Se removieron los roles del usuario.`
        )
        .setTimestamp();

    await channel.send({
        content: WHITELIST_ROLES
            .map(roleId => `<@&${roleId}>`)
            .join(" "),
        embeds: [embed]
    });
}

function registerPing(member) {
    const now = Date.now();

    const timestamps = pingTracker.get(member.id) || [];

    const recent = timestamps.filter(
        timestamp => now - timestamp < TIME_WINDOW
    );

    recent.push(now);

    pingTracker.set(member.id, recent);

    return recent.length;
}

export default {
    register(client) {

        client.on("messageCreate", async message => {
            if (message.author.bot) return;

            const member = message.member;

            if (!member || isWhitelisted(member)) return;

            const everyonePing = message.mentions.everyone;

            if (!everyonePing) return;

            const count = registerPing(member);

            if (count > PING_LIMIT) {
                pingTracker.delete(member.id);

                await penalize(
                    member,
                    "Más de 5 menciones de @everyone en un minuto."
                );
            }
        });

        client.on("guildMemberAdd", async member => {
            if (member.user.bot) {
                await penalize(
                    member,
                    "Introducción de un bot al servidor."
                );
            }
        });

        client.on("channelDelete", async channel => {
            const guild = channel.guild;

            if (!guild) return;

            try {
                const auditLogs = await guild.fetchAuditLogs({
                    type: 12,
                    limit: 1
                });

                const entry = auditLogs.entries.first();

                if (!entry) return;

                const member = await guild.members.fetch(
                    entry.executor.id
                );

                if (isWhitelisted(member)) return;

                await penalize(
                    member,
                    `Eliminación del canal **${channel.name}**.`
                );

            } catch (error) {
                console.error(
                    "Error Anti-Raid channelDelete:",
                    error
                );
            }
        });

        client.on("roleDelete", async role => {
            const guild = role.guild;

            try {
                const auditLogs = await guild.fetchAuditLogs({
                    type: 32,
                    limit: 1
                });

                const entry = auditLogs.entries.first();

                if (!entry) return;

                const member = await guild.members.fetch(
                    entry.executor.id
                );

                if (isWhitelisted(member)) return;

                const key = `roleDelete:${member.id}`;
                const now = Date.now();

                const previous = pingTracker.get(key) || [];

                const recent = previous.filter(
                    timestamp => now - timestamp < TIME_WINDOW
                );

                recent.push(now);
                pingTracker.set(key, recent);

                if (recent.length >= 2) {
                    pingTracker.delete(key);

                    await penalize(
                        member,
                        "Eliminación de 2 roles en menos de un minuto."
                    );
                }

            } catch (error) {
                console.error(
                    "Error Anti-Raid roleDelete:",
                    error
                );
            }
        });

        client.on("guildMemberUpdate", async (oldMember, newMember) => {
            try {
                const addedAdminRole =
                    newMember.roles.cache.find(
                        role =>
                            role.permissions.has("Administrator") &&
                            !oldMember.roles.cache.has(role.id)
                    );

                if (!addedAdminRole) return;

                const auditLogs =
                    await newMember.guild.fetchAuditLogs({
                        type: 25,
                        limit: 1
                    });

                const entry = auditLogs.entries.first();

                if (!entry) return;

                const executor =
                    await newMember.guild.members.fetch(
                        entry.executor.id
                    );

                if (isWhitelisted(executor)) return;

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
        });
    }
};