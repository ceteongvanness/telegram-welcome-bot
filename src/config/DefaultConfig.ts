/**
 * 默认配置定义
 */

import { WelcomeConfig, AppConfig, SessionConfig } from '@/types/Config';

export const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
    welcomeText: `🎉 欢迎 {username} 加入我们的群组！

🌟 很高兴你的到来！

📱 请关注我们的社交媒体获取最新消息：

❓ 如果有任何问题，请随时询问！`,
    imageUrl: 'https://via.placeholder.com/800x400/4CAF50/white?text=Welcome+to+Our+Group',
    links: [
        {
            text: 'Twitter',
            url: 'https://twitter.com/yourhandle',
            emoji: '🐦'
        },
        {
            text: 'YouTube',
            url: 'https://youtube.com/yourchannel',
            emoji: '📺'
        },
        {
            text: '官网',
            url: 'https://yourwebsite.com',
            emoji: '🌐'
        },
        {
            text: 'Discord',
            url: 'https://discord.gg/yourserver',
            emoji: '💬'
        }
    ],
    isEnabled: true,
    autoDelete: false,
    welcomeDelay: 0,
    lastUpdated: new Date(),
    createdAt: new Date()
};

export const DEFAULT_APP_CONFIG: Partial<AppConfig> = {
    nodeEnv: 'development',
    port: 3000,
    logLevel: 'info',
    logDir: './logs',
    configPath: './config/bot_config.json',
    uploadDir: './uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    backupInterval: 24, // hours
    logRetentionDays: 30,
    maxGroups: 100,
    defaultWelcomeDelay: 0,
    concurrentLimit: 10,
    requestTimeout: 30000,
    maxRetries: 3,
    sessionTimeout: 30, // minutes
    maxAdmins: 10,
    debugMode: false,
    herokuMode: false,
    healthCheckInterval: 60, // seconds
    statsRetentionDays: 90,
    enableMetrics: true
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
    defaultTimeout: 30, // minutes
    maxConcurrentSessions: 100,
    cleanupInterval: 5, // minutes
    persistSessions: false,
    sessionStoragePath: './config/sessions.json'
};

export const COMMAND_DESCRIPTIONS = {
    start: '启动机器人并显示欢迎信息',
    help: '显示帮助信息和可用命令',
    settings: '打开管理员设置面板',
    setup: '设置当前群组的欢迎配置',
    test: '测试当前群组的欢迎消息',
    stats: '查看机器人使用统计',
    backup: '创建配置备份',
    restore: '恢复配置备份',
    export: '导出群组配置',
    import: '导入群组配置',
    reset: '重置群组配置为默认值',
    status: '查看机器人运行状态',
    version: '显示机器人版本信息'
};

export const ERROR_MESSAGES = {
    UNAUTHORIZED: '❌ 您没有权限执行此操作',
    INVALID_CONFIG: '❌ 配置格式不正确',
    FILE_TOO_LARGE: '❌ 文件大小超过限制',
    INVALID_URL: '❌ 请输入有效的URL地址',
    INVALID_GROUP_ID: '❌ 请输入有效的群组ID',
    CONFIG_NOT_FOUND: '❌ 未找到配置文件',
    BACKUP_FAILED: '❌ 备份创建失败',
    RESTORE_FAILED: '❌ 配置恢复失败',
    NETWORK_ERROR: '❌ 网络连接错误，请稍后重试',
    BOT_TOKEN_INVALID: '❌ 机器人Token无效',
    PERMISSION_DENIED: '❌ 机器人权限不足',
    GROUP_NOT_FOUND: '❌ 未找到群组配置',
    SESSION_EXPIRED: '❌ 会话已过期，请重新开始',
    TOO_MANY_REQUESTS: '❌ 请求过于频繁，请稍后重试',
    INTERNAL_ERROR: '❌ 内部错误，请联系管理员'
};

export const SUCCESS_MESSAGES = {
    CONFIG_SAVED: '✅ 配置已保存',
    CONFIG_RESET: '✅ 配置已重置为默认值',
    BACKUP_CREATED: '✅ 备份已创建',
    CONFIG_RESTORED: '✅ 配置已恢复',
    CONFIG_EXPORTED: '✅ 配置已导出',
    CONFIG_IMPORTED: '✅ 配置已导入',
    GROUP_ADDED: '✅ 群组配置已添加',
    GROUP_DELETED: '✅ 群组配置已删除',
    LINK_ADDED: '✅ 链接已添加',
    LINK_UPDATED: '✅ 链接已更新',
    LINK_DELETED: '✅ 链接已删除',
    IMAGE_UPDATED: '✅ 欢迎图片已更新',
    TEXT_UPDATED: '✅ 欢迎消息已更新',
    SETTINGS_UPDATED: '✅ 设置已更新'
};

