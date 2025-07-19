/**
 * 配置模块的类型定义
 */

export * from '@/types/Config';

export interface ConfigValidationOptions {
    /** 是否检查URL有效性 */
    validateUrls?: boolean;
    /** 是否允许空配置 */
    allowEmpty?: boolean;
    /** 最大链接数量 */
    maxLinks?: number;
    /** 严格模式 */
    strict?: boolean;
}

export interface ConfigOperationResult {
    /** 操作是否成功 */
    success: boolean;
    /** 错误消息 */
    error?: string;
    /** 警告消息 */
    warnings?: string[];
    /** 操作详情 */
    details?: any;
}

export interface ConfigDiff {
    /** 变更类型 */
    type: 'added' | 'modified' | 'deleted';
    /** 路径 */
    path: string;
    /** 旧值 */
    oldValue?: any;
    /** 新值 */
    newValue?: any;
}

export interface ConfigHistory {
    /** 变更时间戳 */
    timestamp: Date;
    /** 操作类型 */
    operation: 'create' | 'update' | 'delete' | 'import' | 'reset';
    /** 变更者 */
    changedBy: string;
    /** 变更详情 */
    changes: ConfigDiff[];
    /** 备注 */
    note?: string;
}

export interface ConfigMigration {
    /** 版本号 */
    version: string;
    /** 迁移描述 */
    description: string;
    /** 迁移函数 */
    migrate: (config: any) => any;
    /** 回滚函数 */
    rollback?: (config: any) => any;
}