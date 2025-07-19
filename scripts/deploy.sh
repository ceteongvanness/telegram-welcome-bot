#!/bin/bash

# Telegram Welcome Bot 部署脚本
# 支持多种部署方式：Heroku, VPS, PM2

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
DEPLOY_TYPE=""
APP_NAME="telegram-welcome-bot"
PM2_APP_NAME="telegram-bot"

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
    echo "Telegram Welcome Bot 部署脚本"
    echo
    echo "用法: $0 [部署类型] [选项]"
    echo
    echo "部署类型:"
    echo "  heroku          部署到 Heroku"
    echo "  vps             部署到 VPS (使用 PM2)"
    echo "  systemd         部署为 systemd 服务"
    echo
    echo "选项:"
    echo "  --app-name      应用名称 (默认: telegram-welcome-bot)"
    echo "  --pm2-name      PM2 进程名称 (默认: telegram-bot)"
    echo "  --help, -h      显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 heroku --app-name my-telegram-bot"
    echo "  $0 vps --pm2-name my-bot"
    echo "  $0 systemd"
}

# 检查部署要求
check_deployment_requirements() {
    log_info "检查部署要求..."
    
    # 检查基本文件
    local required_files=("package.json" "tsconfig.json" ".env.example")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "必需文件不存在: $file"
            exit 1
        fi
    done
    
    # 检查源代码目录
    if [ ! -d "src" ]; then
        log_error "源代码目录 'src' 不存在"
        exit 1
    fi
    
    log_success "基本要求检查通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 清理旧的构建文件
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # 安装依赖
    npm ci --only=production
    
    # 构建项目
    npm run build
    
    if [ ! -f "dist/index.js" ]; then
        log_error "构建失败：dist/index.js 不存在"
        exit 1
    fi
    
    log_success "项目构建完成"
}

# Heroku 部署
deploy_to_heroku() {
    log_info "开始 Heroku 部署..."
    
    # 检查 Heroku CLI
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI 未安装。请访问 https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    # 初始化 Git 仓库（如果不存在）
    if [ ! -d ".git" ]; then
        log_info "初始化 Git 仓库..."
        git init
        git add .
        git commit -m "Initial commit"
    fi
    
    # 检查是否已登录 Heroku
    if ! heroku auth:whoami &> /dev/null; then
        log_error "请先登录 Heroku: heroku login"
        exit 1
    fi
    
    # 创建 Heroku 应用（如果不存在）
    if ! heroku apps:info "$APP_NAME" &> /dev/null; then
        log_info "创建 Heroku 应用: $APP_NAME"
        heroku create "$APP_NAME"
    else
        log_info "使用现有的 Heroku 应用: $APP_NAME"
    fi
    
    # 设置环境变量
    log_info "设置环境变量..."
    if [ -f ".env" ]; then
        log_warning "请手动设置 Heroku 环境变量:"
        echo "heroku config:set BOT_TOKEN=your_bot_token --app $APP_NAME"
        echo "heroku config:set ADMIN_IDS=your_admin_ids --app $APP_NAME"
        echo "heroku config:set NODE_ENV=production --app $APP_NAME"
    fi
    
    # 部署到 Heroku
    log_info "部署到 Heroku..."
    git add .
    git commit -m "Deploy to Heroku" || true
    
    if ! git remote | grep -q heroku; then
        heroku git:remote -a "$APP_NAME"
    fi
    
    git push heroku main || git push heroku master
    
    # 启动应用
    heroku ps:scale worker=1 --app "$APP_NAME"
    
    log_success "Heroku 部署完成!"
    log_info "查看日志: heroku logs --tail --app $APP_NAME"
    log_info "应用地址: https://$APP_NAME.herokuapp.com"
}

# VPS 部署 (使用 PM2)
deploy_to_vps() {
    log_info "开始 VPS 部署..."
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        log_info "安装 PM2..."
        npm install -g pm2
    fi
    
    # 停止现有进程
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        log_info "停止现有进程..."
        pm2 stop "$PM2_APP_NAME"
        pm2 delete "$PM2_APP_NAME"
    fi
    
    # 创建 PM2 配置文件
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF
    
    # 启动应用
    log_info "启动应用..."
    pm2 start ecosystem.config.js
    
    # 保存 PM2 配置
    pm2 save
    
    # 设置开机自启
    pm2 startup
    
    log_success "VPS 部署完成!"
    log_info "查看状态: pm2 status"
    log_info "查看日志: pm2 logs $PM2_APP_NAME"
}

