/**
 * 数据验证工具类
 */

import Joi from 'joi';
import { ValidationResult, WelcomeConfig, LinkButton } from '@/types/Config';
import { ConfigValidationOptions } from '@/config/types';
import { VALIDATION_RULES } from '@/config/DefaultConfig';

export class ValidationUtils {
    // Joi schemas
    private static linkButtonSchema = Joi.object({
        text: Joi.string()
            .min(VALIDATION_RULES.LINK_TEXT_LENGTH.min)
            .max(VALIDATION_RULES.LINK_TEXT_LENGTH.max)
            .required()
            .messages({
                'string.min': VALIDATION_RULES.LINK_TEXT_LENGTH.message,
                'string.max': VALIDATION_RULES.LINK_TEXT_LENGTH.message,
                'any.required': '链接文本不能为空'
            }),
        url: Joi.string()
            .pattern(VALIDATION_RULES.URL.pattern)
            .required()
            .messages({
                'string.pattern.base': VALIDATION_RULES.URL.message,
                'any.required': '链接URL不能为空'
            }),
        emoji: Joi.string()
            .pattern(VALIDATION_RULES.EMOJI.pattern)
            .optional()
            .allow('')
            .messages({
                'string.pattern.base': VALIDATION_RULES.EMOJI.message
            })
    });

    private static welcomeConfigSchema = Joi.object({
        welcomeText: Joi.string()
            .min(VALIDATION_RULES.TEXT_LENGTH.min)
            .max(VALIDATION_RULES.TEXT_LENGTH.max)
            .required()
            .messages({
                'string.min': VALIDATION_RULES.TEXT_LENGTH.message,
                'string.max': VALIDATION_RULES.TEXT_LENGTH.message,
                'any.required': '欢迎消息不能为空'
            }),
        imageUrl: Joi.string()
            .pattern(VALIDATION_RULES.URL.pattern)
            .required()
            .messages({
                'string.pattern.base': VALIDATION_RULES.URL.message,
                'any.required': '图片URL不能为空'
            }),
        links: Joi.array()
            .items(this.linkButtonSchema)
            .max(10)
            .required()
            .messages({
                'array.max': '链接数量不能超过10个'
            }),
        isEnabled: Joi.boolean().required(),
        autoDelete: Joi.boolean().optional(),
        welcomeDelay: Joi.number()
            .min(0)
            .max(300)
            .optional()
            .messages({
                'number.min': '延迟时间不能小于0秒',
                'number.max': '延迟时间不能超过300秒'
            }),
        lastUpdated: Joi.date().optional(),
        createdAt: Joi.date().optional()
    });

    /**
     * 验证欢迎配置
     */
    static validateWelcomeConfig(
        config: any, 
        options: ConfigValidationOptions = {}
    ): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 基础结构验证
        const { error } = this.welcomeConfigSchema.validate(config, { 
            abortEarly: false,
            allowUnknown: true
        });

        if (error) {
            errors.push(...error.details.map(detail => detail.message));
            return { isValid: false, errors, warnings };
        }

        // 自定义验证
        if (options.validateUrls) {
            // 验证图片URL可访问性（异步操作，这里只做格式检查）
            if (!this.isValidImageUrl(config.imageUrl)) {
                warnings.push('图片URL格式可能不正确或不支持');
            }

            // 验证链接URL
            for (const [index, link] of config.links.entries()) {
                if (!this.isValidUrl(link.url)) {
                    warnings.push(`链接 ${index + 1} 的URL格式可能不正确`);
                }
            }
        }

        // 检查欢迎消息是否包含用户名占位符
        if (!config.welcomeText.includes('{username}')) {
            warnings.push('欢迎消息中建议包含 {username} 占位符');
        }

        // 检查链接数量
        if (config.links.length === 0) {
            warnings.push('建议添加至少一个社交媒体链接');
        } else if (config.links.length > 8) {
            warnings.push('链接数量过多可能影响显示效果');
        }

        // 检查文本长度
        if (config.welcomeText.length > 1000) {
            warnings.push('欢迎消息过长可能影响显示效果');
        }

        // 检查重复链接
        const urls = config.links.map((link: LinkButton) => link.url);
        const uniqueUrls = new Set(urls);
        if (urls.length !== uniqueUrls.size) {
            warnings.push('检测到重复的链接URL');
        }

