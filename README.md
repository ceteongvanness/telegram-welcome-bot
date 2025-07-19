# 🤖 Telegram Welcome Bot with Inline Admin

一个功能强大的Telegram欢迎机器人，提供完全内联的管理界面，支持多群组配置、动态消息编辑和丰富的自定义选项。

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)

## 📋 目录

- [功能特点](#-功能特点)
- [项目结构](#-项目结构)
- [安装指南](#-安装指南)
- [配置说明](#-配置说明)
- [使用方法](#-使用方法)
- [API文档](#-api文档)
- [部署指南](#-部署指南)
- [故障排除](#-故障排除)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## ✨ 功能特点

### 🎯 核心功能
- **🏠 多群组管理** - 为不同群组设置独立的欢迎配置
- **📝 动态消息编辑** - 实时修改欢迎消息文本和格式
- **🖼️ 图片支持** - 自定义欢迎图片，支持多种格式
- **🔗 链接管理** - 添加社交媒体按钮和快速链接
- **⚙️ 高级设置** - 延迟发送、自动删除等高级功能

### 🎮 管理界面
- **📱 完全内联操作** - 所有设置都在Telegram内完成
- **🔄 实时预览** - 立即查看欢迎消息效果
- **👑 权限管理** - 多管理员支持，安全可靠
- **📊 配置管理** - 导入/导出配置，批量操作

### 🛡️ 安全特性
- **🔐 权限验证** - 只有授权管理员可以修改设置
- **💾 自动备份** - 配置文件自动保存和备份
- **🛠️ 错误处理** - 完善的错误处理和日志记录

## 📁 项目结构

```
telegram-welcome-bot/
├── src/                          # 源代码目录
│   ├── bot/                      # 机器人核心逻辑
│   │   ├── TelegramBot.ts        # 主机器人类
│   │   ├── handlers/             # 事件处理器
│   │   │   ├── WelcomeHandler.ts # 欢迎消息处理
│   │   │   ├── AdminHandler.ts   # 管理员命令处理
│   │   │   └── CallbackHandler.ts # 回调查询处理
│   │   └── middleware/           # 中间件
│   │       ├── AuthMiddleware.ts # 权限验证
│   │       └── LoggingMiddleware.ts # 日志记录
│   ├── config/                   # 配置管理
│   │   ├── ConfigManager.ts      # 配置管理器
│   │   ├── DefaultConfig.ts      # 默认配置
│   │   └── types.ts              # 配置类型定义
│   ├── ui/                       # 用户界面
│   │   ├── MenuBuilder.ts        # 菜单构建器
│   │   ├── MessageFormatter.ts   # 消息格式化
│   │   └── KeyboardBuilder.ts    # 键盘构建器
│   ├── utils/                    # 工具函数
│   │   ├── FileUtils.ts          # 文件操作
│   │   ├── ValidationUtils.ts    # 数据验证
│   │   └── Logger.ts             # 日志工具
│   ├── types/                    # 类型定义
│   │   ├── Bot.ts                # 机器人类型
│   │   ├── Config.ts             # 配置类型
│   │   └── Session.ts            # 会话类型
│   └── index.ts                  # 应用入口点
├── config/                       # 配置文件目录
│   ├── bot_config.json           # 机器人配置文件
│   ├── groups.json               # 群组配置文件
│   └── backup/                   # 配置备份目录
├── uploads/                      # 上传文件目录
│   └── images/                   # 欢迎图片存储
├── logs/                         # 日志文件目录
│   ├── bot.log                   # 机器人运行日志
│   ├── error.log                 # 错误日志
│   └── access.log                # 访问日志
├── scripts/                      # 脚本文件
│   ├── setup.sh                  # 安装脚本
│   ├── deploy.sh                 # 部署脚本
│   └── backup.sh                 # 备份脚本
├── docs/                         # 文档目录
│   ├── API.md                    # API文档
│   ├── DEPLOYMENT.md             # 部署文档
│   └── TROUBLESHOOTING.md        # 故障排除
├── tests/                        # 测试文件
│   ├── unit/                     # 单元测试
│   │   ├── handlers/             # 处理器测试
│   │   ├── config/               # 配置测试
│   │   └── utils/                # 工具测试
│   ├── integration/              # 集成测试
│   └── fixtures/                 # 测试数据
├── dist/                         # 编译输出目录
├── node_modules/                 # 依赖包目录
├── .env                          # 环境变量文件
├── .env.example                  # 环境变量示例
├── .gitignore                    # Git忽略文件
├── package.json                  # 项目配置文件
├── package-lock.json             # 依赖锁定文件
├── tsconfig.json                 # TypeScript配置
├── jest.config.js                # Jest测试配置
├── eslint.config.js              # ESLint配置
├── prettier.config.js            # Prettier配置
├── Dockerfile                    # Docker配置
├── docker-compose.yml            # Docker Compose配置
└── README.md                     # 项目说明文件
```

## 🚀 安装指南

### 系统要求
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 或 **yarn** >= 1.22.0
- **TypeScript** >= 4.8.0

### 快速开始

#### 1. 克隆项目
```bash
git clone https://github.com/ceteongvanness/telegram-welcome-bot.git
cd telegram-welcome-bot
```

#### 2. 安装依赖
```bash
npm install
# 或者使用 yarn
yarn install
```

#### 3. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# Telegram Bot Token (从 @BotFather 获取)
BOT_TOKEN=your_bot_token_here

# 管理员ID列表 (用逗号分隔)
ADMIN_IDS=123456789,987654321

# 运行环境
NODE_ENV=production

# 日志级别
LOG_LEVEL=info

# 配置文件路径
CONFIG_PATH=./config/bot_config.json

# 上传目录
UPLOAD_DIR=./uploads

# 备份间隔 (小时)
BACKUP_INTERVAL=24
```

#### 4. 编译和运行
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 🤖 创建Telegram Bot

#### 步骤1：创建Bot
1. 在Telegram中搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按照提示设置bot名称和用户名
4. 保存Bot Token

#### 步骤2：配置Bot权限
1. 发送 `/setprivacy` 给BotFather
2. 选择你的bot
3. 选择 `Disable` 让bot能读取群组消息

#### 步骤3：获取管理员ID
1. 在Telegram中搜索 `@userinfobot`
2. 发送任意消息获取你的用户ID
3. 将ID添加到环境变量中

## ⚙️ 配置说明

### 基础配置
```typescript
interface WelcomeConfig {
    welcomeText: string;        // 欢迎消息文本
    imageUrl: string;           // 欢迎图片URL
    links: LinkButton[];        // 链接按钮
    isEnabled: boolean;         // 是否启用
    autoDelete?: boolean;       // 自动删除消息
    welcomeDelay?: number;      // 发送延迟(秒)
}

interface LinkButton {
    text: string;               // 按钮文本
    url: string;                // 链接地址
    emoji?: string;             // 表情符号
}
```

### 默认配置示例
```json
{
  "default": {
    "welcomeText": "🎉 欢迎 {username} 加入我们的群组！\n\n🌟 很高兴你的到来！",
    "imageUrl": "https://via.placeholder.com/800x400/4CAF50/white?text=Welcome",
    "links": [
      {
        "text": "Twitter",
        "url": "https://twitter.com/yourhandle",
        "emoji": "🐦"
      },
      {
        "text": "YouTube", 
        "url": "https://youtube.com/yourchannel",
        "emoji": "📺"
      }
    ],
    "isEnabled": true,
    "autoDelete": false,
    "welcomeDelay": 0
  }
}
```

## 🎮 使用方法

### 管理员命令

#### 基础命令
```bash
/start          # 启动机器人
/settings       # 打开设置面板
/setup          # 设置当前群组
/test           # 测试欢迎消息
/help           # 查看帮助信息
```

#### 高级命令
```bash
/stats          # 查看统计信息
/backup         # 创建配置备份
/restore        # 恢复配置
/export         # 导出配置
/import         # 导入配置
```

### 设置流程

#### 1. 打开设置面板
发送 `/settings` 命令，显示主菜单：
```
🤖 欢迎机器人设置面板

🏠 群组设置    📝 欢迎消息
🖼️ 欢迎图片    🔗 链接管理
⚙️ 高级设置    🧪 测试消息
📊 统计信息    ✅ 完成设置
```

#### 2. 选择群组
点击 `🏠 群组设置`：
```
✅ 🌐 默认配置        ❌ 📱 群组 -1001234567890
✅ 📱 群组 -1001111111  ❌ 📱 群组 -1002222222

➕ 新建群组配置      📋 复制配置
⬅️ 返回主菜单
```

#### 3. 编辑配置
选择群组后进入详细设置：
```
📱 群组详细设置

❌ 禁用欢迎    📝 编辑消息
🖼️ 更换图片    🔗 管理链接
⚙️ 高级设置    🧪 测试消息
🗑️ 删除配置    ⬅️ 返回群组列表
```

#### 4. 管理链接
点击 `🔗 管理链接`：
```
🔗 链接管理

当前链接：
1. 🐦 Twitter - https://twitter.com/handle
2. 📺 YouTube - https://youtube.com/channel

🔗 Twitter - 编辑    📺 YouTube - 编辑
🌐 官网 - 编辑       💬 Discord - 编辑

➕ 添加链接    ⬅️ 返回
```

### 群组部署

#### 1. 添加机器人到群组
1. 将机器人添加到目标群组
2. 给机器人管理员权限
3. 确保机器人有发送消息权限

#### 2. 配置群组设置
```bash
# 在群组中执行
/setup
```

#### 3. 测试功能
```bash
# 测试欢迎消息
/test

# 让朋友加入群组验证效果
```

## 📡 API文档

### 核心类

#### TelegramInlineAdminBot
```typescript
class TelegramInlineAdminBot {
    constructor(botToken: string, adminIds: string[])
    
    // 启动机器人
    async start(): Promise<void>
    
    // 停止机器人
    async stop(): Promise<void>
    
    // 重新加载配置
    async reloadConfig(): Promise<void>
    
    // 创建配置备份
    async createBackup(): Promise<string>
}
```

#### ConfigManager
```typescript
class ConfigManager {
    // 加载配置
    async loadConfig(): Promise<GroupConfig>
    
    // 保存配置
    async saveConfig(config: GroupConfig): Promise<void>
    
    // 获取群组配置
    getGroupConfig(groupId: string): WelcomeConfig
    
    // 设置群组配置
    setGroupConfig(groupId: string, config: WelcomeConfig): void
}
```

### 事件处理

#### 新成员加入事件
```typescript
bot.on('new_chat_members', async (ctx: Context) => {
    const members = ctx.message.new_chat_members;
    const groupId = ctx.chat.id.toString();
    const config = this.getGroupConfig(groupId);
    
    for (const member of members) {
        if (!member.is_bot && config.isEnabled) {
            await this.sendWelcomeMessage(ctx, member, config);
        }
    }
});
```

#### 回调查询处理
```typescript
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const [action, ...params] = data.split('_');
    
    switch (action) {
        case 'group':
            await this.handleGroupAction(ctx, params);
            break;
        case 'edit':
            await this.handleEditAction(ctx, params);
            break;
        // ... 其他处理
    }
});
```

## 🚢 部署指南

### Docker 部署

#### 1. 使用预构建镜像
```bash
docker run -d \
  --name telegram-welcome-bot \
  -e BOT_TOKEN=your_token \
  -e ADMIN_IDS=your_ids \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  yourusername/telegram-welcome-bot:latest
```

#### 2. 使用Docker Compose
```yaml
version: '3.8'
services:
  telegram-bot:
    build: .
    environment:
      - BOT_TOKEN=${BOT_TOKEN}
      - ADMIN_IDS=${ADMIN_IDS}
      - NODE_ENV=production
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

启动服务：
```bash
docker-compose up -d
```

### VPS 部署

#### 1. 使用PM2
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name telegram-bot

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs telegram-bot
```

#### 2. 使用Systemd
创建服务文件 `/etc/systemd/system/telegram-bot.service`：
```ini
[Unit]
Description=Telegram Welcome Bot
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/telegram-bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl enable telegram-bot
sudo systemctl start telegram-bot
sudo systemctl status telegram-bot
```

### 云平台部署

#### Heroku
```bash
# 登录Heroku
heroku login

# 创建应用
heroku create your-app-name

# 设置环境变量
heroku config:set BOT_TOKEN=your_token
heroku config:set ADMIN_IDS=your_ids

# 部署
git push heroku main
```

#### Railway
```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 部署
railway up
```

## 🔧 故障排除

### 常见问题

#### Q: 机器人无法发送欢迎消息
**可能原因:**
- 机器人没有管理员权限
- 群组禁止机器人发送消息
- Bot Token不正确
- 群组配置未启用

**解决方案:**
```bash
# 1. 检查机器人权限
# 确保机器人是群组管理员

# 2. 检查配置
/setup  # 重新配置群组

# 3. 测试机器人
/test   # 发送测试消息

# 4. 查看日志
docker logs telegram-welcome-bot
```

#### Q: 管理界面显示"没有权限"
**解决方案:**
```bash
# 检查环境变量
echo $ADMIN_IDS

# 获取正确的用户ID
# 向 @userinfobot 发送消息

# 重启机器人
pm2 restart telegram-bot
```

#### Q: 图片无法显示
**解决方案:**
```bash
# 检查图片URL
curl -I https://your-image-url.com/image.jpg

# 确保图片可公开访问
# 使用HTTPS协议
# 检查图片大小(<20MB)
```

### 日志分析

#### 查看运行日志
```bash
# Docker
docker logs -f telegram-welcome-bot

# PM2
pm2 logs telegram-bot

# 系统日志
journalctl -u telegram-bot -f
```

#### 常见错误码
```
400 Bad Request    - 请求格式错误
401 Unauthorized   - Bot Token无效
403 Forbidden      - 权限不足
429 Too Many       - 请求过于频繁
500 Internal Error - 服务器内部错误
```

### 性能监控

#### 系统资源监控
```bash
# CPU和内存使用
top -p $(pgrep -f telegram-bot)

# 磁盘使用
df -h
du -sh ./logs

# 网络连接
netstat -an | grep :443
```

#### 应用性能监控
```bash
# PM2 监控
pm2 monit

# 自定义健康检查
curl http://localhost:3000/health
```

## 🤝 贡献指南

### 开发环境设置

#### 1. Fork 项目
```bash
git clone https://github.com/yourusername/telegram-welcome-bot.git
cd telegram-welcome-bot
git remote add upstream https://github.com/originaluser/telegram-welcome-bot.git
```

#### 2. 安装开发依赖
```bash
npm install
npm run dev
```

#### 3. 代码规范
```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### 提交规范

#### Commit Message 格式
```
type(scope): description

[optional body]

[optional footer]
```

#### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例
```bash
git commit -m "feat(admin): add bulk configuration import feature"
git commit -m "fix(welcome): resolve image loading timeout issue"
git commit -m "docs(readme): update installation instructions"
```

### Pull Request 流程

#### 1. 创建功能分支
```bash
git checkout -b feature/your-feature-name
```

#### 2. 开发和测试
```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

#### 3. 提交PR
1. 推送分支到你的fork
2. 创建Pull Request
3. 填写PR模板
4. 等待代码审查

### 代码标准

#### TypeScript 规范
```typescript
// 使用严格类型定义
interface WelcomeConfig {
    welcomeText: string;
    imageUrl: string;
    links: LinkButton[];
    isEnabled: boolean;
}

// 使用async/await
async function sendWelcomeMessage(ctx: Context): Promise<void> {
    try {
        await ctx.reply('Welcome!');
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

// 错误处理
function validateConfig(config: unknown): WelcomeConfig {
    if (!isValidConfig(config)) {
        throw new Error('Invalid configuration');
    }
    return config as WelcomeConfig;
}
```

#### 文档规范
```typescript
/**
 * 发送欢迎消息给新成员
 * @param ctx - Telegram上下文对象
 * @param member - 新成员信息
 * @param config - 群组配置
 * @returns Promise<void>
 * @throws {Error} 当发送失败时抛出错误
 */
async function sendWelcomeMessage(
    ctx: Context, 
    member: ChatMember, 
    config: WelcomeConfig
): Promise<void> {
    // 实现代码
}
```

## 📄 许可证

本项目采用 MIT 许可证。详细信息请查看 [LICENSE](LICENSE) 文件。

```
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 致谢

- [Telegraf](https://telegraf.js.org/) - Telegram Bot框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Node.js](https://nodejs.org/) - JavaScript运行时
- 所有贡献者和用户的支持

## 📞 支持与联系

- **GitHub Issues**: [提交问题](https://github.com/yourusername/telegram-welcome-bot/issues)
- **文档**: [在线文档](https://yourusername.github.io/telegram-welcome-bot)
- **社区**: [Telegram群组](https://t.me/your_support_group)
- **邮箱**: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给我们一个Star！

📦 **版本**: v1.0.0  
🏷️ **标签**: telegram, bot, welcome, typescript, nodejs  
📅 **最后更新**: 2024-12-19
