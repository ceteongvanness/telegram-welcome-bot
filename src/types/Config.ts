/**
 * 配置相关的类型定义
 */

export interface LinkButton {
    /** 按钮显示文本 */
    text: string;
    /** 链接URL */
    url: string;
    /** 表情符号 */
    emoji?: string;
}

export interface WelcomeConfig {
    /** 欢迎消息文本 */
    welcomeText: string;
    /** 欢迎图片URL */
    imageUrl: string;
    /** 链接按钮列表 */
    links: LinkButton[];
    /** 是否启用欢迎功能 */
    isEnabled: boolean;
    /** 自动删除欢迎消息 */
    autoDelete?: boolean;
    /** 欢迎消息发送延迟(秒) */
    welcomeDelay?: number;
    /** 最后更新时间 */
    lastUpdated?: Date;
    /** 创建时间 */
    createdAt?: Date;
}

export interface GroupConfig {
    /** 群组ID作为键，配置作为值 */
    [groupId: string]: WelcomeConfig;
}

export interface BotStats {
    /** 总处理的新成员数量 */
    totalWelcomes: number;
    /** 活跃群组数量 */
    activeGroups: number;
    /** 机器人启动时间 */
    startTime: Date;
    /** 最后活动时间 */
    lastActivity: Date;
    /** 错误计数 */
    errorCount: number;
    /** 按群组统计 */
    groupStats: {
        [groupId: string]: {
            welcomeCount: number;
            lastWelcome: Date;
            errorCount: number;
        };
    };
}

export interface AppConfig {
    /** 机器人Token */
    botToken: string;
    /** 管理员ID列表 */
    adminIds: string[];
    /** 环境 */
    nodeEnv: string;
    /** 端口 */
    port: number;
    /** 日志级别 */
    logLevel: string;
    /** 日志目录 */
    logDir: string;
    /** 配置文件路径 */
    configPath: string;
    /** 上传目录 */
    uploadDir: string;
    /** 最大文件大小 */
    maxFileSize: number;
    /** 备份间隔 */
    backupInterval: number;
    /** 日志保留天数 */
    logRetentionDays: number;
    /** 最大群组数量 */
    maxGroups: number;
    /** 默认欢迎延迟 */
    defaultWelcomeDelay: number;
    /** 并发限制 */
    concurrentLimit: number;
    /** 请求超时 */
    requestTimeout: number;
    /** 最大重试次数 */
    maxRetries: number;
    /** 会话超时 */
    sessionTimeout: number;
    /** 最大管理员数量 */
    maxAdmins: number;
    /** 调试模式 */
    debugMode: boolean;
    /** Heroku模式 */
    herokuMode: boolean;
    /** 健康检查间隔 */
    healthCheckInterval: number;
    /** 统计数据保留天数 */
    statsRetentionDays: number;
    /** 启用性能监控 */
    enableMetrics: boolean;
}

export interface ValidationResult {
    /** 是否有效 */
    isValid: boolean;
    /** 错误消息列表 */
    errors: string[];
    /** 警告消息列表 */
    warnings: string[];
}

export interface BackupInfo {
    /** 备份文件名 */
    filename: string;
    /** 备份时间 */
    timestamp: Date;
    /** 文件大小(字节) */
    size: number;
    /** 备份类型 */
    type: 'manual' | 'auto';
    /** 备份状态 */
    status: 'success' | 'failed' | 'partial';
    /** 包含的群组数量 */
    groupCount: number;
}

export interface ConfigSnapshot {
    /** 配置内容 */
    config: GroupConfig;
    /** 快照时间 */
    timestamp: Date;
    /** 版本号 */
    version: string;
    /** 快照原因 */
    reason: string;
    /** 创建者 */
    createdBy: string;
}