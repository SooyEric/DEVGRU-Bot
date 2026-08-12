const AGENCIES = {
    semar: {
        roles: [
            "1537004958950363197",
            "1537000629271142440",
            "1373365865734738070",
            "1537009488735772752",
            "1537014311342579732"
        ]
    },

    sedena: {
        roles: [
            "1537004958950363197",
            "1537000588624273408",
            "1373365865734738070",
            "1537009488735772752",
            "1537014416401371156"
        ]
    },

    "guardia": {
        roles: [
            "1537004958950363197",
            "1537000556160356392",
            "1373365865734738070",
            "1537009488735772752",
            "1537014498915778640"
        ]
    },

    "delta": {
        roles: [
            "1537004958950363197",
            "1537006775989960744",
            "1373365865734738070",
            "1537009488735772752",
            "1537014584035115099"
        ]
    }
};

const GUEST_ROLE = "1373365890623602768";

const ALL_AGENCY_ROLES = [
    ...new Set(
        Object.values(AGENCIES).flatMap(
            agency => agency.roles
        )
    )
];

export default {
    name: "agregar",
    permission: 1,

    async execute(message, args) {
        const agency = args[0]?.toLowerCase();
        const targetInput = args[1];

        if (
            ![
                "semar",
                "sedena",
                "guardia",
                "delta",
                "guest"
            ].includes(agency)
        ) {
            await message.react("❌");
            return;
        }

        if (!targetInput) {
            await message.react("❌");
            return;
        }

        let member;

        try {
            member = message.mentions.members.first();

            if (!member) {
                const userId =
                    targetInput.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                member =
                    await message.guild.members.fetch(
                        userId
                    );
            }

            if (!member) {
                await message.react("❌");
                return;
            }

            member =
                await message.guild.members.fetch({
                    user: member.id,
                    force: true
                });

        } catch {
            await message.react("❌");
            return;
        }

        try {
            if (agency === "guest") {
                const rolesToRemove =
                    member.roles.cache.filter(
                        role =>
                            ALL_AGENCY_ROLES.includes(
                                role.id
                            ) ||
                            role.id === GUEST_ROLE
                    );

                if (rolesToRemove.size > 0) {
                    await member.roles.remove(
                        rolesToRemove
                    );
                }

                await member.roles.add(
                    GUEST_ROLE
                );

                await message.react("✅");
                return;
            }

            const selectedAgency =
                AGENCIES[agency];

            const rolesToRemove =
                member.roles.cache.filter(
                    role =>
                        ALL_AGENCY_ROLES.includes(
                            role.id
                        ) ||
                        role.id === GUEST_ROLE
                );

            if (rolesToRemove.size > 0) {
                await member.roles.remove(
                    rolesToRemove
                );
            }

            for (const roleId of selectedAgency.roles) {
                await member.roles.add(
                    roleId
                );
            }

            await message.react("✅");

        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};