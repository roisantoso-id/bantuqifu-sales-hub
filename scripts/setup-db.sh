#!/bin/bash

# Prisma + Supabase 快速启动脚本
# 用法: bash scripts/setup-db.sh

echo "🚀 Bantu CRM - Prisma + Supabase 快速启动"
echo "==========================================="
echo ""

# 检查是否已安装 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js。请先安装 Node.js 16+。"
    exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"
echo ""

# 步骤 1: 安装依赖
echo "📦 步骤 1/5: 安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖已安装"
echo ""

# 步骤 2: 检查 .env 文件
echo "🔐 步骤 2/5: 检查环境变量..."
if [ ! -f .env ]; then
    echo "❌ 缺少 .env 文件。请创建 .env 文件并配置 DATABASE_URL 和 DIRECT_URL。"
    echo ""
    echo "📝 请在 .env 中添加以下内容:"
    echo '   DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"'
    echo '   DIRECT_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"'
    exit 1
fi

if ! grep -q "DATABASE_URL" .env; then
    echo "❌ .env 中缺少 DATABASE_URL。"
    exit 1
fi

echo "✅ .env 文件已配置"
echo ""

# 步骤 3: 推送 Schema
echo "🗄️  步骤 3/5: 推送 Prisma Schema 到数据库..."
npm run prisma:push -- --skip-generate
if [ $? -ne 0 ]; then
    echo "❌ Schema 推送失败。请检查数据库连接。"
    exit 1
fi
echo "✅ Schema 已推送"
echo ""

# 步骤 4: 生成 Prisma Client
echo "🔨 步骤 4/5: 生成 Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma Client 生成失败"
    exit 1
fi
echo "✅ Prisma Client 已生成"
echo ""

# 步骤 5: 填充数据
echo "🌱 步骤 5/5: 填充初始数据..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo "⚠️  数据填充遇到问题，但基础设置已完成。"
else
    echo "✅ 初始数据已填充"
fi
echo ""

echo "==========================================="
echo "✨ 配置完成！"
echo ""
echo "📊 后续操作:"
echo "  1. 开发: npm run dev"
echo "  2. 查看数据: npm run prisma:studio"
echo "  3. 查看 Supabase: https://app.supabase.com"
echo ""
echo "📖 了解更多: 查看 PRISMA_SETUP.md"
echo ""
