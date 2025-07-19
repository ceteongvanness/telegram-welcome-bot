# 部署指南

本文档详细说明如何在不同平台上部署 Telegram Welcome Bot。

## 目录

- [Heroku 部署](#heroku-部署)
- [VPS 部署](#vps-部署)
- [Docker 部署](#docker-部署)
- [Systemd 服务](#systemd-服务)
- [环境变量配置](#环境变量配置)
- [故障排除](#故障排除)

## Heroku 部署

### 前提条件
- Heroku 账户
- Heroku CLI 已安装
- Git 已安装

### 快速部署

1. **克隆项目**
```bash
git clone https://github.com/yourusername/telegram-welcome-bot.git
cd telegram-welcome-bot
```

2. **登录 Heroku**
```bash
heroku login
```

3. **创建应用**
```bash
heroku create your-app-name
```

4. **设置环境变量**
```bash
heroku config:set BOT_TOKEN=your_bot_token
heroku config:set ADMIN_IDS=123456789,987654321
heroku config:set NODE_ENV=production
```

5. **部署应用**
```bash
git push heroku main
```

6. **启动 worker**
```bash
heroku ps:scale web=1
```

### 自动化部署

使用项目提供的部署脚本：

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh heroku --app-name your-app-name
```

### Heroku 特定配置

在 `package.json` 中已经配置了 Heroku 相关脚本：

```json
{
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

确保 `Procfile` 文件存在：
```
web: node dist/index.js
```

## VPS 部署

### 使用 PM2 (推荐)

1. **安装 Node.js 和 PM2**
```bash
# 安装 Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
npm install -g pm2
```

2. **克隆和构建项目**
```bash
git clone https://github.com/yourusername/telegram-welcome-bot.git
cd telegram-welcome-bot
npm install
npm run build
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件
nano .env
```

4. **启动应用**
```bash
pm2 start dist/index.js --name telegram-bot
pm2 save
pm2 startup
```

### 使用部署脚本

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh vps --pm2-name telegram-bot
```

### PM2 生态系统文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

启动：
```bash
pm2 start ecosystem.config.js
```

## Docker 部署

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 创建必要目录
RUN mkdir -p config logs uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

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

### 构建和运行

```bash
# 构建镜像
docker build -t telegram-welcome-bot .

# 运行容器
docker run -d \
  --name telegram-bot \
  -e BOT_TOKEN=your_bot_token \
  -e ADMIN_IDS=123456789,987654321 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  telegram-welcome-bot

# 使用 Docker Compose
docker-compose up -d
```

## Systemd 服务

### 创建服务文件

```bash
sudo nano /etc/systemd/system/telegram-welcome-bot.service
```

```ini
[Unit]
Description=Telegram Welcome Bot
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/telegram-welcome-bot
ExecStart=/usr/bin/node /opt/telegram-welcome-bot/dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/telegram-welcome-bot/.env

# 输出重定向
StandardOutput=append:/opt/telegram-welcome-bot/logs/bot.log
StandardError=append:/opt/telegram-welcome-bot/logs/error.log

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/telegram-welcome-bot/config /opt/telegram-welcome-bot/logs

[Install]
WantedBy=multi-user.target
```

### 启用和启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable telegram-welcome-bot
sudo systemctl start telegram-welcome-bot
sudo systemctl status telegram-welcome-bot
```

### 使用部署脚本

```bash
sudo ./scripts/deploy.sh systemd
```

## 环境变量配置

### 必需变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `BOT_TOKEN` | Telegram Bot Token | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `ADMIN_IDS` | 管理员用户ID列表（逗号分隔） | `123456789,987654321` |

### 可选变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `NODE_ENV` | `development` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_DIR` | `./logs` | 日志目录 |
| `CONFIG_PATH` | `./config/bot_config.json` | 配置文件路径 |
| `UPLOAD_DIR` | `./uploads` | 上传文件目录 |
| `MAX_FILE_SIZE` | `5242880` | 最大文件大小（字节） |
| `SESSION_TIMEOUT` | `30` | 会话超时时间（分钟） |
| `BACKUP_INTERVAL` | `24` | 备份间隔（小时） |

### 环境变量设置示例

#### Heroku
```bash
heroku config:set BOT_TOKEN=your_token --app your-app
heroku config:set ADMIN_IDS=123456789,987654321 --app your-app
heroku config:set LOG_LEVEL=info --app your-app
```

#### VPS (.env 文件)
```bash
BOT_TOKEN=your_bot_token_here
ADMIN_IDS=123456789,987654321
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

#### Docker
```bash
docker run -d \
  -e BOT_TOKEN=your_token \
  -e ADMIN_IDS=123456789,987654321 \
  -e NODE_ENV=production \
  telegram-welcome-bot
```

## 健康检查和监控

### 健康检查端点

应用提供了健康检查端点：

```bash
# 基本健康检查
curl http://localhost:3000/

# 详细健康状态
curl http://localhost:3000/health
```

响应示例：
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 20127496
  },
  "bot": {
    "running": true,
    "totalWelcomes": 156,
    "activeGroups": 5,
    "errorCount": 0
  }
}
```

### PM2 监控

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs telegram-bot

# 监控面板
pm2 monit

# 重启应用
pm2 restart telegram-bot
```

### Systemd 监控

```bash
# 查看状态
systemctl status telegram-welcome-bot

# 查看日志
journalctl -u telegram-welcome-bot -f

# 重启服务
systemctl restart telegram-welcome-bot
```

## 负载均衡和高可用

### 多实例部署

#### PM2 集群模式
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: './dist/index.js',
    instances: 'max', // 或指定数量
    exec_mode: 'cluster',
    // ... 其他配置
  }]
};
```

#### Docker Swarm
```yaml
version: '3.8'
services:
  telegram-bot:
    image: telegram-welcome-bot
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 数据库配置

如果使用外部数据库，配置连接：

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_bot

# MongoDB
MONGODB_URI=mongodb://localhost:27017/telegram_bot

# Redis (用于会话存储)
REDIS_URL=redis://localhost:6379
```

## SSL/TLS 配置

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Let's Encrypt 证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 故障排除

### 常见问题

#### 1. Bot Token 无效
```
错误: 401 Unauthorized
解决: 检查 BOT_TOKEN 是否正确，向 @BotFather 确认
```

#### 2. 权限不足
```
错误: 403 Forbidden
解决: 确保机器人在群组中有管理员权限
```

#### 3. 端口被占用
```
错误: EADDRINUSE
解决: 更改 PORT 环境变量或停止占用端口的进程
```

#### 4. 内存不足
```
错误: JavaScript heap out of memory
解决: 增加内存限制或优化代码
```

### 日志分析

#### 查看错误日志
```bash
# PM2
pm2 logs telegram-bot --err

# Docker
docker logs telegram-bot

# Systemd
journalctl -u telegram-welcome-bot --since "1 hour ago"
```

#### 常见日志模式
```bash
# 查找错误
grep "ERROR" logs/bot.log

# 查找 Telegram API 错误
grep "TelegramError" logs/bot.log

# 查找内存警告
grep "memory" logs/bot.log
```

### 性能优化

#### 内存优化
```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=512"

# PM2 内存限制
pm2 start dist/index.js --max-memory-restart 1G
```

#### CPU 优化
```bash
# 限制 CPU 使用（Docker）
docker run --cpus="1.0" telegram-welcome-bot

# 设置进程优先级
nice -n 10 node dist/index.js
```

### 备份和恢复

#### 自动备份
```bash
# 添加到 crontab
0 2 * * * /path/to/telegram-welcome-bot/scripts/backup.sh --compress

# PM2 启动脚本中添加备份
pm2 start dist/index.js --cron "0 2 * * *" --cron-restart
```

#### 恢复备份
```bash
# 解压备份
tar -xzf backup_20241219_020000.tar.gz

# 恢复配置
cp backup_*/config/* ./config/

# 重启应用
pm2 restart telegram-bot
```

## 安全建议

### 1. 环境变量安全
- 不要在代码中硬编码敏感信息
- 使用 `.env` 文件并添加到 `.gitignore`
- 定期轮换 Bot Token

### 2. 系统安全
- 使用非 root 用户运行应用
- 配置防火墙规则
- 定期更新系统和依赖

### 3. 网络安全
- 使用 HTTPS
- 配置适当的 CORS 策略
- 限制 API 访问频率

### 4. 数据安全
- 定期备份重要数据
- 加密敏感配置文件
- 监控异常访问

## 监控和告警

### 应用监控
```bash
# 设置 PM2 监控
pm2 install pm2-server-monit

# 使用 PM2 Plus（付费服务）
pm2 link <secret> <public>
```

### 系统监控
```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 监控磁盘使用
df -h
du -sh /path/to/app/*

# 监控内存使用
free -h
```

### 告警设置
```bash
# 内存使用告警脚本
#!/bin/bash
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "High memory usage: $MEMORY_USAGE%" | mail -s "Alert" admin@example.com
fi
```

## 总结

选择适合你需求的部署方式：

- **Heroku**: 适合快速原型和小规模应用
- **VPS + PM2**: 适合中等规模和需要更多控制的应用
- **Docker**: 适合容器化部署和微服务架构
- **Systemd**: 适合传统的 Linux 服务器部署

记住定期备份数据，监控应用性能，并保持依赖项的更新。