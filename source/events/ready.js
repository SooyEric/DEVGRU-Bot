import { Events } from "discord.js";
import logger from "../utils/logger.js";
export default function ready(client) {
    client.once(Events.ClientReady, (readyClient) => {
        logger.info(`Logged in as ${readyClient.user.tag}`);
        logger.info("DEVGRU-Bot is online.");
    });
}
