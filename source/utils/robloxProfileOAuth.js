import crypto from "crypto";

const CLIENT_ID =
    process.env.ROBLOX_CLIENT_ID;

const CLIENT_SECRET =
    process.env.ROBLOX_CLIENT_SECRET;

const REDIRECT_URI =
    process.env.ROBLOX_REDIRECT_URI;

const AUTH_URL =
    "https://apis.roblox.com/oauth/v1/authorize";

const TOKEN_URL =
    "https://apis.roblox.com/oauth/v1/token";

const USERINFO_URL =
    "https://apis.roblox.com/oauth/v1/userinfo";

const pendingProfileStates =
    new Map();

export function createProfileRobloxAuthorization(
    userId,
    robloxUsername,
    channelId,
    messageId
) {
    if (
        !CLIENT_ID ||
        !CLIENT_SECRET ||
        !REDIRECT_URI
    ) {
        throw new Error(
            "Faltan variables de entorno de Roblox."
        );
    }

    const state =
        crypto.randomBytes(32).toString("hex");

    pendingProfileStates.set(
        state,
        {
            userId,
            robloxUsername,
            channelId,
            messageId,
            createdAt: Date.now()
        }
    );

    const params =
        new URLSearchParams({
            client_id:
                CLIENT_ID,

            redirect_uri:
                REDIRECT_URI,

            response_type:
                "code",

            scope:
                "openid profile group:read",

            state
        });

    return `${AUTH_URL}?${params}`;
}

export function getPendingProfileState(
    state
) {
    const data =
        pendingProfileStates.get(
            state
        );

    if (!data) {
        return null;
    }

    if (
        Date.now() -
            data.createdAt >
        10 * 60 * 1000
    ) {
        pendingProfileStates.delete(
            state
        );

        return null;
    }

    return data;
}

export function deletePendingProfileState(
    state
) {
    pendingProfileStates.delete(
        state
    );
}

export async function exchangeProfileRobloxCode(
    code
) {
    if (
        !CLIENT_ID ||
        !CLIENT_SECRET ||
        !REDIRECT_URI
    ) {
        throw new Error(
            "Faltan variables de entorno de Roblox."
        );
    }

    const body =
        new URLSearchParams({
            client_id:
                CLIENT_ID,

            client_secret:
                CLIENT_SECRET,

            grant_type:
                "authorization_code",

            code,

            redirect_uri:
                REDIRECT_URI
        });

    const response =
        await fetch(
            TOKEN_URL,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body
            }
        );

    if (!response.ok) {
        const errorText =
            await response.text();

        throw new Error(
            `Roblox profile OAuth token error: ${response.status} ${errorText}`
        );
    }

    return await response.json();
}

export async function getProfileRobloxUser(
    accessToken
) {
    const response =
        await fetch(
            USERINFO_URL,
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

    if (!response.ok) {
        const errorText =
            await response.text();

        throw new Error(
            `Roblox profile userinfo error: ${response.status} ${errorText}`
        );
    }

    return await response.json();
}