# Systemd 服务部署
deploy_to_systemd() {
    log_info "开始 Systemd 服务部署..."
    
    local service_name="telegram-welcome-bot"
    local service_file="/etc/systemd/system/$service_name.service"
    local current_dir=$(pwd)
    local user=$(whoami)
    
    # 检查权限
    if [ "$EUID" -ne 0 ]; then
        log_error "需要 root 权限来创建 systemd 服务"
        log_info "请使用 sudo 运行此脚本"
        exit 1
    fi
    
    # 创建服务文件
    log_info "创建 systemd 服务文件..."
    cat > "$service_file" << EOF
[Unit]
Description=Telegram Welcome Bot
After=network.target

[Service]
Type=simple
User=$user
WorkingDirectory=$current_dir
ExecStart=/usr/bin/node $current_dir/dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=$current_dir/.env

# 输出重定向
StandardOutput=append:$current_dir/logs/bot.log
StandardError=append:$current_dir/logs/error.log

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$current_dir/config $current_dir/logs $current_dir/uploads

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载 systemd
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable "$service_name"
    
    # 启动服务
    systemctl start "$service_name"
    
    log_success "Systemd 服务部署完成!"
    log_info "查看状态: systemctl status $service_name"
    log_info "查看日志: journalctl -u $service_name -f"
    log_info "停止服务: systemctl stop $service_name"
    log_info "重启服务: systemctl restart $service_name"
}

# 验证部署
verify_deployment() {
    case $DEPLOY_TYPE in
        "heroku")
            log_info "验证 Heroku 部署..."
            if heroku ps --app "$APP_NAME" | grep -q "up"; then
                log_success "Heroku 应用正在运行"
            else
                log_warning "Heroku 应用可能未正常运行"
            fi
            ;;
        "vps")
            log_info "验证 PM2 部署..."
            if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
                log_success "PM2 应用正在运行"
            else
                log_warning "PM2 应用可能未正常运行"
            fi
            ;;
        "systemd")
            log_info "验证 Systemd 服务..."
            if systemctl is-active --quiet telegram-welcome-bot; then
                log_success "Systemd 服务正在运行"
            else
                log_warning "Systemd 服务可能未正常运行"
            fi
            ;;
    esac
}

# 显示部署后说明
show_post_deployment_info() {
    log_success "🎉 部署完成!"
    echo
    echo "📋 部署后检查清单:"
    echo "1. ✅ 确认机器人 Token 已正确设置"
    echo "2. ✅ 确认管理员 ID 已正确配置"
    echo "3. ✅ 将机器人添加到 Telegram 群组"
    echo "4. ✅ 给机器人管理员权限"
    echo "5. ✅ 测试欢迎消息功能"
    echo
    
    case $DEPLOY_TYPE in
        "heroku")
            echo "💡 Heroku 特定说明:"
            echo "  - 查看日志: heroku logs --tail --app $APP_NAME"
            echo "  - 重启应用: heroku restart --app $APP_NAME"
            echo "  - 设置环境变量: heroku config:set KEY=VALUE --app $APP_NAME"
            ;;
        "vps")
            echo "💡 VPS/PM2 特定说明:"
            echo "  - 查看状态: pm2 status"
            echo "  - 查看日志: pm2 logs $PM2_APP_NAME"
            echo "  - 重启应用: pm2 restart $PM2_APP_NAME"
            echo "  - 停止应用: pm2 stop $PM2_APP_NAME"
            ;;
        "systemd")
            echo "💡 Systemd 特定说明:"
            echo "  - 查看状态: systemctl status telegram-welcome-bot"
            echo "  - 查看日志: journalctl -u telegram-welcome-bot -f"
            echo "  - 重启服务: systemctl restart telegram-welcome-bot"
            echo "  - 停止服务: systemctl stop telegram-welcome-bot"
            ;;
    esac
    
    echo
    echo "🔧 故障排除:"
    echo "  - 检查 .env 文件配置"
    echo "  - 确认网络连接正常"
    echo "  - 查看应用日志文件"
    echo "  - 验证 Telegram Bot Token 有效性"
}

# 主函数
main() {
    echo "🚀 Telegram Welcome Bot 部署脚本"
    echo "=================================="
    echo
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            heroku|vps|systemd)
                DEPLOY_TYPE="$1"
                shift
                ;;
            --app-name)
                APP_NAME="$2"
                shift 2
                ;;
            --pm2-name)
                PM2_APP_NAME="$2"
                shift 2
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
    
    # 检查部署类型
    if [ -z "$DEPLOY_TYPE" ]; then
        log_error "请指定部署类型"
        show_help
        exit 1
    fi
    
    log_info "部署类型: $DEPLOY_TYPE"
    log_info "应用名称: $APP_NAME"
    
    # 执行部署流程
    check_deployment_requirements
    build_project
    
    case $DEPLOY_TYPE in
        "heroku")
            deploy_to_heroku
            ;;
        "vps")
            deploy_to_vps
            ;;
        "systemd")
            deploy_to_systemd
            ;;
        *)
            log_error "不支持的部署类型: $DEPLOY_TYPE"
            exit 1
            ;;
    esac
    
    verify_deployment
    show_post_deployment_info
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 清理可能的临时文件
    rm -f ecosystem.config.js.tmp
}

# 设置错误处理
trap cleanup EXIT

# 执行主函数
main "$@"