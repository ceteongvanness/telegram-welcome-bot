/**
 * 应用程序入口点
 */

import dotenv from 'dotenv';
import { TelegramWelcomeBot } from './bot/TelegramBot';
import { Logger } from './utils/Logger';
import { ConfigManager } from './config/ConfigManager';
import { DEFAULT_APP_CONFIG } from './config/DefaultConfig';
import { AppConfig } from './types/Config';

// 加载环境变量
dotenv.config();

/**
 * 获取应用配置
 */
function getAppConfig(): AppConfig {
    return {
        botToken: process.env.BOT_TOKEN || '',
        adminIds: (process.env.ADMIN_IDS || '').split(',').filter(id => id.trim()),
        nodeEnv: process.env.NODE_ENV || DEFAULT_APP_CONFIG.nodeEnv!,
        port: parseInt(process.env.PORT || String(DEFAULT_APP_CONFIG.port!)),
        logLevel: process.env.LOG_LEVEL || DEFAULT_APP_CONFIG.logLevel!,
        logDir: process.env.LOG_DIR || DEFAULT_APP_CONFIG.logDir!,
        configPath: process.env.CONFIG_PATH || DEFAULT_APP_CONFIG.configPath!,
        uploadDir: process.env.UPLOAD_DIR || DEFAULT_APP_CONFIG.uploadDir!,
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(DEFAULT_APP_CONFIG.maxFileSize!)),
        backupInterval: parseInt(process.env.BACKUP_INTERVAL || String(DEFAULT_APP_CONFIG.backupInterval!)),
        logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || String(DEFAULT_APP_CONFIG.logRetentionDays!)),
        maxGroups: parseInt(process.env.MAX_GROUPS || String(DEFAULT_APP_CONFIG.maxGroups!)),
        defaultWelcomeDelay: parseInt(process.env.DEFAULT_WELCOME_DELAY || String(DEFAULT_APP_CONFIG.defaultWelcomeDelay!)),
        concurrentLimit: parseInt(process.env.CONCURRENT_LIMIT || String(DEFAULT_APP_CONFIG.concurrentLimit!)),
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || String(DEFAULT_APP_CONFIG.requestTimeout!)),
        maxRetries: parseInt(process.env.MAX_RETRIES || String(DEFAULT_APP_CONFIG.maxRetries!)),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || String(DEFAULT_APP_CONFIG.sessionTimeout!)),
        maxAdmins: parseInt(process.env.MAX_ADMINS || String(DEFAULT_APP_CONFIG.maxAdmins!)),
        debugMode: process.env.DEBUG_MODE === 'true',
        herokuMode: process.env.HEROKU_MODE === 'true' || !!process.env.DYNO,
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || String(DEFAULT_APP_CONFIG.healthCheckInterval!)),
        statsRetentionDays: parseInt(process.env.STATS_RETENTION_DAYS || String(DEFAULT_APP_CONFIG.statsRetentionDays!)),
        enableMetrics: process.env.ENABLE_METRICS !== 'false'
    };
}

/**
 * 验证必需的环境变量
 */
function validateEnvironment(config: AppConfig): void {
    const errors: string[] = [];

    if (!config.botToken) {
        errors.push('BOT_TOKEN environment variable is required');
    }

    if (config.adminIds.length === 0) {
        errors.push('ADMIN_IDS environment variable is required');
    }

    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('\n📖 Please check the .env.example file for configuration guidance.');
        process.exit(1);
    }
}

/**
 * 设置进程信号处理
 */
function setupSignalHandlers(bot: TelegramWelcomeBot, logger: Logger): void {
    const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        
        try {
            await bot.stop();
            logger.info('Bot stopped successfully');
            
            await logger.close();
            console.log('Application shutdown complete');
            
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection:', { reason, promise });
        gracefulShutdown('UNHANDLED_REJECTION');
    });
}

/**
 * 启动健康检查服务器（Heroku需要）
 */
