/**
 * 配置管理器
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { 
    GroupConfig, 
    WelcomeConfig, 
    ValidationResult, 
    BackupInfo,
    ConfigSnapshot,
    AppConfig
} from '@/types/Config';
import { 
    ConfigValidationOptions, 
    ConfigOperationResult, 
    ConfigHistory, 
    ConfigDiff 
} from './types';
import { DEFAULT_WELCOME_CONFIG } from './DefaultConfig';
import { Logger } from '@/utils/Logger';
import { ValidationUtils } from '@/utils/ValidationUtils';
import { FileUtils } from '@/utils/FileUtils';

export class ConfigManager extends EventEmitter {
    private config: GroupConfig = {};
    private configPath: string;
    private backupDir: string;
    private historyPath: string;
    private logger: Logger;
    private isLoading = false;
    private autoSave = true;
    private configHistory: ConfigHistory[] = [];

    constructor(
        configPath: string,
        logger: Logger,
        options: { autoSave?: boolean; backupDir?: string } = {}
    ) {
        super();
        this.configPath = configPath;
        this.logger = logger;
        this.autoSave = options.autoSave ?? true;
        this.backupDir = options.backupDir ?? path.join(path.dirname(configPath), 'backup');
        this.historyPath = path.join(path.dirname(configPath), 'config_history.json');
        
        this.initializeDirectories();
        this.loadHistory();
    }

    /**
     * 初始化目录
     */
    private async initializeDirectories(): Promise<void> {
        try {
            await FileUtils.ensureDirectory(path.dirname(this.configPath));
            await FileUtils.ensureDirectory(this.backupDir);
        } catch (error) {
            this.logger.error('Failed to initialize directories', error);
        }
    }

    /**
     * 加载配置历史
     */
    private async loadHistory(): Promise<void> {
        try {
            if (await FileUtils.fileExists(this.historyPath)) {
                const historyData = await fs.readFile(this.historyPath, 'utf8');
                this.configHistory = JSON.parse(historyData);
            }
        } catch (error) {
            this.logger.warn('Failed to load config history', error);
            this.configHistory = [];
        }
    }

    /**
     * 保存配置历史
     */
    private async saveHistory(): Promise<void> {
        try {
            // 保留最近100条记录
            if (this.configHistory.length > 100) {
                this.configHistory = this.configHistory.slice(-100);
            }
            
            await fs.writeFile(
                this.historyPath, 
                JSON.stringify(this.configHistory, null, 2), 
                'utf8'
            );
        } catch (error) {
            this.logger.error('Failed to save config history', error);
        }
    }

    /**
     * 添加历史记录
     */
    private addHistoryEntry(
        operation: ConfigHistory['operation'],
        changes: ConfigDiff[],
        changedBy: string,
        note?: string
    ): void {
        const entry: ConfigHistory = {
            timestamp: new Date(),
            operation,
            changedBy,
            changes,
            note
        };
        
        this.configHistory.push(entry);
        this.saveHistory();
    }

    /**
     * 加载配置
     */
    async loadConfig(): Promise<ConfigOperationResult> {
        if (this.isLoading) {
            return { success: false, error: '配置正在加载中' };
        }

        this.isLoading = true;

        try {
            if (await FileUtils.fileExists(this.configPath)) {
                const data = await fs.readFile(this.configPath, 'utf8');
                const parsed = JSON.parse(data);
                
                // 验证配置格式
                const validation = this.validateConfig(parsed);
                if (!validation.isValid) {
                    this.logger.warn('Invalid config format, using default', validation.errors);
                    this.config = { 'default': { ...DEFAULT_WELCOME_CONFIG } };
                    await this.saveConfig();
                    return { 
                        success: true, 
                        warnings: ['配置格式有误，已使用默认配置'] 
                    };
                }

                this.config = parsed;
                this.logger.info('Configuration loaded successfully');
                this.emit('configLoaded', this.config);
                
                return { success: true };
            } else {
                // 创建默认配置
                this.config = { 'default': { ...DEFAULT_WELCOME_CONFIG } };
                await this.saveConfig();
                this.logger.info('Created default configuration');
                
                return { success: true, warnings: ['已创建默认配置'] };
            }
        } catch (error) {
            this.logger.error('Failed to load configuration', error);
            this.config = { 'default': { ...DEFAULT_WELCOME_CONFIG } };
            
            return { 
                success: false, 
                error: `配置加载失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 保存配置
     */
    async saveConfig(changedBy = 'system', note?: string): Promise<ConfigOperationResult> {
        try {
            const configJson = JSON.stringify(this.config, null, 2);
            await fs.writeFile(this.configPath, configJson, 'utf8');
            
            this.logger.info('Configuration saved successfully');
            this.emit('configSaved', this.config);
            
            // 记录变更历史（简化版本）
            this.addHistoryEntry('update', [], changedBy, note);
            
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to save configuration', error);
            return { 
                success: false, 
                error: `配置保存失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    /**
     * 获取群组配置
     */
    getGroupConfig(groupId: string): WelcomeConfig {
        return this.config[groupId] || this.config['default'] || { ...DEFAULT_WELCOME_CONFIG };
    }

    /**
     * 设置群组配置
     */
    async setGroupConfig(
        groupId: string, 
        config: WelcomeConfig, 
        changedBy = 'system'
    ): Promise<ConfigOperationResult> {
        try {
            // 验证配置
            const validation = this.validateWelcomeConfig(config);
            if (!validation.isValid) {
                return { 
                    success: false, 
                    error: `配置验证失败: ${validation.errors.join(', ')}` 
                };
            }

            // 保存旧配置用于比较
            const oldConfig = this.config[groupId];
            
            // 更新配置
            this.config[groupId] = {
                ...config,
                lastUpdated: new Date()
            };

            if (this.autoSave) {
                const result = await this.saveConfig(changedBy, `更新群组 ${groupId} 配置`);
                if (!result.success) {
                    return result;
                }
            }

            this.emit('groupConfigChanged', groupId, config, oldConfig);
            this.logger.info(`Group config updated: ${groupId}`);
            
            return { 
                success: true, 
                warnings: validation.warnings 
            };
        } catch (error) {
            this.logger.error(`Failed to set group config: ${groupId}`, error);
            return { 
                success: false, 
                error: `设置配置失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    /**
     * 删除群组配置
     */
    async deleteGroupConfig(groupId: string, changedBy = 'system'): Promise<ConfigOperationResult> {
        if (groupId === 'default') {
            return { success: false, error: '无法删除默认配置' };
        }

        if (!this.config[groupId]) {
            return { success: false, error: '群组配置不存在' };
        }

        try {
            const oldConfig = this.config[groupId];
            delete this.config[groupId];

            if (this.autoSave) {
                const result = await this.saveConfig(changedBy, `删除群组 ${groupId} 配置`);
                if (!result.success) {
                    return result;
                }
            }

            this.emit('groupConfigDeleted', groupId, oldConfig);
            this.logger.info(`Group config deleted: ${groupId}`);
            
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to delete group config: ${groupId}`, error);
            return { 
                success: false, 
                error: `删除配置失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    /**
     * 获取所有群组配置
     */
    getAllGroupConfigs(): GroupConfig {
        return { ...this.config };
    }

    /**
     * 获取群组列表
     */
    getGroupList(): Array<{ id: string; name: string; enabled: boolean }> {
        return Object.keys(this.config).map(groupId => ({
            id: groupId,
            name: groupId === 'default' ? '默认配置' : `群组 ${groupId}`,
            enabled: this.config[groupId]?.isEnabled ?? false
        }));
    }

    /**
     * 验证整个配置
     */
    validateConfig(config: any, options: ConfigValidationOptions = {}): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!config || typeof config !== 'object') {
            errors.push('配置必须是一个对象');
            return { isValid: false, errors, warnings };
        }

        // 检查是否有default配置
        if (!config.default) {
            warnings.push('缺少默认配置，将自动创建');
        }

        // 验证每个群组配置
        for (const [groupId, groupConfig] of Object.entries(config)) {
            const validation = this.validateWelcomeConfig(groupConfig, options);
            if (!validation.isValid) {
                errors.push(`群组 ${groupId}: ${validation.errors.join(', ')}`);
            }
            warnings.push(...validation.warnings.map(w => `群组 ${groupId}: ${w}`));
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证欢迎配置
     */
    validateWelcomeConfig(config: any, options: ConfigValidationOptions = {}): ValidationResult {
        return ValidationUtils.validateWelcomeConfig(config, options);
    }

    /**
     * 创建配置备份
     */
    async createBackup(type: 'manual' | 'auto' = 'manual'): Promise<BackupInfo> {
        const timestamp = new Date();
        const filename = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
        const backupPath = path.join(this.backupDir, filename);

        try {
            const backupData = {
                version: '1.0.0',
                timestamp: timestamp.toISOString(),
                type,
                config: this.config,
                metadata: {
                    groupCount: Object.keys(this.config).length,
                    createdBy: 'ConfigManager'
                }
            };

            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
            
            const stats = await fs.stat(backupPath);
            
            const backupInfo: BackupInfo = {
                filename,
                timestamp,
                size: stats.size,
                type,
                status: 'success',
                groupCount: Object.keys(this.config).length
            };

            this.logger.info('Backup created successfully', { filename, size: stats.size });
            this.emit('backupCreated', backupInfo);
            
            return backupInfo;
        } catch (error) {
            this.logger.error('Failed to create backup', error);
            throw new Error(`备份创建失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 恢复配置备份
     */
    async restoreBackup(filename: string, changedBy = 'system'): Promise<ConfigOperationResult> {
        const backupPath = path.join(this.backupDir, filename);

        try {
            if (!await FileUtils.fileExists(backupPath)) {
                return { success: false, error: '备份文件不存在' };
            }

            const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
            
            if (!backupData.config) {
                return { success: false, error: '备份文件格式无效' };
            }

            // 验证备份配置
            const validation = this.validateConfig(backupData.config);
            if (!validation.isValid) {
                return { 
                    success: false, 
                    error: `备份配置验证失败: ${validation.errors.join(', ')}` 
                };
            }

            // 创建当前配置的备份
            await this.createBackup('auto');

            // 恢复配置
            this.config = backupData.config;
            const result = await this.saveConfig(changedBy, `从备份 ${filename} 恢复配置`);
            
            if (result.success) {
                this.emit('configRestored', filename, this.config);
                this.logger.info('Configuration restored from backup', { filename });
            }

            return result;
        } catch (error) {
            this.logger.error('Failed to restore backup', error);
            return { 
                success: false, 
                error: `恢复备份失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    /**
     * 获取备份列表
     */
    async getBackupList(): Promise<BackupInfo[]> {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups: BackupInfo[] = [];

            for (const filename of files) {
                if (!filename.endsWith('.json')) continue;

                try {
                    const filePath = path.join(this.backupDir, filename);
                    const stats = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(content);

                    backups.push({
                        filename,
                        timestamp: new Date(data.timestamp || stats.birthtime),
                        size: stats.size,
                        type: data.type || 'manual',
                        status: 'success',
                        groupCount: data.metadata?.groupCount || Object.keys(data.config || {}).length
                    });
                } catch (error) {
                    this.logger.warn(`Failed to read backup file: ${filename}`, error);
                }
            }

            return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        } catch (error) {
            this.logger.error('Failed to get backup list', error);
            return [];
        }
    }

    /**
     * 导出配置
     */
    async exportConfig(groupIds?: string[]): Promise<string> {
        try {
            const exportData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                exported_by: 'ConfigManager',
                config: groupIds 
                    ? Object.fromEntries(
                        Object.entries(this.config).filter(([id]) => groupIds.includes(id))
                    )
                    : this.config
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            this.logger.error('Failed to export config', error);
            throw new Error(`配置导出失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 导入配置
     */
    async importConfig(
        configData: string, 
        options: { merge?: boolean; overwrite?: boolean } = {},
        changedBy = 'system'
    ): Promise<ConfigOperationResult> {
        try {
            const importData = JSON.parse(configData);
            
            if (!importData.config) {
                return { success: false, error: '导入数据格式无效' };
            }

            // 验证导入的配置
            const validation = this.validateConfig(importData.config);
            if (!validation.isValid) {
                return { 
                    success: false, 
                    error: `导入配置验证失败: ${validation.errors.join(', ')}` 
                };
            }

            // 创建备份
            await this.createBackup('auto');

            if (options.merge) {
                // 合并配置
                this.config = { ...this.config, ...importData.config };
            } else {
                // 替换配置
                this.config = importData.config;
            }

            const result = await this.saveConfig(changedBy, '导入配置');
            
            if (result.success) {
                this.emit('configImported', importData.config);
                this.logger.info('Configuration imported successfully');
            }

            return {
                ...result,
                warnings: validation.warnings
            };
        } catch (error) {
            this.logger.error('Failed to import config', error);
            return { 
                success: false, 
                error: `配置导入失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    /**
     * 重置配置
     */
    async resetConfig(groupId?: string, changedBy = 'system'): Promise<ConfigOperationResult> {
        try {
            // 创建备份
            await this.createBackup('auto');

            if (groupId) {
                // 重置特定群组
                this.config[groupId] = { ...DEFAULT_WELCOME_CONFIG };
                this.logger.info(`Group config reset: ${groupId}`);
            } else {
                // 重置所有配置
                this.config = { 'default': { ...DEFAULT_WELCOME_CONFIG } };
                this.logger.info('All configurations reset to default');
            }

            const result = await this.saveConfig(
                changedBy, 
                groupId ? `重置群组 ${groupId} 配置` : '重置所有配置'
            );
            
            if (result.success) {
                this.emit('configReset', groupId);
            }

            return result;
        } catch (error) {
            this.logger.error('Failed to reset config', error);
            return { 
                success: false, 
                error: `配置重置失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    /**
     * 获取配置历史
     */
    getConfigHistory(limit = 50): ConfigHistory[] {
        return this.configHistory.slice(-limit).reverse();
    }

    /**
     * 创建配置快照
     */
    createSnapshot(reason: string, createdBy: string): ConfigSnapshot {
        return {
            config: { ...this.config },
            timestamp: new Date(),
            version: '1.0.0',
            reason,
            createdBy
        };
    }

    /**
     * 获取配置统计
     */
    getConfigStats() {
        const groups = Object.keys(this.config);
        const enabledGroups = groups.filter(id => this.config[id]?.isEnabled);
        const totalLinks = groups.reduce((sum, id) => 
            sum + (this.config[id]?.links?.length || 0), 0
        );

        return {
            totalGroups: groups.length,
            enabledGroups: enabledGroups.length,
            disabledGroups: groups.length - enabledGroups.length,
            totalLinks,
            averageLinksPerGroup: groups.length > 0 ? totalLinks / groups.length : 0,
            lastModified: Math.max(
                ...groups.map(id => 
                    this.config[id]?.lastUpdated?.getTime() || 0
                )
            ),
            configSize: JSON.stringify(this.config).length
        };
    }

    /**
     * 清理过期备份
     */
    async cleanupOldBackups(retentionDays = 30): Promise<number> {
        try {
            const backups = await this.getBackupList();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            let deletedCount = 0;

            for (const backup of backups) {
                if (backup.timestamp < cutoffDate && backup.type === 'auto') {
                    try {
                        await fs.unlink(path.join(this.backupDir, backup.filename));
                        deletedCount++;
                        this.logger.debug(`Deleted old backup: ${backup.filename}`);
                    } catch (error) {
                        this.logger.warn(`Failed to delete backup: ${backup.filename}`, error);
                    }
                }
            }

            if (deletedCount > 0) {
                this.logger.info(`Cleaned up ${deletedCount} old backups`);
            }

            return deletedCount;
        } catch (error) {
            this.logger.error('Failed to cleanup old backups', error);
            return 0;
        }
    }

    /**
     * 监听配置文件变化
     */
    watchConfigFile(): void {
        if (this.isLoading) return;

        fs.watchFile(this.configPath, { interval: 5000 }, async (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                this.logger.info('Config file changed, reloading...');
                await this.loadConfig();
            }
        });
    }

    /**
     * 停止监听配置文件
     */
    unwatchConfigFile(): void {
        fs.unwatchFile(this.configPath);
    }

    /**
     * 销毁配置管理器
     */
    destroy(): void {
        this.unwatchConfigFile();
        this.removeAllListeners();
    }
}