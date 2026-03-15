# 班兔 CRM 销售管理系统 - Docker 部署

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/roisantoso-id/bantuqifu-sales-hub.git
cd bantuqifu-sales-hub
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

填入以下配置：
- `DATABASE_URL`: Supabase 数据库连接字符串
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥

### 3. 运行部署脚本

```bash
./deploy.sh
```

脚本会自动：
- 检查 Docker 环境
- 获取 SSL 证书（可选）
- 构建 Docker 镜像
- 启动服务

### 4. 访问应用

打开浏览器访问：https://www.oabantuqifu.com

## 手动部署

如果不使用自动脚本，可以手动执行以下步骤：

### 1. 获取 SSL 证书

```bash
# 使用 Certbot
sudo certbot certonly --standalone \
  -d www.oabantuqifu.com \
  -d oabantuqifu.com

# 复制证书
sudo cp /etc/letsencrypt/live/www.oabantuqifu.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/www.oabantuqifu.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/*.pem
```

### 2. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 服务管理

### 查看状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f nextjs
docker-compose logs -f nginx
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart nextjs
docker-compose restart nginx
```

### 停止服务

```bash
docker-compose down
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 架构说明

```
Internet
    ↓
Nginx (443/80)
    ↓
Next.js App (3000)
    ↓
Supabase (PostgreSQL)
```

### 组件说明

- **Nginx**: 反向代理，处理 SSL/TLS，静态资源缓存
- **Next.js**: 应用服务器，运行在 Node.js 20
- **Supabase**: 托管的 PostgreSQL 数据库

## 目录结构

```
.
├── Dockerfile              # Next.js 应用 Docker 配置
├── docker-compose.yml      # Docker Compose 配置
├── deploy.sh              # 自动部署脚本
├── nginx/
│   ├── nginx.conf         # Nginx 主配置
│   ├── conf.d/
│   │   └── bantuqifu.conf # 站点配置
│   ├── ssl/               # SSL 证书目录
│   └── logs/              # 日志目录
├── .env                   # 环境变量（需创建）
└── .env.example           # 环境变量模板
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs nextjs

# 检查配置
docker-compose config
```

### SSL 证书问题

```bash
# 测试 Nginx 配置
docker-compose exec nginx nginx -t

# 重新加载配置
docker-compose exec nginx nginx -s reload
```

### 端口被占用

```bash
# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果安装了 Apache
```

## 性能优化

### 1. 启用 Gzip 压缩

已在 `nginx.conf` 中配置。

### 2. 静态资源缓存

已在 `nginx/conf.d/bantuqifu.conf` 中配置：
- `_next/static`: 缓存 60 分钟
- 图片和字体: 缓存 1 年

### 3. HTTP/2

已启用 HTTP/2 支持。

## 安全建议

1. **定期更新**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. **SSL 证书续期**
   ```bash
   # 添加 cron 任务
   0 2 * * * certbot renew --quiet && docker-compose restart nginx
   ```

3. **备份数据**
   ```bash
   # 备份环境变量
   cp .env .env.backup

   # 备份 SSL 证书
   tar -czf ssl-backup.tar.gz nginx/ssl/
   ```

4. **监控日志**
   ```bash
   tail -f nginx/logs/bantuqifu-access.log
   tail -f nginx/logs/bantuqifu-error.log
   ```

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **部署**: Docker, Nginx

## 支持

如有问题，请查看：
- [部署文档](./DEPLOYMENT.md)
- [GitHub Issues](https://github.com/roisantoso-id/bantuqifu-sales-hub/issues)

## 许可证

Private - All Rights Reserved
