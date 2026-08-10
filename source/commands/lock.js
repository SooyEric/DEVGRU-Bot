const PERMISSION_ROLE_ID = "1373365866657222819";

export default {
    name: "lock",
    permission: 1,

    async execute(message) {
        try {
            await message.channel.permissionOverwrites.edit(
                PERMISSION_ROLE_ID,
                {
                    SendMessages: false
                }
            );

            await message.react("✅");
        } catch (error) {
            console.error("Error en comando lock:", error);
            await message.react("❌");
        }
    }
};