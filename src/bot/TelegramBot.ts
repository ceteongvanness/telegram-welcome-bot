/**
 * 主机器人类
 */

import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { AppConfig, BotStats } from '@/types/Config';
import { BotContext, SessionData } from '@/types/Bot';
import { SessionData as ISessionData } from '@/types/Session';
import { Logger } from '@/utils/Logger';
import { ConfigManager } from '@/config/ConfigManager';
import { WelcomeHandler } from './handlers/WelcomeHandler';
import { AdminHandler } from './handlers/AdminHandler';
import { CallbackHandler } from './handlers/CallbackHandler';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { LoggingMiddleware } from './middleware/LoggingMiddleware';
import { COMMAND_DESCRIPTIONS, ERROR_MESSAGES } from '@/config/DefaultConfig';

export class TelegramWelcomeBot {
    private bot: Telegraf<BotContext>;
    private config: AppConfig;
    private configManager: ConfigManager;
    private logger: Logger;
    private welcomeHandler: WelcomeHandler;
    private adminHandler: AdminHandler;
    private callbackHandler: CallbackHandler;
    private authMiddleware: AuthMiddleware;
    private loggingMiddleware: LoggingMiddleware;
    private stats: BotStats;
    private sessions: Map<string, ISessionData> = new Map();
    private isRunning = false;

    constructor(
        config: AppConfig,
        configManager: ConfigManager,
        logger: Logger
    ) {
        this.config = config;
        this.configManager = configManager;
        this.logger = logger;

        // 初始化统计数据
        this.stats = {
            totalWelcomes: 0,
            activeGroups: 0,
            startTime: new Date(),
            lastActivity: new Date(),
            errorCount: 0,
            groupStats: {}
        };

        // 创建机器人实例
        this.bot = new Telegraf<BotContext>(config.botToken);

        // 初始化中间件
        this.authMiddleware = new AuthMiddleware(config.adminIds, logger);
        this.loggingMiddleware = new LoggingMiddleware(logger);

        // 初始化处理器
        this.welcomeHandler = new WelcomeHandler(configManager, logger, this.stats);
        this.adminHandler = new AdminHandler(configManager, logger, this.sessions);
        this.callbackHandler = new CallbackHandler(configManager, logger, this.sessions);

        this.setupMiddleware();
        this.setupHandlers();
        this.setupErrorHandling();
    }

    /**
     * 设置中间件
     */
    private setupMiddleware(): void {
        // 日志中间件
        this.bot.use(this.loggingMiddleware.middleware());

        // 会话数据中间件
        this.bot.use((ctx: BotContext, next) => {
            ctx.session = this.getOrCreateSession(ctx.from?.id.toString() || '');
            ctx.requestTimestamp = Date.now();
            return next();
        });

        // 更新活动时间
        this.bot.use((ctx: BotContext, next) => {
            this.stats.lastActivity = new Date();
            return next();
        });
    }