function startHealthCheckServer(config: AppConfig, logger: Logger): void {
    if (config.herokuMode) {
        const express = require('express');
        const app = express();
        
        app.get('/', (req: any, res: any) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        app.get('/health', (req: any, res: any) => {
            res.json({ 
                status: 'ok',
                checks: {
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                }
            });
        });

        const server = app.listen(config.port, () => {
            logger.info(`Health check server running on port ${config.port}`);
        });

        // 优雅关闭HTTP服务器
        process.on('SIGTERM', () => {
            server.close(() => {
                logger.info('Health check server closed');
            });
        });
    }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
    console.log('🤖 Starting Telegram Welcome Bot...\n');

    // 获取和验证配置
    const config = getAppConfig();
    validateEnvironment(config);

    // 初始化日志器
    const logger = new Logger({
        level: config.logLevel,
        logDir: config.logDir,
        enableConsole: true,
        enableFile: !config.herokuMode, // Heroku 使用标准输出
        format: config.herokuMode ? 'json' : 'detailed'
    });

    logger.info('Application starting...', {
        nodeEnv: config.nodeEnv,
        herokuMode: config.herokuMode,
        adminCount: config.adminIds.length
    });

    try {
        // 初始化配置管理器
        const configManager = new ConfigManager(config.configPath, logger, {
            autoSave: true,
            backupDir: `${config.configPath}/../backup`
        });

        // 加载配置
        const loadResult = await configManager.loadConfig();
        if (!loadResult.success) {
            throw new Error(`Failed to load configuration: ${loadResult.error}`);
        }

        if (loadResult.warnings && loadResult.warnings.length > 0) {
            loadResult.warnings.forEach(warning => logger.warn(warning));
        }

        // 创建并启动机器人
        const bot = new TelegramWelcomeBot(config, configManager, logger);
        
        // 设置信号处理
        setupSignalHandlers(bot, logger);

        // 启动健康检查服务器（如果在Heroku上）
        startHealthCheckServer(config, logger);

        // 启动机器人
        await bot.start();

        logger.info('✅ Telegram Welcome Bot started successfully!', {
            botToken: config.botToken.substring(0, 10) + '...',
            admins: config.adminIds,
            groups: Object.keys(configManager.getAllGroupConfigs()).length
        });

        console.log('🎉 Bot is now running!');
        console.log('📱 Add the bot to your groups and give it admin permissions');
        console.log('⚙️  Use /settings command to open the admin panel');
        console.log('🛑 Press Ctrl+C to stop\n');

        // 定期清理和维护任务
        if (!config.herokuMode) {
            setInterval(async () => {
                try {
                    // 清理旧日志
                    // 清理旧备份
                    await configManager.cleanupOldBackups(config.logRetentionDays);
                    
                    logger.debug('Maintenance tasks completed');
                } catch (error) {
                    logger.error('Maintenance task failed:', error);
                }
            }, config.backupInterval * 60 * 60 * 1000); // 转换为毫秒
        }

    } catch (error) {
        logger.error('Failed to start application:', error);
        console.error('❌ Application failed to start:', error);
        
        await logger.close();
        process.exit(1);
    }
}

/**
 * 显示版本信息
 */
function showVersion(): void {
    const packageJson = require('../package.json');
    console.log(`${packageJson.name} v${packageJson.version}`);
    console.log(`Node.js ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
    console.log(`
🤖 Telegram Welcome Bot

Usage: npm start

Environment Variables:
  BOT_TOKEN        Telegram bot token (required)
  ADMIN_IDS        Comma-separated admin user IDs (required)
  NODE_ENV         Environment (development/production)
  LOG_LEVEL        Logging level (error/warn/info/debug)
  PORT             Port for health check server
  
Commands:
  npm start        Start the bot
  npm run dev      Start in development mode
  npm run build    Build the application
  npm test         Run tests

Examples:
  BOT_TOKEN="123456:ABC..." ADMIN_IDS="12345,67890" npm start
  
For more information, visit:
  https://github.com/yourusername/telegram-welcome-bot
`);
}

// 处理命令行参数
const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

// 启动应用
if (require.main === module) {
    main().catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

export { main, getAppConfig, validateEnvironment };