import {
    SQUADRONS,
    getSquadron,
    assignPlate,
    updateSquadronTable
} from "../utils/squadronRegistry.js";

export default {
    name: "squadronRegistry",

    register(client) {

        client.on("guildMemberAdd", async member => {
            try {
                await member.guild.members.fetch();

                const assigned = await assignPlate(
                    member
                );

                const squadron = getSquadron(member);

                if (squadron) {
                    await updateSquadronTable(
                        member.guild,
                        squadron[0]
                    );
                }

            } catch (error) {
                console.error(
                    "Error registrando miembro:",
                    error
                );
            }
        });

        client.on("guildMemberRemove", async member => {
            try {
                for (
                    const squadronKey of Object.keys(
                        SQUADRONS
                    )
                ) {
                    await updateSquadronTable(
                        member.guild,
                        squadronKey
                    );
                }

            } catch (error) {
                console.error(
                    "Error actualizando registros:",
                    error
                );
            }
        });

        client.on(
            "guildMemberUpdate",
            async (oldMember, newMember) => {
                try {
                    const oldSquadron =
                        getSquadron(oldMember);

                    const newSquadron =
                        getSquadron(newMember);

                    await assignPlate(newMember);

                    if (oldSquadron) {
                        await updateSquadronTable(
                            newMember.guild,
                            oldSquadron[0]
                        );
                    }

                    if (
                        newSquadron &&
                        (
                            !oldSquadron ||
                            newSquadron[0] !== oldSquadron[0]
                        )
                    ) {
                        await updateSquadronTable(
                            newMember.guild,
                            newSquadron[0]
                        );
                    }

                } catch (error) {
                    console.error(
                        "Error actualizando registro:",
                        error
                    );
                }
            }
        );
    }
};