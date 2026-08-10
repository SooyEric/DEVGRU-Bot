client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (!interaction.customId.startsWith("restore_ban:")) return;

    const userId = interaction.customId.split(":")[1];

    const allowedRoles = permissions[1];

    const hasPermission = allowedRoles?.some(
        roleId => interaction.member?.roles.cache.has(roleId)
    );

    if (!hasPermission) {
        await interaction.reply({
            content: "❌ No tienes permiso para restaurar este usuario.",
            ephemeral: true
        });

        return;
    }

    try {
        const bannedMember = await getBannedMember(userId);

        if (!bannedMember || bannedMember.restored) {
            await interaction.reply({
                content: "❌ Este registro ya fue restaurado.",
                ephemeral: true
            });

            return;
        }

        let member;

        try {
            member = await interaction.guild.members.fetch(userId);
        } catch {
            await interaction.reply({
                content: "❌ El usuario todavía no ha regresado al servidor.",
                ephemeral: true
            });

            return;
        }

        for (const roleId of bannedMember.role_ids) {
            try {
                await member.roles.add(roleId);
            } catch {}
        }

        if (bannedMember.nickname !== null) {
            try {
                await member.setNickname(bannedMember.nickname);
            } catch {}
        }

        await markRestored(userId);

        await interaction.update({
            components: []
        });

        const logEmbed = new EmbedBuilder()
            .setColor("#ffaf1a")
            .setTitle("Roles restaurados")
            .setDescription(
                `Los roles de ${member} fueron restaurados correctamente.\n\n` +
                `**ID:** \`${userId}\`\n` +
                `**Restaurado por:** ${interaction.user}`
            );

        await interaction.channel.send({
            embeds: [logEmbed]
        });

    } catch (error) {
        logger.error("Error restoring banned member:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ No se pudo restaurar al usuario.",
                ephemeral: true
            });
        }
    }
});