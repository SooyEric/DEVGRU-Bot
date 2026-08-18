const ROBLOX_GROUP_ID =
    process.env.ROBLOX_GROUP_ID;

export async function isRobloxUserInGroup(
    robloxUserId
) {
    if (
        !ROBLOX_GROUP_ID
    ) {
        throw new Error(
            "ROBLOX_GROUP_ID no está configurado."
        );
    }

    const response =
        await fetch(
            `https://groups.roblox.com/v2/users/${robloxUserId}/groups/roles`
        );

    if (
        !response.ok
    ) {
        throw new Error(
            `Roblox Groups API respondió ${response.status}.`
        );
    }

    const data =
        await response.json();

    return (
        data.data?.some(
            group =>
                String(
                    group.group?.id
                ) ===
                String(
                    ROBLOX_GROUP_ID
                )
        ) ?? false
    );
}