    /**
     * 设置命令和事件处理器
     */
    private setupHandlers(): void {
        // 启动命令
        this.bot.start(async (ctx: BotContext) => {
            const isAdmin = this.authMiddleware.isAdmin(ctx.from?.id.toString() || '');
            
            if (isAdmin) {
                await ctx.reply(
                    '👋 欢迎使用群组欢迎机器人管理面板！\n\n' +
                    '🎮 **可用命令：**\n' +
                    '• /settings - 打开设置面板\n' +
                    '• /setup - 设置当前群组\n' +
                    '• /test - 测试欢迎消息\n' +
                    '• /stats - 查看统计信息\n' +
                    '• /help - 查看帮助信息\n\n' +
                    '📱 将机器人添加到群组并给予管理员权限即可开始使用！',
                    { parse_mode: 'Markdown' }
                );
            } else {
                await ctx.reply(
                    '👋 你好！我是群组欢迎机器人。\n\n' +
                    '我可以为群组新成员发送个性化的欢迎消息，包括欢迎图片和快捷链接。\n\n' +
                    '请联系管理员将我添加到群组中！'
                );
            }

            this.logger.logUserAction(
                ctx.from?.id.toString() || 'unknown',
                'start_command',
                { isAdmin, chatType: ctx.chat?.type }
            );
        });

        // 帮助命令
        this.bot.help(async (ctx: BotContext) => {
            const isAdmin = this.authMiddleware.isAdmin(ctx.from?.id.toString() || '');
            
            if (isAdmin) {
                let helpText = '📚 **管理员帮助**\n\n';
                
                Object.entries(COMMAND_DESCRIPTIONS).forEach(([command, description]) => {
                    helpText += `• /${command} - ${description}\n`;
                });

                helpText += '\n💡 **使用提示：**\n';
                helpText += '• 在群组中使用 /setup 快速配置\n';
                helpText += '• 使用 /test 预览欢迎消息效果\n';
                helpText += '• 设置面板支持实时预览和编辑\n\n';
                helpText += '❓ 需要更多帮助？查看项目文档或联系技术支持。';

                await ctx.reply(helpText, { parse_mode: 'Markdown' });
            } else {
                await ctx.reply(
                    '📚 **机器人功能说明**\n\n' +
                    '🎉 自动欢迎新成员\n' +
                    '🖼️ 发送欢迎图片\n' +
                    '🔗 提供快捷链接按钮\n' +
                    '⚙️ 支持个性化配置\n\n' +
                    '如需了解更多信息，请联系群组管理员。'
                );
            }
        });

        // 管理员命令
        this.bot.command('settings', this.authMiddleware.adminOnly(), 
            this.adminHandler.handleSettingsCommand.bind(this.adminHandler)
        );

        this.bot.command('setup', this.authMiddleware.adminOnly(),
            this.adminHandler.handleSetupCommand.bind(this.adminHandler)
        );

        this.bot.command('test', this.authMiddleware.adminOnly(),
            this.adminHandler.handleTestCommand.bind(this.adminHandler)
        );

        this.bot.command('stats', this.authMiddleware.adminOnly(),
            this.adminHandler.handleStatsCommand.bind(this.adminHandler)
        );

        this.bot.command('backup', this.authMiddleware.adminOnly(),
            this.adminHandler.handleBackupCommand.bind(this.adminHandler)
        );

        this.bot.command('restore', this.authMiddleware.adminOnly(),
            this.adminHandler.handleRestoreCommand.bind(this.adminHandler)
        );

        this.bot.command('export', this.authMiddleware.adminOnly(),
            this.adminHandler.handleExportCommand.bind(this.adminHandler)
        );

        this.bot.command('import', this.authMiddleware.adminOnly(),
            this.adminHandler.handleImportCommand.bind(this.adminHandler)
        );

        this.bot.command('reset', this.authMiddleware.adminOnly(),
            this.adminHandler.handleResetCommand.bind(this.adminHandler)
        );

        this.bot.command('status', this.authMiddleware.adminOnly(),
            this.adminHandler.handleStatusCommand.bind(this.adminHandler)
        );

        this.bot.command('version', async (ctx: BotContext) => {
            const packageJson = require('../../package.json');
            await ctx.reply(
                `🤖 **${packageJson.name}**\n` +
                `📦 版本: ${packageJson.version}\n` +
                `🚀 Node.js: ${process.version}\n` +
                `⚡ 运行时间: ${this.formatUptime(process.uptime())}\n` +
                `📊 已处理欢迎: ${this.stats.totalWelcomes} 次`,
                { parse_mode: 'Markdown' }
            );
        });

        // 新成员加入事件
        this.bot.on('new_chat_members', this.welcomeHandler.handleNewMembers.bind(this.welcomeHandler));

        // 成员离开事件
        this.bot.on('left_chat_member', this.welcomeHandler.handleMemberLeft.bind(this.welcomeHandler));

        // 回调查询处理
        this.bot.on('callback_query', this.authMiddleware.adminOnly(),
            this.callbackHandler.handleCallbackQuery.bind(this.callbackHandler)
        );

        // 文本消息处理（用于配置编辑）
        this.bot.on('text', this.authMiddleware.adminOnly(),
            this.adminHandler.handleTextInput.bind(this.adminHandler)
        );

        // 群组标题更新
        this.bot.on('new_chat_title', async (ctx: BotContext) => {
            this.logger.logBotEvent('group_title_changed', {
                chatId: ctx.chat?.id,
                newTitle: (ctx.message as any).new_chat_title,
                changedBy: ctx.from?.id
            });
        });

        // 群组头像更新
        this.bot.on('new_chat_photo', async (ctx: BotContext) => {
            this.logger.logBotEvent('group_photo_changed', {
                chatId: ctx.chat?.id,
                changedBy: ctx.from?.id
            });
        });

        // 机器人被添加到群组
        this.bot.on('my_chat_member', async (ctx: BotContext) => {
            const update = ctx.update as any;
            const myChatMember = update.my_chat_member;
            
            if (myChatMember.new_chat_member.status === 'member' || 
                myChatMember.new_chat_member.status === 'administrator') {
                
                this.logger.logBotEvent('bot_added_to_group', {
                    chatId: ctx.chat?.id,
                    chatTitle: ctx.chat?.title,
                    addedBy: ctx.from?.id,
                    status: myChatMember.new_chat_member.status
                });

                // 发送设置提示（如果添加者是管理员）
                if (this.authMiddleware.isAdmin(ctx.from?.id.toString() || '')) {
                    try {
                        await ctx.reply(
                            '🎉 感谢将我添加到群组！\n\n' +
                            '⚙️ 使用 /setup 命令配置欢迎消息\n' +
                            '🧪 使用 /test 命令测试效果\n\n' +
                            '💡 确保给我管理员权限以正常工作！'
                        );
                    } catch (error) {
                        this.logger.warn('Failed to send welcome message to new group', error);
                    }
                }
            }
        });
    }

