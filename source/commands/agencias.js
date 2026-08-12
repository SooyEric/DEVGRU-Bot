const AGENCIES = {
    semar: {
        roles: [
            "1537004958950363197",
            "1537000629271142440",
            "1373365865734738070",
            "1537009488735772752"
        ]
    },

    sedena: {
        roles: [
            "1537004958950363197",
            "1537000588624273408",
            "1373365865734738070",
            "1537009488735772752"
        ]
    },

    guardia: {
        roles: [
            "1537004958950363197",
            "1537000556160356392",
            "1373365865734738070",
            "1537009488735772752"
        ]
    },

    delta: {
        roles: [
            "1537004958950363197",
            "1537006775989960744",
            "1373365865734738070",
            "1537009488735772752"
        ]
    }
};

const GUEST_ROLE =
    "1373365890623602768";

const ALL_AGENCY_ROLES = [
    ...new Set(
        Object.values(AGENCIES).flatMap(
            agency => agency.roles
        )
    )
];

export default {
    name: "agencias",
    permission: 1,

    async execute(message, args) {

        const agency =
            args[0]?.toLowerCase();

        const targetInput =
            args[1];

        /*
         * ============================================================
         * VALIDACIÓN
         * ============================================================
         */

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

        /*
         * ============================================================
         * OBTENER MIEMBRO
         * ============================================================
         */

        let member;

        try {

            member =
                message.mentions.members.first();

            if (!member) {

                const userId =
                    targetInput.replace(
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

        /*
         * ============================================================
         * GUEST
         * ============================================================
         */

        if (agency === "guest") {

            try {

                const rolesToRemove =
                    member.roles.cache.filter(
                        role =>
                            ALL_AGENCY_ROLES.includes(
                                role.id
                            ) ||
                            role.id === GUEST_ROLE
                    );

                if (
                    rolesToRemove.size > 0
                ) {
                    await member.roles.remove(
                        rolesToRemove
                    );
                }

                await member.roles.add(
                    GUEST_ROLE
                );

                await message.react("✅");

            } catch (error) {

                await message.react("❌");
                throw error;
            }

            return;
        }

        /*
         * ============================================================
         * ASIGNACIÓN DE AGENCIA
         * ============================================================
         */

        try {

            const selectedAgency =
                AGENCIES[agency];

            /*
             * Remover cualquier rol perteneciente
             * a otra agencia.
             */
            const agencyRolesToRemove =
                member.roles.cache.filter(
                    role =>
                        ALL_AGENCY_ROLES.includes(
                            role.id
                        )
                );

            if (
                agencyRolesToRemove.size > 0
            ) {
                await member.roles.remove(
                    agencyRolesToRemove
                );
            }

            /*
             * Remover Guest.
             */
            if (
                member.roles.cache.has(
                    GUEST_ROLE
                )
            ) {
                await member.roles.remove(
                    GUEST_ROLE
                );
            }

            /*
             * Agregar roles de la nueva agencia.
             */
            for (
                const roleId
                of selectedAgency.roles
            ) {
                if (
                    !member.roles.cache.has(
                        roleId
                    )
                ) {
                    await member.roles.add(
                        roleId
                    );
                }
            }

            await message.react("✅");

        } catch (error) {

            await message.react("❌");
            throw error;
        }
    }
};