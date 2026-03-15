# Docker Compose 部署指南

## 前置要求

1. 安装 Docker 和 Docker Compose
2. 域名 `www.oabantuqifu.com` 已解析到服务器 IP
3. 服务器开放 80 和 443 端口

## 部署步骤

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际的数据库和 Supabase 配置
nano .env
```

### 2. 配置 Next.js 输出模式

在 `next.config.ts` 中添加：

```typescript
const nextConfig = {
  output: 'standalone',
  // ... 其他配置
}
```

### 3. 获取 SSL 证书

#### 方法一：使用 Certbot（推荐）

```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d www.oabantuqifu.com -d oabantuqifu.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/www.oabantuqifu.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/www.oabantuqifu.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/*.pem
```

#### 方法二：使用 Docker Certbot

```bash
# 临时启动 Nginx（仅 HTTP）
docker-compose up -d nginx

# 获取证书
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/nginx/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d www.oabantuqifu.com \
  -d oabantuqifu.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 停止 Nginx
docker-compose down
```

### 4. 构建和启动服务

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 5. 验证部署

访问 https://www.oabantuqifu.com 检查应用是否正常运行。

## 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f nextjs
docker-compose logs -f nginx

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 进入容器
docker-compose exec nextjs sh
docker-compose exec nginx sh
```

## SSL 证书自动续期

创建 cron 任务自动续期证书：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet && docker-compose restart nginx
```

## 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose logs nextjs
docker-compose logs nginx

# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### 2. SSL 证书问题

```bash
# 检查证书文件
ls -la ./nginx/ssl/

# 测试 Nginx 配置
docker-compose exec nginx nginx -t

# 重新加载 Nginx 配置
docker-compose exec nginx nginx -s reload
```

### 3. 数据库连接问题

```bash
# 检查环境变量
docker-compose exec nextjs env | grep DATABASE

# 测试数据库连接
docker-compose exec nextjs npx prisma db pull
```

## 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 查看日志确认更新成功
docker-compose logs -f nextjs
```

## 备份和恢复

### 备份

```bash
# 备份环境变量
cp .env .env.backup

# 备份 SSL 证书
tar -czf ssl-backup.tar.gz nginx/ssl/
```

### 恢复

```bash
# 恢复环境变量
cp .env.backup .env

# 恢复 SSL 证书
tar -xzf ssl-backup.tar.gz
```

## 监控和维护

### 查看资源使用

```bash
docker stats
```

### 清理未使用的镜像

```bash
docker system prune -a
```

### 查看 Nginx 访问日志

```bash
tail -f nginx/logs/bantuqifu-access.log
```

## 安全建议

1. 定期更新 Docker 镜像
2. 使用强密码保护数据库
3. 定期备份数据和配置
4. 监控服务器资源使用
5. 配置防火墙规则
6. 定期检查 SSL 证书有效期