    /**
     * 设置错误处理
     */
    private setupErrorHandling(): void {
        this.bot.catch(async (err: any, ctx: BotContext) => {
            this.stats.errorCount++;
            
            this.logger.logTelegramError(err, {
                updateType: ctx.updateType,
                chatId: ctx.chat?.id,
                userId: ctx.from?.id,
                messageText: (ctx.message as any)?.text
            });

            // 向用户发送友好的错误消息
            try {
                if (err.code === 403) {
                    // 机器人被封禁或踢出
                    this.logger.warn('Bot was blocked or removed from chat', {
                        chatId: ctx.chat?.id,
                        error: err
                    });
                } else if (err.code === 429) {
                    // 请求过于频繁
                    await ctx.reply(ERROR_MESSAGES.TOO_MANY_REQUESTS);
                } else if (err.code === 400) {
                    // 请求格式错误
                    await ctx.reply(ERROR_MESSAGES.INVALID_CONFIG);
                } else {
                    // 其他错误
                    if (this.authMiddleware.isAdmin(ctx.from?.id.toString() || '')) {
                        await ctx.reply(
                            `${ERROR_MESSAGES.INTERNAL_ERROR}\n\n` +
                            `错误详情: ${err.message || 'Unknown error'}`
                        );
                    } else {
                        await ctx.reply(ERROR_MESSAGES.INTERNAL_ERROR);
                    }
                }
            } catch (replyError) {
                this.logger.error('Failed to send error message to user', replyError);
            }
        });
    }

    /**
     * 获取或创建用户会话
     */
    private getOrCreateSession(userId: string): ISessionData {
        if (!this.sessions.has(userId)) {
            const session: ISessionData = {
                userId,
                state: 'idle',
                tempData: {},
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + this.config.sessionTimeout * 60 * 1000)
            };
            this.sessions.set(userId, session);
        }

        const session = this.sessions.get(userId)!;
        session.lastActivity = new Date();
        