        // 检查链接文本重复
        const texts = config.links.map((link: LinkButton) => link.text);
        const uniqueTexts = new Set(texts);
        if (texts.length !== uniqueTexts.size) {
            warnings.push('检测到重复的链接文本');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证群组ID
     */
    static validateGroupId(groupId: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (groupId === 'default') {
            return { isValid: true, errors, warnings };
        }

        if (!VALIDATION_RULES.GROUP_ID.pattern.test(groupId)) {
            errors.push(VALIDATION_RULES.GROUP_ID.message);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证URL格式
     */
    static validateUrl(url: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!url) {
            errors.push('URL不能为空');
            return { isValid: false, errors, warnings };
        }

        if (!VALIDATION_RULES.URL.pattern.test(url)) {
            errors.push(VALIDATION_RULES.URL.message);
        }

        // 检查常见的不安全URL
        const suspiciousPatterns = [
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /file:/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(url)) {
                errors.push('URL包含不安全的协议');
                break;
            }
        }

        // 检查URL长度
        if (url.length > 2048) {
            warnings.push('URL过长可能导致显示问题');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证表情符号
     */
    static validateEmoji(emoji: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!emoji) {
            return { isValid: true, errors, warnings }; // 表情符号是可选的
        }

        if (!VALIDATION_RULES.EMOJI.pattern.test(emoji)) {
            errors.push(VALIDATION_RULES.EMOJI.message);
        }

        // 检查表情符号长度（可能是组合表情符号）
        if (emoji.length > 8) {
            warnings.push('表情符号过长可能影响显示效果');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证链接按钮
     */
    static validateLinkButton(link: any): ValidationResult {
        const { error } = this.linkButtonSchema.validate(link, { abortEarly: false });
        
        if (error) {
            return {
                isValid: false,
                errors: error.details.map(detail => detail.message),
                warnings: []
            };
        }

        const warnings: string[] = [];

        // 额外检查
        if (link.text.length > 20) {
            warnings.push('链接文本过长可能影响按钮显示');
        }

        return {
            isValid: true,
            errors: [],
            warnings
        };
    }

    /**
     * 验证配置JSON格式
     */
    static validateConfigJson(jsonString: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const config = JSON.parse(jsonString);
            
            if (typeof config !== 'object' || config === null) {
                errors.push('配置必须是一个有效的JSON对象');
                return { isValid: false, errors, warnings };
            }

            // 检查基本结构
            if (!config.config && !config.default) {
                warnings.push('配置格式可能不正确，缺少必要的字段');
            }

            return { isValid: true, errors, warnings };
        } catch (error) {
            errors.push(`JSON格式错误: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { isValid: false, errors, warnings };
        }
    }

    /**
     * 验证文件大小
     */
    static validateFileSize(size: number, maxSize: number): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (size > maxSize) {
            errors.push(`文件大小超过限制 (${this.formatFileSize(maxSize)})`);
        } else if (size > maxSize * 0.8) {
            warnings.push('文件大小接近限制，建议压缩');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证用户权限
     */
    static validateUserPermissions(userId: string, adminIds: string[]): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!adminIds.includes(userId)) {
            errors.push('用户没有管理员权限');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 批量验证配置
     */
    static validateMultipleConfigs(configs: { [key: string]: any }): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        for (const [groupId, config] of Object.entries(configs)) {
            const groupValidation = this.validateGroupId(groupId);
            if (!groupValidation.isValid) {
                errors.push(`群组ID ${groupId}: ${groupValidation.errors.join(', ')}`);
            }

            const configValidation = this.validateWelcomeConfig(config);
            if (!configValidation.isValid) {
                errors.push(`群组 ${groupId} 配置: ${configValidation.errors.join(', ')}`);
            }
            warnings.push(...configValidation.warnings.map(w => `群组 ${groupId}: ${w}`));
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // 辅助方法
    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return VALIDATION_RULES.URL.pattern.test(url);
        } catch {
            return false;
        }
    }

    private static isValidImageUrl(url: string): boolean {
        if (!this.isValidUrl(url)) return false;
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const urlLower = url.toLowerCase();
        
        return imageExtensions.some(ext => urlLower.includes(ext)) || 
               urlLower.includes('image') || 
               urlLower.includes('photo') ||
               urlLower.includes('placeholder');
    }

    private static formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * 清理和规范化配置数据
     */
    static sanitizeWelcomeConfig(config: any): WelcomeConfig {
        return {
            welcomeText: String(config.welcomeText || '').trim(),
            imageUrl: String(config.imageUrl || '').trim(),
            links: Array.isArray(config.links) 
                ? config.links.map((link: any) => this.sanitizeLinkButton(link))
                : [],
            isEnabled: Boolean(config.isEnabled),
            autoDelete: Boolean(config.autoDelete),
            welcomeDelay: Math.max(0, Math.min(300, Number(config.welcomeDelay) || 0)),
            lastUpdated: config.lastUpdated ? new Date(config.lastUpdated) : new Date(),
            createdAt: config.createdAt ? new Date(config.createdAt) : new Date()
        };
    }

    /**
     * 清理和规范化链接按钮数据
     */
    static sanitizeLinkButton(link: any): LinkButton {
        return {
            text: String(link.text || '').trim(),
            url: String(link.url || '').trim(),
            emoji: link.emoji ? String(link.emoji).trim() : undefined
        };
    }

    /**
     * 检查配置是否有重大变更
     */
    static hasSignificantChanges(oldConfig: WelcomeConfig, newConfig: WelcomeConfig): boolean {
        return (
            oldConfig.welcomeText !== newConfig.welcomeText ||
            oldConfig.imageUrl !== newConfig.imageUrl ||
            oldConfig.isEnabled !== newConfig.isEnabled ||
            JSON.stringify(oldConfig.links) !== JSON.stringify(newConfig.links)
        );
    }

    /**
     * 生成配置摘要
     */
    static generateConfigSummary(config: WelcomeConfig): string {
        const status = config.isEnabled ? '启用' : '禁用';
        const linkCount = config.links.length;
        const textLength = config.welcomeText.length;
        
        return `状态: ${status}, 链接数: ${linkCount}, 消息长度: ${textLength}字符`;
    }

    /**
     * 检查配置完整性
     */
    static checkConfigIntegrity(config: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 检查必需字段
        const requiredFields = ['welcomeText', 'imageUrl', 'links', 'isEnabled'];
        for (const field of requiredFields) {
            if (!(field in config)) {
                errors.push(`缺少必需字段: ${field}`);
            }
        }

        // 检查数据类型
        if (config.welcomeText && typeof config.welcomeText !== 'string') {
            errors.push('欢迎消息必须是字符串类型');
        }

        if (config.imageUrl && typeof config.imageUrl !== 'string') {
            errors.push('图片URL必须是字符串类型');
        }

        if (config.links && !Array.isArray(config.links)) {
            errors.push('链接列表必须是数组类型');
        }

        if (config.isEnabled !== undefined && typeof config.isEnabled !== 'boolean') {
            errors.push('启用状态必须是布尔类型');
        }

        // 检查可选字段类型
        if (config.autoDelete !== undefined && typeof config.autoDelete !== 'boolean') {
            warnings.push('自动删除设置应为布尔类型');
        }

        if (config.welcomeDelay !== undefined && typeof config.welcomeDelay !== 'number') {
            warnings.push('欢迎延迟应为数字类型');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证管理员权限级别
     */
    static validateAdminLevel(userId: string, requiredLevel: 'admin' | 'super_admin', adminConfig: any): boolean {
        if (!adminConfig || !adminConfig[userId]) {
            return false;
        }

        const userLevel = adminConfig[userId].level;
        
        if (requiredLevel === 'super_admin') {
            return userLevel === 'super_admin';
        }
        
        return userLevel === 'admin' || userLevel === 'super_admin';
    }

    /**
     * 验证操作频率限制
     */
    static validateRateLimit(
        userId: string, 
        operation: string, 
        rateLimitData: Map<string, number[]>,
        windowMs: number,
        maxRequests: number
    ): ValidationResult {
        const now = Date.now();
        const key = `${userId}:${operation}`;
        const requests = rateLimitData.get(key) || [];
        
        // 清理过期请求
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
        
        if (validRequests.length >= maxRequests) {
            return {
                isValid: false,
                errors: [`操作过于频繁，请 ${Math.ceil(windowMs / 1000)} 秒后重试`],
                warnings: []
            };
        }

        // 更新请求记录
        validRequests.push(now);
        rateLimitData.set(key, validRequests);

        return {
            isValid: true,
            errors: [],
            warnings: validRequests.length > maxRequests * 0.8 ? ['接近操作频率限制'] : []
        };
    }
}