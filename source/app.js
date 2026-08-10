import { Client, GatewayIntentBits } from "discord.js";
import config from "./config/config.js";
import registerEvents from "./events/index.js";
import logger from "./utils/logger.js";
if (!config.discord.token) {
    logger.error("DISCORD_TOKEN is not configured.");
    process.exit(1);
}
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});
registerEvents(client);
client.login(config.discord.token).catch((error) => {
    logger.error("Failed to login to Discord:", error);
    process.exit(1);
});