#!/bin/bash

# Telegram Welcome Bot 备份脚本
# 用于备份配置文件、日志和上传文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
BACKUP_DIR="./backups"
CONFIG_DIR="./config"
LOGS_DIR="./logs"
UPLOADS_DIR="./uploads"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="telegram_bot_backup_$TIMESTAMP"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "Telegram Welcome Bot 备份脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  --config-only       仅备份配置文件"
    echo "  --include-logs      包含日志文件"
    echo "  --include-uploads   包含上传文件"
    echo "  --compress          压缩备份文件"
    echo "  --output DIR        指定输出目录 (默认: ./backups)"
    echo "  --name NAME         指定备份名称"
    echo "  --help, -h          显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0                           # 完整备份"
    echo "  $0 --config-only             # 仅备份配置"
    echo "  $0 --compress --include-logs # 压缩备份包含日志"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查必需的目录
    if [ ! -d "$CONFIG_DIR" ]; then
        log_error "配置目录不存在: $CONFIG_DIR"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 创建备份目录
create_backup_directory() {
    log_info "创建备份目录..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_success "创建备份目录: $BACKUP_DIR"
    fi
    
    FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$FULL_BACKUP_PATH"
    log_success "创建备份路径: $FULL_BACKUP_PATH"
}

# 备份配置文件
backup_config() {
    log_info "备份配置文件..."
    
    local config_backup_dir="$FULL_BACKUP_PATH/config"
    mkdir -p "$config_backup_dir"
    
    # 备份主配置文件
    if [ -f "$CONFIG_DIR/bot_config.json" ]; then
        cp "$CONFIG_DIR/bot_config.json" "$config_backup_dir/"
        log_success "备份 bot_config.json"
    fi
    
    # 备份群组配置
    if [ -f "$CONFIG_DIR/groups.json" ]; then
        cp "$CONFIG_DIR/groups.json" "$config_backup_dir/"
        log_success "备份 groups.json"
    fi
    
    # 备份配置历史
    if [ -f "$CONFIG_DIR/config_history.json" ]; then
        cp "$CONFIG_DIR/config_history.json" "$config_backup_dir/"
        log_success "备份 config_history.json"
    fi
    
    # 备份会话数据
    if [ -f "$CONFIG_DIR/sessions.json" ]; then
        cp "$CONFIG_DIR/sessions.json" "$config_backup_dir/"
        log_success "备份 sessions.json"
    fi
    
    # 备份现有的备份文件
    if [ -d "$CONFIG_DIR/backup" ]; then
        cp -r "$CONFIG_DIR/backup" "$config_backup_dir/"
        log_success "备份配置备份目录"
    fi
}

# 备份日志文件
backup_logs() {
    if [ "$INCLUDE_LOGS" != "true" ]; then
        return 0
    fi
    
    log_info "备份日志文件..."
    
    if [ ! -d "$LOGS_DIR" ]; then
        log_warning "日志目录不存在，跳过日志备份"
        return 0
    fi
    
    local logs_backup_dir="$FULL_BACKUP_PATH/logs"
    mkdir -p "$logs_backup_dir"
    
    # 备份最近的日志文件（最近7天）
    find "$LOGS_DIR" -name "*.log" -mtime -7 -exec cp {} "$logs_backup_dir/" \;
    
    local log_count=$(find "$logs_backup_dir" -name "*.log" | wc -l)
    log_success "备份了 $log_count 个日志文件"
}

# 备份上传文件
backup_uploads() {
    if [ "$INCLUDE_UPLOADS" != "true" ]; then
        return 0
    fi
    
    log_info "备份上传文件..."
    
    if [ ! -d "$UPLOADS_DIR" ]; then
        log_warning "上传目录不存在，跳过上传文件备份"
        return 0
    fi
    
    local uploads_backup_dir="$FULL_BACKUP_PATH/uploads"
    
    # 计算上传目录大小
    local upload_size=$(du -sh "$UPLOADS_DIR" | cut -f1)
    log_info "上传目录大小: $upload_size"
    
    # 如果上传目录很大，询问是否继续
    local upload_size_mb=$(du -sm "$UPLOADS_DIR" | cut -f1)
    if [ "$upload_size_mb" -gt 100 ]; then
        log_warning "上传目录较大 ($upload_size)，备份可能耗时较长"
        if [ -z "$FORCE_BACKUP" ]; then
            read -p "是否继续？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "跳过上传文件备份"
                return 0
            fi
        fi
    fi
    
    cp -r "$UPLOADS_DIR" "$uploads_backup_dir"
    log_success "备份上传文件完成"
}

# 创建备份元数据
create_metadata() {
    log_info "创建备份元数据..."
    
    local metadata_file="$FULL_BACKUP_PATH/backup_info.json"
    
    cat > "$metadata_file" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "hostname": "$(hostname)",
  "user": "$(whoami)",
  "pwd": "$(pwd)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "node_version": "$(node -v 2>/dev/null || echo 'unknown')",
  "npm_version": "$(npm -v 2>/dev/null || echo 'unknown')",
  "backup_options": {
    "config_only": "$CONFIG_ONLY",
    "include_logs": "$INCLUDE_LOGS",
    "include_uploads": "$INCLUDE_UPLOADS",
    "compress": "$COMPRESS"
  },
  "file_counts": {
    "config_files": $(find "$FULL_BACKUP_PATH/config" -type f 2>/dev/null | wc -l),
    "log_files": $(find "$FULL_BACKUP_PATH/logs" -type f 2>/dev/null | wc -l),
    "upload_files": $(find "$FULL_BACKUP_PATH/uploads" -type f 2>/dev/null | wc -l)
  },
  "backup_size": "$(du -sh "$FULL_BACKUP_PATH" | cut -f1)"
}
EOF
    
    log_success "创建备份元数据"
}