        return session;
    }

    /**
     * 清理过期会话
     */
    private cleanupExpiredSessions(): void {
        const now = new Date();
        const expiredSessions = [];

        for (const [userId, session] of this.sessions.entries()) {
            if (session.expiresAt < now) {
                expiredSessions.push(userId);
            }
        }

        for (const userId of expiredSessions) {
            this.sessions.delete(userId);
        }

        if (expiredSessions.length > 0) {
            this.logger.debug(`Cleaned up ${expiredSessions.length} expired sessions`);
        }
    }

    /**
     * 格式化运行时间
     */
    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}天 ${hours}小时 ${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else {
            return `${minutes}分钟`;
        }
    }

    /**
     * 获取机器人统计信息
     */
    public getStats(): BotStats {
        const groupConfigs = this.configManager.getAllGroupConfigs();
        this.stats.activeGroups = Object.keys(groupConfigs).length;
        
        return { ...this.stats };
    }

    /**
     * 启动机器人
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Bot is already running');
        }

        try {
            this.logger.info('Starting Telegram bot...');

            // 获取机器人信息
            const botInfo = await this.bot.telegram.getMe();
            this.logger.info('Bot info retrieved', {
                id: botInfo.id,
                username: botInfo.username,
                firstName: botInfo.first_name
            });

            // 设置机器人命令
            await this.setBotCommands();

            // 启动机器人
            await this.bot.launch({
                webhook: this.config.herokuMode ? {
                    domain: process.env.HEROKU_APP_NAME 
                        ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`
                        : undefined,
                    port: this.config.port
                } : undefined
            });

            this.isRunning = true;

            // 启动定期清理任务
            const cleanupInterval = setInterval(() => {
                this.cleanupExpiredSessions();
            }, 5 * 60 * 1000); // 每5分钟清理一次

            // 在停止时清理定时器
            this.bot.stop = async (...args: any[]) => {
                clearInterval(cleanupInterval);
                return (Telegraf.prototype.stop as any).apply(this.bot, args);
            };

            this.logger.info('Bot started successfully');

        } catch (error) {
            this.logger.error('Failed to start bot', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * 停止机器人
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            this.logger.info('Stopping Telegram bot...');
            
            await this.bot.stop();
            this.isRunning = false;
            
            this.logger.info('Bot stopped successfully');
        } catch (error) {
            this.logger.error('Error stopping bot', error);
            throw error;
        }
    }

    /**
     * 设置机器人命令菜单
     */
    private async setBotCommands(): Promise<void> {
        try {
            const commands = [
                { command: 'start', description: '启动机器人' },
                { command: 'help', description: '查看帮助信息' },
                { command: 'settings', description: '打开管理员设置面板' },
                { command: 'setup', description: '设置当前群组' },
                { command: 'test', description: '测试欢迎消息' },
                { command: 'stats', description: '查看统计信息' },
                { command: 'status', description: '查看机器人状态' },
                { command: 'version', description: '查看版本信息' }
            ];

            await this.bot.telegram.setMyCommands(commands);
            this.logger.info('Bot commands set successfully');
        } catch (error) {
            this.logger.error('Failed to set bot commands', error);
        }
    }

    /**
     * 获取机器人实例（用于测试）
     */
    public getBot(): Telegraf<BotContext> {
        return this.bot;
    }

    /**
     * 检查机器人是否正在运行
     */
    public isRunningBot(): boolean {
        return this.isRunning;
    }

    /**
     * 重新加载配置
     */
    public async reloadConfig(): Promise<void> {
        try {
            const result = await this.configManager.loadConfig();
            if (result.success) {
                this.logger.info('Configuration reloaded successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.logger.error('Failed to reload configuration', error);
            throw error;
        }
    }

    /**
     * 获取会话信息
     */
    public getSessionInfo(): { active: number; total: number } {
        const now = new Date();
        let activeCount = 0;

        for (const session of this.sessions.values()) {
            if (session.expiresAt > now) {
                activeCount++;
            }
        }

        return {
            active: activeCount,
            total: this.sessions.size
        };
    }

    /**
     * 清除所有会话
     */
    public clearAllSessions(): void {
        this.sessions.clear();
        this.logger.info('All sessions cleared');
    }

    /**
     * 获取健康状态
     */
    public getHealthStatus(): any {
        const sessionInfo = this.getSessionInfo();
        const stats = this.getStats();

        return {
            status: this.isRunning ? 'healthy' : 'unhealthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            bot: {
                running: this.isRunning,
                totalWelcomes: stats.totalWelcomes,
                activeGroups: stats.activeGroups,
                errorCount: stats.errorCount,
                lastActivity: stats.lastActivity
            },
            sessions: sessionInfo,
            timestamp: new Date().toISOString()
        };
    }
}