/**
 * 日志工具类
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

export interface LoggerOptions {
    level?: string;
    logDir?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
    maxFiles?: number;
    maxSize?: string;
    format?: 'simple' | 'json' | 'detailed';
}

export class Logger {
    private winston: winston.Logger;
    private options: Required<LoggerOptions>;

    constructor(options: LoggerOptions = {}) {
        this.options = {
            level: options.level || process.env.LOG_LEVEL || 'info',
            logDir: options.logDir || process.env.LOG_DIR || './logs',
            enableConsole: options.enableConsole ?? true,
            enableFile: options.enableFile ?? true,
            maxFiles: options.maxFiles || 14,
            maxSize: options.maxSize || '20m',
            format: options.format || 'detailed'
        };

        this.ensureLogDirectory();
        this.winston = this.createLogger();
    }

    private ensureLogDirectory(): void {
        if (this.options.enableFile && !fs.existsSync(this.options.logDir)) {
            fs.mkdirSync(this.options.logDir, { recursive: true });
        }
    }

    private createLogger(): winston.Logger {
        const transports: winston.transport[] = [];

        // Console transport
        if (this.options.enableConsole) {
            transports.push(
                new winston.transports.Console({
                    format: this.getConsoleFormat()
                })
            );
        }

        // File transports
        if (this.options.enableFile) {
            // Combined log
            transports.push(
                new winston.transports.File({
                    filename: path.join(this.options.logDir, 'bot.log'),
                    format: this.getFileFormat(),
                    maxsize: this.parseSize(this.options.maxSize),
                    maxFiles: this.options.maxFiles,
                    tailable: true
                })
            );

            // Error log
            transports.push(
                new winston.transports.File({
                    filename: path.join(this.options.logDir, 'error.log'),
                    level: 'error',
                    format: this.getFileFormat(),
                    maxsize: this.parseSize(this.options.maxSize),
                    maxFiles: this.options.maxFiles,
                    tailable: true
                })
            );

            // Access log (for HTTP-like requests)
            transports.push(
                new winston.transports.File({
                    filename: path.join(this.options.logDir, 'access.log'),
                    level: 'http',
                    format: this.getFileFormat(),
                    maxsize: this.parseSize(this.options.maxSize),
                    maxFiles: this.options.maxFiles,
                    tailable: true
                })
            );
        }

        return winston.createLogger({
            level: this.options.level,
            transports,
            exitOnError: false,
            silent: process.env.NODE_ENV === 'test'
        });
    }

    private getConsoleFormat(): winston.Logform.Format {
        const colorize = winston.format.colorize();
        
        switch (this.options.format) {
            case 'simple':
                return winston.format.combine(
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message }) => {
                        return `${timestamp} ${colorize.colorize(level, level.toUpperCase())}: ${message}`;
                    })
                );
            
            case 'json':
                return winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                );
            
            case 'detailed':
            default:
                return winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.errors({ stack: true }),
                    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                        const stackStr = stack ? `\n${stack}` : '';
                        return `${timestamp} [${colorize.colorize(level, level.toUpperCase())}]: ${message}${metaStr}${stackStr}`;
                    })
                );
        }
    }

    private getFileFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        );
    }

    private parseSize(size: string): number {
        const match = size.match(/^(\d+)([kmg]?)$/i);
        if (!match) return 20 * 1024 * 1024; // Default 20MB

        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 'k': return value * 1024;
            case 'm': return value * 1024 * 1024;
            case 'g': return value * 1024 * 1024 * 1024;
            default: return value;
        }
    }

    // Logging methods
    error(message: string, error?: Error | any, meta?: any): void {
        if (error instanceof Error) {
            this.winston.error(message, { error: error.message, stack: error.stack, ...meta });
        } else if (error) {
            this.winston.error(message, { error, ...meta });
        } else {
            this.winston.error(message, meta);
        }
    }

    warn(message: string, meta?: any): void {
        this.winston.warn(message, meta);
    }

    info(message: string, meta?: any): void {
        this.winston.info(message, meta);
    }

    debug(message: string, meta?: any): void {
        this.winston.debug(message, meta);
    }

    verbose(message: string, meta?: any): void {
        this.winston.verbose(message, meta);
    }

    http(message: string, meta?: any): void {
        this.winston.log('http', message, meta);
    }

    // Specialized logging methods
    logBotEvent(event: string, data?: any): void {
        this.info(`Bot Event: ${event}`, { event, data });
    }

    logUserAction(userId: string, action: string, data?: any): void {
        this.info(`User Action: ${action}`, { userId, action, data });
    }

    logSystemEvent(event: string, data?: any): void {
        this.info(`System Event: ${event}`, { event, data });
    }

    logPerformance(operation: string, duration: number, data?: any): void {
        this.info(`Performance: ${operation}`, { operation, duration, ...data });
    }

    logSecurity(event: string, details?: any): void {
        this.warn(`Security Event: ${event}`, { event, details });
    }

    // Request logging (for HTTP-like operations)
    logRequest(method: string, url: string, statusCode: number, duration: number, meta?: any): void {
        this.http(`${method} ${url} ${statusCode} ${duration}ms`, {
            method,
            url,
            statusCode,
            duration,
            ...meta
        });
    }

    // Configuration change logging
    logConfigChange(
        groupId: string, 
        field: string, 
        oldValue: any, 
        newValue: any, 
        changedBy: string
    ): void {
        this.info('Configuration changed', {
            groupId,
            field,
            oldValue,
            newValue,
            changedBy,
            timestamp: new Date().toISOString()
        });
    }

    // Error tracking
    logTelegramError(error: any, context?: any): void {
        this.error('Telegram API Error', error, {
            context,
            errorCode: error?.error_code,
            description: error?.description
        });
    }

    logValidationError(field: string, value: any, reason: string): void {
        this.warn('Validation Error', {
            field,
            value,
            reason
        });
    }

    // Statistics logging
    logStats(stats: any): void {
        this.info('Bot Statistics', stats);
    }

    // Backup and restore logging
    logBackup(operation: 'create' | 'restore', filename: string, success: boolean, error?: string): void {
        const level = success ? 'info' : 'error';
        const message = `Backup ${operation}: ${success ? 'Success' : 'Failed'}`;
        
        this.winston.log(level, message, {
            operation,
            filename,
            success,
            error
        });
    }

    // Clean shutdown
    async close(): Promise<void> {
        return new Promise((resolve) => {
            this.winston.on('finish', resolve);
            this.winston.end();
        });
    }

    // Get winston instance for advanced usage
    getWinstonInstance(): winston.Logger {
        return this.winston;
    }

    // Create child logger with additional context
    child(defaultMeta: any): Logger {
        const childWinston = this.winston.child(defaultMeta);
        const childLogger = Object.create(this);
        childLogger.winston = childWinston;
        return childLogger;
    }

    // Stream interface for external tools
    stream = {
        write: (message: string) => {
            this.info(message.trim());
        }
    };
}