# 压缩备份
compress_backup() {
    if [ "$COMPRESS" != "true" ]; then
        return 0
    fi
    
    log_info "压缩备份文件..."
    
    local archive_name="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    
    # 创建压缩包
    tar -czf "$archive_name" -C "$BACKUP_DIR" "$BACKUP_NAME"
    
    # 删除原始目录
    rm -rf "$FULL_BACKUP_PATH"
    
    local archive_size=$(du -sh "$archive_name" | cut -f1)
    log_success "创建压缩包: $archive_name ($archive_size)"
    
    FINAL_BACKUP_PATH="$archive_name"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份..."
    
    # 保留最近10个备份
    local backup_count=$(find "$BACKUP_DIR" -maxdepth 1 -name "telegram_bot_backup_*" | wc -l)
    
    if [ "$backup_count" -gt 10 ]; then
        local to_delete=$((backup_count - 10))
        log_info "找到 $backup_count 个备份，删除最旧的 $to_delete 个"
        
        find "$BACKUP_DIR" -maxdepth 1 -name "telegram_bot_backup_*" -type f -printf '%T@ %p\n' | \
        sort -n | head -n "$to_delete" | cut -d' ' -f2- | xargs rm -f
        
        find "$BACKUP_DIR" -maxdepth 1 -name "telegram_bot_backup_*" -type d -printf '%T@ %p\n' | \
        sort -n | head -n "$to_delete" | cut -d' ' -f2- | xargs rm -rf
        
        log_success "清理了 $to_delete 个旧备份"
    else
        log_info "备份数量 ($backup_count) 在限制范围内，无需清理"
    fi
}

# 验证备份
verify_backup() {
    log_info "验证备份..."
    
    local backup_path="$FINAL_BACKUP_PATH"
    if [ -z "$backup_path" ]; then
        backup_path="$FULL_BACKUP_PATH"
    fi
    
    if [ ! -e "$backup_path" ]; then
        log_error "备份文件/目录不存在: $backup_path"
        exit 1
    fi
    
    # 检查配置文件
    if [ "$COMPRESS" = "true" ]; then
        if ! tar -tzf "$backup_path" | grep -q "config/"; then
            log_error "备份中缺少配置文件"
            exit 1
        fi
    else
        if [ ! -d "$backup_path/config" ]; then
            log_error "备份中缺少配置目录"
            exit 1
        fi
    fi
    
    log_success "备份验证通过"
}

# 显示备份结果
show_backup_result() {
    log_success "🎉 备份完成!"
    echo
    echo "📋 备份信息:"
    echo "  备份名称: $BACKUP_NAME"
    echo "  备份时间: $(date)"
    
    if [ "$COMPRESS" = "true" ]; then
        echo "  备份文件: $FINAL_BACKUP_PATH"
        echo "  文件大小: $(du -sh "$FINAL_BACKUP_PATH" | cut -f1)"
    else
        echo "  备份目录: $FULL_BACKUP_PATH"
        echo "  目录大小: $(du -sh "$FULL_BACKUP_PATH" | cut -f1)"
    fi
    
    echo
    echo "📦 备份内容:"
    echo "  ✅ 配置文件"
    
    if [ "$INCLUDE_LOGS" = "true" ]; then
        echo "  ✅ 日志文件"
    else
        echo "  ❌ 日志文件 (跳过)"
    fi
    
    if [ "$INCLUDE_UPLOADS" = "true" ]; then
        echo "  ✅ 上传文件"
    else
        echo "  ❌ 上传文件 (跳过)"
    fi
    
    echo
    echo "💡 恢复备份:"
    if [ "$COMPRESS" = "true" ]; then
        echo "  tar -xzf $FINAL_BACKUP_PATH -C /"
    else
        echo "  cp -r $FULL_BACKUP_PATH/* ./"
    fi
}

# 主函数
main() {
    echo "💾 Telegram Welcome Bot 备份脚本"
    echo "================================="
    echo
    
    # 默认选项
    CONFIG_ONLY="false"
    INCLUDE_LOGS="false"
    INCLUDE_UPLOADS="false"
    COMPRESS="false"
    FORCE_BACKUP=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --config-only)
                CONFIG_ONLY="true"
                shift
                ;;
            --include-logs)
                INCLUDE_LOGS="true"
                shift
                ;;
            --include-uploads)
                INCLUDE_UPLOADS="true"
                shift
                ;;
            --compress)
                COMPRESS="true"
                shift
                ;;
            --output)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --name)
                BACKUP_NAME="$2"
                shift 2
                ;;
            --force)
                FORCE_BACKUP="true"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果不是仅配置模式，默认包含所有内容
    if [ "$CONFIG_ONLY" = "false" ]; then
        INCLUDE_LOGS="true"
        INCLUDE_UPLOADS="true"
    fi
    
    log_info "备份选项:"
    log_info "  仅配置: $CONFIG_ONLY"
    log_info "  包含日志: $INCLUDE_LOGS"
    log_info "  包含上传: $INCLUDE_UPLOADS"
    log_info "  压缩: $COMPRESS"
    
    # 执行备份流程
    check_dependencies
    create_backup_directory
    backup_config
    backup_logs
    backup_uploads
    create_metadata
    compress_backup
    verify_backup
    cleanup_old_backups
    show_backup_result
}

# 执行主函数
main "$@"