export const MENU_TEXTS = {
    MAIN_MENU: {
        title: '🤖 欢迎机器人设置面板',
        description: '选择要更改的项目：'
    },
    GROUP_MENU: {
        title: '🏠 群组设置管理',
        description: '点击群组进行详细设置：'
    },
    LINK_MENU: {
        title: '🔗 链接管理',
        description: '当前链接：'
    },
    ADVANCED_MENU: {
        title: '⚙️ 高级设置',
        description: '配置高级功能：'
    },
    STATS_MENU: {
        title: '📊 统计信息',
        description: '机器人使用统计：'
    }
};

export const BUTTON_TEXTS = {
    // 主菜单按钮
    GROUP_SETTINGS: '🏠 群组设置',
    WELCOME_MESSAGE: '📝 欢迎消息',
    WELCOME_IMAGE: '🖼️ 欢迎图片',
    LINK_MANAGEMENT: '🔗 链接管理',
    ADVANCED_SETTINGS: '⚙️ 高级设置',
    TEST_MESSAGE: '🧪 测试消息',
    STATISTICS: '📊 统计信息',
    DONE_SETTINGS: '✅ 完成设置',
    
    // 群组管理按钮
    ADD_GROUP: '➕ 新建群组配置',
    COPY_CONFIG: '📋 复制配置',
    DELETE_GROUP: '🗑️ 删除配置',
    
    // 链接管理按钮
    ADD_LINK: '➕ 添加链接',
    EDIT_LINK: '📝 编辑',
    DELETE_LINK: '🗑️ 删除',
    
    // 通用按钮
    BACK: '⬅️ 返回',
    CANCEL: '❌ 取消',
    CONFIRM: '✅ 确认',
    SAVE: '💾 保存',
    RESET: '🔄 重置',
    
    // 功能按钮
    ENABLE: '✅ 启用',
    DISABLE: '❌ 禁用',
    EDIT: '📝 编辑',
    DELETE: '🗑️ 删除',
    COPY: '📋 复制',
    EXPORT: '📤 导出',
    IMPORT: '📥 导入',
    BACKUP: '💾 备份',
    RESTORE: '🔄 恢复'
};

export const VALIDATION_RULES = {
    URL: {
        pattern: /^https?:\/\/[^\s$.?#].[^\s]*$/,
        message: '请输入有效的HTTP或HTTPS URL'
    },
    GROUP_ID: {
        pattern: /^-100\d{10,}$/,
        message: '群组ID必须以-100开头且为数字'
    },
    EMOJI: {
        pattern: /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u,
        message: '请输入有效的表情符号'
    },
    TEXT_LENGTH: {
        min: 1,
        max: 4096,
        message: '文本长度必须在1-4096字符之间'
    },
    LINK_TEXT_LENGTH: {
        min: 1,
        max: 64,
        message: '链接文本长度必须在1-64字符之间'
    }
};

export const FILE_CONSTRAINTS = {
    IMAGE: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    CONFIG: {
        maxSize: 1 * 1024 * 1024, // 1MB
        allowedExtensions: ['.json'],
        allowedMimeTypes: ['application/json', 'text/plain']
    },
    BACKUP: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedExtensions: ['.json', '.zip'],
        allowedMimeTypes: ['application/json', 'application/zip', 'text/plain']
    }
};

export const RATE_LIMITS = {
    COMMANDS: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20
    },
    CONFIG_CHANGES: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5
    },
    FILE_UPLOADS: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 3
    }
};

export const FEATURE_FLAGS = {
    ENABLE_BACKUP: true,
    ENABLE_BULK_OPERATIONS: true,
    ENABLE_STATISTICS: true,
    ENABLE_FILE_UPLOAD: true,
    ENABLE_CONFIG_EXPORT: true,
    ENABLE_ADVANCED_SETTINGS: true,
    ENABLE_SESSION_PERSISTENCE: false,
    ENABLE_RATE_LIMITING: true,
    ENABLE_HEALTH_CHECK: true,
    ENABLE_METRICS_COLLECTION: true
};