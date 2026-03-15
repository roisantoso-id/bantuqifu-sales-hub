#!/bin/bash

# 班兔 CRM 快速部署脚本

set -e

echo "🚀 开始部署班兔 CRM..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，从模板创建...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  请编辑 .env 文件并填入实际配置${NC}"
    echo -e "${YELLOW}⚠️  编辑完成后重新运行此脚本${NC}"
    exit 1
fi

# 检查 SSL 证书
if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
    echo -e "${YELLOW}⚠️  SSL 证书不存在${NC}"
    echo -e "${YELLOW}请选择获取证书的方式：${NC}"
    echo "1) 使用 Certbot 自动获取（推荐）"
    echo "2) 手动放置证书文件"
    echo "3) 跳过（仅使用 HTTP）"
    read -p "请选择 [1-3]: " choice

    case $choice in
        1)
            echo -e "${GREEN}📜 使用 Certbot 获取证书...${NC}"
            read -p "请输入邮箱地址: " email

            # 临时启动 Nginx
            docker-compose up -d nginx

            # 获取证书
            docker run -it --rm \
                -v $(pwd)/nginx/ssl:/etc/letsencrypt \
                -v $(pwd)/nginx/certbot:/var/www/certbot \
                certbot/certbot certonly --webroot \
                -w /var/www/certbot \
                -d www.oabantuqifu.com \
                -d oabantuqifu.com \
                --email $email \
                --agree-tos \
                --no-eff-email

            # 复制证书
            sudo cp /etc/letsencrypt/live/www.oabantuqifu.com/fullchain.pem ./nginx/ssl/
            sudo cp /etc/letsencrypt/live/www.oabantuqifu.com/privkey.pem ./nginx/ssl/
            sudo chmod 644 ./nginx/ssl/*.pem

            docker-compose down
            ;;
        2)
            echo -e "${YELLOW}请将证书文件放置到以下位置：${NC}"
            echo "  - nginx/ssl/fullchain.pem"
            echo "  - nginx/ssl/privkey.pem"
            read -p "放置完成后按回车继续..."
            ;;
        3)
            echo -e "${YELLOW}⚠️  跳过 SSL 配置，仅使用 HTTP${NC}"
            ;;
    esac
fi

# 停止现有容器
echo -e "${GREEN}🛑 停止现有容器...${NC}"
docker-compose down

# 构建镜像
echo -e "${GREEN}🔨 构建 Docker 镜像...${NC}"
docker-compose build --no-cache

# 启动服务
echo -e "${GREEN}🚀 启动服务...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${GREEN}⏳ 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${GREEN}📊 检查服务状态...${NC}"
docker-compose ps

# 显示日志
echo -e "${GREEN}📝 显示最近日志...${NC}"
docker-compose logs --tail=50

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}🌐 访问地址: https://www.oabantuqifu.com${NC}"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo ""
