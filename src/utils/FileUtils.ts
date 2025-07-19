/**
 * 文件操作工具类
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface FileInfo {
    /** 文件名 */
    name: string;
    /** 文件路径 */
    path: string;
    /** 文件大小(字节) */
    size: number;
    /** 修改时间 */
    modifiedTime: Date;
    /** 创建时间 */
    createdTime: Date;
    /** 文件扩展名 */
    extension: string;
    /** MIME类型 */
    mimeType?: string;
}

export interface DirectoryInfo {
    /** 目录名 */
    name: string;
    /** 目录路径 */
    path: string;
    /** 文件数量 */
    fileCount: number;
    /** 子目录数量 */
    dirCount: number;
    /** 总大小(字节) */
    totalSize: number;
    /** 修改时间 */
    modifiedTime: Date;
}

export class FileUtils {
    /**
     * 检查文件是否存在
     */
    static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 检查目录是否存在
     */
    static async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stats = await fs.stat(dirPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * 确保目录存在，如果不存在则创建
     */
    static async ensureDirectory(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            throw new Error(`Failed to create directory: ${dirPath}. ${error}`);
        }
    }

    /**
     * 获取文件信息
     */
    static async getFileInfo(filePath: string): Promise<FileInfo> {
        try {
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            const extension = path.extname(fileName).toLowerCase();

            return {
                name: fileName,
                path: filePath,
                size: stats.size,
                modifiedTime: stats.mtime,
                createdTime: stats.birthtime,
                extension,
                mimeType: this.getMimeType(extension)
            };
        } catch (error) {
            throw new Error(`Failed to get file info: ${filePath}. ${error}`);
        }
    }

    /**
     * 获取目录信息
     */
    static async getDirectoryInfo(dirPath: string): Promise<DirectoryInfo> {
        try {
            const stats = await fs.stat(dirPath);
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            let fileCount = 0;
            let dirCount = 0;
            let totalSize = 0;

            for (const entry of entries) {
                if (entry.isFile()) {
                    fileCount++;
                    const entryPath = path.join(dirPath, entry.name);
                    const entryStats = await fs.stat(entryPath);
                    totalSize += entryStats.size;
                } else if (entry.isDirectory()) {
                    dirCount++;
                }
            }

            return {
                name: path.basename(dirPath),
                path: dirPath,
                fileCount,
                dirCount,
                totalSize,
                modifiedTime: stats.mtime
            };
        } catch (error) {
            throw new Error(`Failed to get directory info: ${dirPath}. ${error}`);
        }
    }

