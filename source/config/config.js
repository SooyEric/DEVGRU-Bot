const config = {
    discord: {
        prefix: "-",
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID
    },
    database: {
        url: process.env.DATABASE_URL
    },
    environment: process.env.NODE_ENV || "development"
};
export default config;
