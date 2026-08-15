export default {
    name: "r",

    permission: 2,

    async execute(
        message,
        args
    ) {
        if (
            args.length < 2
        ) {
            await message.react("❌");
            return;
        }

        let member;
        let roleInput;

        const mentionedMember =
            message.mentions.members.first();

        if (mentionedMember) {
            member =
                mentionedMember;

            roleInput =
                args
                    .slice(1)
                    .join(" ");
        } else {
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
                await message.react("❌");
                return;
            }

            try {
                member =
                    await message.guild.members.fetch(
                        userId
                    );
            } catch {
                await message.react("❌");
                return;
            }

            roleInput =
                args
                    .slice(1)
                    .join(" ");
        }

        if (
            !member ||
            !roleInput
        ) {
            await message.react("❌");
            return;
        }

        const roleMention =
            roleInput.match(
                /^<@&(\d+)>$/
            );

        let role = null;

        if (roleMention) {
            role =
                message.guild.roles.cache.get(
                    roleMention[1]
                );
        }

        if (!role) {
            role =
                message.guild.roles.cache.get(
                    roleInput
                );
        }

        if (!role) {
            role =
                message.guild.roles.cache.find(
                    existingRole =>
                        existingRole.name.toLowerCase() ===
                        roleInput.toLowerCase()
                );
        }

        if (!role) {
            await message.react("❌");
            return;
        }

        if (role.managed) {
            await message.react("❌");
            return;
        }

        if (
            role.id ===
            message.guild.id
        ) {
            await message.react("❌");
            return;
        }

        try {
            if (
                member.roles.cache.has(
                    role.id
                )
            ) {
                await member.roles.remove(
                    role.id,
                    `Role toggle por ${message.author.tag}`
                );
            } else {
                await member.roles.add(
                    role.id,
                    `Role toggle por ${message.author.tag}`
                );
            }

            await message.react("✅");

        } catch (error) {
            console.error(
                "Error en comando r:",
                error
            );

            await message.react("❌");
        }
    }
};