    /**
     * 读取JSON文件
     */
    static async readJsonFile<T = any>(filePath: string): Promise<T> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to read JSON file: ${filePath}. ${error}`);
        }
    }

    /**
     * 写入JSON文件
     */
    static async writeJsonFile(filePath: string, data: any, pretty = true): Promise<void> {
        try {
            const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
            await this.ensureDirectory(path.dirname(filePath));
            await fs.writeFile(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`Failed to write JSON file: ${filePath}. ${error}`);
        }
    }

    /**
     * 复制文件
     */
    static async copyFile(sourcePath: string, targetPath: string): Promise<void> {
        try {
            await this.ensureDirectory(path.dirname(targetPath));
            await fs.copyFile(sourcePath, targetPath);
        } catch (error) {
            throw new Error(`Failed to copy file from ${sourcePath} to ${targetPath}. ${error}`);
        }
    }

    /**
     * 移动文件
     */
    static async moveFile(sourcePath: string, targetPath: string): Promise<void> {
        try {
            await this.ensureDirectory(path.dirname(targetPath));
            await fs.rename(sourcePath, targetPath);
        } catch (error) {
            throw new Error(`Failed to move file from ${sourcePath} to ${targetPath}. ${error}`);
        }
    }

    /**
     * 删除文件
     */
    static async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            throw new Error(`Failed to delete file: ${filePath}. ${error}`);
        }
    }

    /**
     * 删除目录及其内容
     */
    static async deleteDirectory(dirPath: string): Promise<void> {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            throw new Error(`Failed to delete directory: ${dirPath}. ${error}`);
        }
    }

    /**
     * 列出目录中的文件
     */
    static async listFiles(
        dirPath: string, 
        options: {
            recursive?: boolean;
            extensions?: string[];
            includeHidden?: boolean;
        } = {}
    ): Promise<FileInfo[]> {
        const { recursive = false, extensions, includeHidden = false } = options;
        const files: FileInfo[] = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                if (!includeHidden && entry.name.startsWith('.')) {
                    continue;
                }

                const entryPath = path.join(dirPath, entry.name);

                if (entry.isFile()) {
                    const fileInfo = await this.getFileInfo(entryPath);
                    
                    if (!extensions || extensions.includes(fileInfo.extension)) {
                        files.push(fileInfo);
                    }
                } else if (entry.isDirectory() && recursive) {
                    const subFiles = await this.listFiles(entryPath, options);
                    files.push(...subFiles);
                }
            }

            return files.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            throw new Error(`Failed to list files in directory: ${dirPath}. ${error}`);
        }
    }

    /**
     * 计算文件哈希值
     */
    static async calculateFileHash(filePath: string, algorithm = 'md5'): Promise<string> {
        try {
            const content = await fs.readFile(filePath);
            const hash = createHash(algorithm);
            hash.update(content);
            return hash.digest('hex');
        } catch (error) {
            throw new Error(`Failed to calculate hash for file: ${filePath}. ${error}`);
        }
    }

    /**
     * 创建文件备份
     */
    static async createBackup(filePath: string, backupSuffix?: string): Promise<string> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const suffix = backupSuffix || timestamp;
            const backupPath = `${filePath}.backup.${suffix}`;
            
            await this.copyFile(filePath, backupPath);
            return backupPath;
        } catch (error) {
            throw new Error(`Failed to create backup for file: ${filePath}. ${error}`);
        }
    }

    /**
     * 清理旧文件
     */
    static async cleanupOldFiles(
        dirPath: string, 
        maxAge: number, // 天数
        pattern?: RegExp
    ): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAge);

            const files = await this.listFiles(dirPath);
            let deletedCount = 0;

            for (const file of files) {
                if (file.modifiedTime < cutoffDate) {
                    if (!pattern || pattern.test(file.name)) {
                        await this.deleteFile(file.path);
                        deletedCount++;
                    }
                }
            }

            return deletedCount;
        } catch (error) {
            throw new Error(`Failed to cleanup old files in: ${dirPath}. ${error}`);
        }
    }

    /**
     * 获取目录大小
     */
    static async getDirectorySize(dirPath: string): Promise<number> {
        try {
            let totalSize = 0;
            const files = await this.listFiles(dirPath, { recursive: true });
            
            for (const file of files) {
                totalSize += file.size;
            }

            return totalSize;
        } catch (error) {
            throw new Error(`Failed to calculate directory size: ${dirPath}. ${error}`);
        }
    }

    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * 解析文件大小字符串
     */
    static parseFileSize(sizeStr: string): number {
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B?)$/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        switch (unit) {
            case 'KB': case 'K': return value * 1024;
            case 'MB': case 'M': return value * 1024 * 1024;
            case 'GB': case 'G': return value * 1024 * 1024 * 1024;
            case 'TB': case 'T': return value * 1024 * 1024 * 1024 * 1024;
            default: return value;
        }
    }

    /**
     * 获取MIME类型
     */
    static getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
            '.json': 'application/json',
            '.txt': 'text/plain',
            '.log': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.zip': 'application/zip',
            '.tar': 'application/tar',
            '.gz': 'application/gzip'
        };

        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * 检查文件扩展名是否允许
     */
    static isAllowedExtension(fileName: string, allowedExtensions: string[]): boolean {
        const extension = path.extname(fileName).toLowerCase();
        return allowedExtensions.includes(extension);
    }

    /**
     * 生成安全的文件名
     */
    static sanitizeFileName(fileName: string): string {
        // 移除或替换危险字符
        return fileName
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 255);
    }

    /**
     * 生成唯一文件名
     */
    static generateUniqueFileName(originalName: string, directory: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        
        return `${this.sanitizeFileName(baseName)}_${timestamp}_${random}${extension}`;
    }

    /**
     * 原子写入文件（先写入临时文件再重命名）
     */
    static async atomicWriteFile(filePath: string, data: string | Buffer): Promise<void> {
        const tempPath = `${filePath}.tmp.${Date.now()}`;
        
        try {
            await this.ensureDirectory(path.dirname(filePath));
            await fs.writeFile(tempPath, data);
            await fs.rename(tempPath, filePath);
        } catch (error) {
            // 清理临时文件
            try {
                await fs.unlink(tempPath);
            } catch {
                // 忽略清理错误
            }
            throw new Error(`Failed to atomically write file: ${filePath}. ${error}`);
        }
    }

    /**
     * 监控文件变化
     */
    static watchFile(
        filePath: string, 
        callback: (eventType: string, filename: string) => void,
        options: { persistent?: boolean; interval?: number } = {}
    ): () => void {
        const watcher = fs.watch(filePath, options, callback);
        return () => watcher.close();
    }

    /**
     * 压缩目录到ZIP文件
     */
    static async compressDirectory(sourceDir: string, targetZip: string): Promise<void> {
        // 注意：这里需要额外的依赖库如 archiver 或 node-stream-zip
        // 为了保持依赖简单，这里只是一个占位符实现
        throw new Error('Compression feature requires additional dependencies');
    }

    /**
     * 解压ZIP文件
     */
    static async extractZip(zipPath: string, targetDir: string): Promise<void> {
        // 注意：这里需要额外的依赖库如 yauzl 或 node-stream-zip
        // 为了保持依赖简单，这里只是一个占位符实现
        throw new Error('Extraction feature requires additional dependencies');
    }
}