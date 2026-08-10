function timestamp() {
    return new Date().toISOString();
}
const logger = {
    info(message) {
        console.log(`[${timestamp()}] [INFO] ${message}`);
    },
    warn(message) {
        console.warn(`[${timestamp()}] [WARN] ${message}`);
    },
    error(message, error = null) {
        console.error(`[${timestamp()}] [ERROR] ${message}`);
        if (error) {
            console.error(error);
        }
    }
};
export default logger;
