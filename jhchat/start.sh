#!/bin/bash

# 笑傲江湖聊天室 - 一键启动脚本
# 用途：自动检查环境、初始化、启动服务

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_info "Docker 和 Docker Compose 已安装"
}

# 检查环境变量文件
check_env() {
    if [ ! -f backend/.env ]; then
        log_warn "backend/.env 不存在，从 .env.example 复制"
        cp backend/.env.example backend/.env
        
        # 生成随机 JWT 密钥
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
        log_info "已生成随机 JWT 密钥"
    else
        log_info "backend/.env 已存在"
    fi
}

# 检查数据库是否已初始化
check_db_initialized() {
    local initialized=false
    
    # 尝试连接数据库检查表是否存在
    if docker-compose exec -T mysql mysql -ujhchat_root -pjhchat_root_pass -e "USE jhchat; SHOW TABLES;" &> /dev/null; then
        initialized=true
    fi
    
    if [ "$initialized" = true ]; then
        log_info "数据库已初始化"
        return 0
    else
        log_warn "数据库未初始化"
        return 1
    fi
}

# 初始化数据库
init_database() {
    log_info "等待数据库启动..."
    sleep 10
    
    log_info "初始化数据库表结构..."
    docker-compose exec -T backend node src/scripts/init-db.js
    
    log_info "插入基础数据..."
    docker-compose exec -T backend node src/scripts/seed.js
    
    log_info "数据库初始化完成"
}

# 创建管理员账户
create_admin() {
    log_info "创建默认管理员账户..."
    cat << 'EOF'
    
=====================================
  默认管理员账户：
  用户名：站长
  密码：admin123
  
  请立即修改密码！
=====================================

EOF
}

# 启动服务
start_services() {
    log_info "启动所有服务..."
    docker-compose up -d
    
    log_info "等待服务启动..."
    sleep 15
    
    # 检查服务状态
    docker-compose ps
}

# 显示访问信息
show_access_info() {
    cat << 'EOF'
    
=====================================
  服务启动成功！
  
  访问地址：http://localhost
  后端 API: http://localhost:3001/api
  数据库：localhost:3306
  
  管理员登录：
  用户名：站长
  密码：admin123
  
=====================================

EOF
}

# 主流程
main() {
    log_info "开始启动笑傲江湖聊天室..."
    
    check_docker
    check_env
    
    # 启动服务
    start_services
    
    # 检查并初始化数据库
    if ! check_db_initialized; then
        init_database
        create_admin
    fi
    
    show_access_info
    
    log_info "提示：查看日志使用 docker-compose logs -f"
    log_info "提示：停止服务使用 docker-compose down"
}

# 执行主流程
main
