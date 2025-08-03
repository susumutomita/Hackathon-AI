// Client-safe logger for use in browser and Edge Runtime
const isDevelopment = process.env.NODE_ENV === "development";

const logger = {
  info: (message: string, meta?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, meta);
    }
  },
  error: (message: string, error?: any, meta?: any) => {
    console.error(`[ERROR] ${message}`, error, meta);
  },
  warn: (message: string, meta?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  debug: (message: string, meta?: any) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};

export default logger;
