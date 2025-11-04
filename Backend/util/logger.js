const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Destructure for clarity
const { combine, timestamp, label, printf, colorize } = format;

// === Custom log format ===
const logFormat = printf(({ timestamp, label, level, message }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

// === Create logger ===
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    label({ label: 'HallOfFame-Backend' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Write logs to daily-rotated file
    new DailyRotateFile({
      dirname: './logs',
      filename: 'hall-of-fame-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: process.env.LOG_MAX_DAYS || '14d',
      zippedArchive: true,
      handleExceptions: true,
      level: 'info',
    }),

    // Show logs on console in color
    new transports.Console({
      format: combine(
        colorize(),
        label({ label: 'HallOfFame-Backend' }),
        timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

// === Handle unhandled exceptions & rejections globally ===
logger.exceptions.handle(
  new transports.File({ filename: './logs/exceptions.log' })
);

logger.rejections.handle(
  new transports.File({ filename: './logs/rejections.log' })
);

module.exports = logger;
