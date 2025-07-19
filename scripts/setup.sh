#!/bin/bash

# Telegram Welcome Bot 安装脚本
# 用于快速设置开发和生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查必需的工具
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装。请访问 https://nodejs.org 下载安装。"
        exit 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local required_version="16.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$node_version', '$required_version') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js 版本过低。需要 v$required_version 或更高版本，当前版本: v$node_version"
        exit 1
    fi
    
    log_success "Node.js v$node_version ✓"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装。"
        exit 1
    fi
    
    local npm_version=$(npm -v)
    log_success "npm v$npm_version ✓"
    
    # 检查 git (可选)
    if command -v git &> /dev/null; then
        local git_version=$(git --version | cut -d' ' -f3)
        log_success "Git v$git_version ✓"
    else
        log_warning "Git 未安装 (可选)"
    fi
}

# 创建目录结构
create_directories() {
    log_info "创建项目目录结构..."
    
    local dirs=(
        "config"
        "config/backup"
        "logs"
        "uploads"
        "uploads/images"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "创建目录: $dir"
        else
            log_info "目录已存在: $dir"
        fi
    done
    
    # 创建 .gitkeep 文件
    touch uploads/.gitkeep
    touch logs/.gitkeep
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    # 清理可能存在的 node_modules
    if [ -d "node_modules" ]; then
        log_info "清理现有的 node_modules..."
        rm -rf node_modules
    fi
    
    # 安装依赖
    npm ci
    log_success "依赖安装完成"
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "创建 .env 文件"
            log_warning "请编辑 .env 文件并填入正确的配置值"
        else
            log_error ".env.example 文件不存在"
            exit 1
        fi
    else
        log_info ".env 文件已存在"
    fi
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    npm run build
    log_success "项目构建完成"
}

# 运行测试
run_tests() {
    if [ "$1" = "--skip-tests" ]; then
        log_info "跳过测试"
        return 0
    fi
    
    log_info "运行测试..."
    
    if npm test; then
        log_success "测试通过"
    else
        log_warning "测试失败，但继续安装过程"
    fi
}

# 验证安装
verify_installation() {
    log_info "验证安装..."
    
    # 检查构建文件
    if [ -f "dist/index.js" ]; then
        log_success "构建文件存在 ✓"
    else
        log_error "构建文件不存在"
        exit 1
    fi
    
    # 检查配置目录
    if [ -d "config" ] && [ -d "logs" ] && [ -d "uploads" ]; then
        log_success "目录结构正确 ✓"
    else
        log_error "目录结构不完整"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ -f ".env" ]; then
        log_success "环境配置文件存在 ✓"
    else
        log_error "环境配置文件不存在"
        exit 1
    fi
}

# 显示使用说明
show_usage() {
    log_success "🎉 安装完成！"
    echo
    echo "📋 下一步操作："
    echo "1. 编辑 .env 文件，填入你的 Telegram Bot Token 和管理员 ID"
    echo "2. 运行 'npm start' 启动机器人"
    echo "3. 将机器人添加到 Telegram 群组并给予管理员权限"
    echo
    echo "💡 有用的命令："
    echo "  npm start          - 启动机器人"
    echo "  npm run dev        - 开发模式启动"
    echo "  npm test           - 运行测试"
    echo "  npm run lint       - 代码检查"
    echo "  npm run build      - 构建项目"
    echo
    echo "📚 更多信息请查看 README.md 文件"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 这里可以添加清理逻辑
}

# 主函数
main() {
    echo "🤖 Telegram Welcome Bot 安装脚本"
    echo "=================================="
    echo
    
    # 解析命令行参数
    local skip_tests=false
    local force_reinstall=false
    
    for arg in "$@"; do
        case $arg in
            --skip-tests)
                skip_tests=true
                ;;
            --force)
                force_reinstall=true
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --skip-tests    跳过测试步骤"
                echo "  --force         强制重新安装"
                echo "  --help, -h      显示此帮助信息"
                exit 0
                ;;
        esac
    done
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 执行安装步骤
    check_requirements
    create_directories
    install_dependencies
    setup_environment
    build_project
    
    if [ "$skip_tests" = false ]; then
        run_tests
    fi
    
    verify_installation
    show_usage
    
    log_success "安装脚本执行完成!"
}

# 执行主函数
main "$@"