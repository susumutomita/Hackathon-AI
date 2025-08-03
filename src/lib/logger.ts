import winston from "winston";

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logObject = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // In development, make it more readable
    if (process.env.NODE_ENV === "development") {
      return JSON.stringify(logObject, null, 2);
    }

    return JSON.stringify(logObject);
  }),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  }),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: structuredFormat,
  defaultMeta: {
    service: "hackathon-ai",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "development"
          ? consoleFormat
          : structuredFormat,
    }),
    // File transport for all environments
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: structuredFormat,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: structuredFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: "logs/exceptions.log" }),
);

logger.rejections.handle(
  new winston.transports.File({ filename: "logs/rejections.log" }),
);

// Extend logger with custom methods for different error types
interface CustomLogger extends winston.Logger {
  apiError: (message: string, meta?: any) => void;
  validationError: (message: string, meta?: any) => void;
  authError: (message: string, meta?: any) => void;
  networkError: (message: string, meta?: any) => void;
  performanceLog: (message: string, duration: number, meta?: any) => void;
}

const customLogger = logger as CustomLogger;

customLogger.apiError = (message: string, meta?: any) => {
  logger.error(message, {
    type: "API_ERROR",
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

customLogger.validationError = (message: string, meta?: any) => {
  logger.warn(message, {
    type: "VALIDATION_ERROR",
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

customLogger.authError = (message: string, meta?: any) => {
  logger.warn(message, {
    type: "AUTH_ERROR",
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

customLogger.networkError = (message: string, meta?: any) => {
  logger.error(message, {
    type: "NETWORK_ERROR",
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

customLogger.performanceLog = (
  message: string,
  duration: number,
  meta?: any,
) => {
  const level = duration > 5000 ? "warn" : duration > 1000 ? "info" : "debug";
  logger.log(level, message, {
    type: "PERFORMANCE",
    duration,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

export default customLogger;
