#!/bin/bash

###############################################################################
# 江湖聊天室 - 服务器快速部署脚本
# 用途：在目标服务器上直接运行此脚本完成部署
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_ROOT="/www/games/jhchat"
WEB_DEPLOY_DIR="/www/jhchat"
BACKUP_DIR="/www/backup/jhchat"
MYSQL_ROOT_PASSWORD="LmPNsiGKRKLCkH48"
MYSQL_CONTAINER_NAME="mysql80"
DB_NAME="jhchat"
DATE=$(date +%Y%m%d_%H%M%S)

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

# 检查环境
check_environment() {
    log_step "检查环境"
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        log_info "请执行：curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_info "Node.js: $(node -v)"
    log_info "npm: $(npm -v)"
    
    if command -v docker &> /dev/null; then
        log_info "Docker: $(docker --version)"
        if docker ps | grep -q mysql; then
            MYSQL_CONTAINER_NAME=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
            log_info "MySQL 容器：$MYSQL_CONTAINER_NAME"
        fi
    fi
}

# 创建目录
create_directories() {
    log_step "创建目录"
    
    mkdir -p "$WEB_DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_ROOT/deploy"
    
    log_info "目录创建完成"
}

# 备份现有部署
backup_current() {
    log_step "备份当前部署"
    
    if [ -d "$WEB_DEPLOY_DIR" ] && [ "$(ls -A $WEB_DEPLOY_DIR)" ]; then
        BACKUP_PATH="$BACKUP_DIR/backup_$DATE"
        cp -r "$WEB_DEPLOY_DIR" "$BACKUP_PATH"
        log_info "已备份到：$BACKUP_PATH"
        
        # 保留最近 7 个备份
        cd "$BACKUP_DIR"
        ls -dt backup_* 2>/dev/null | tail -n +8 | xargs -r rm -rf
    else
        log_info "首次部署，无需备份"
    fi
}

# 构建前端
build_frontend() {
    log_step "构建前端"
    
    cd "$PROJECT_ROOT/frontend"
    
    log_info "安装前端依赖..."
    npm install --production
    
    log_info "构建前端..."
    npm run build
    
    log_info "清理部署目录..."
    rm -rf "$WEB_DEPLOY_DIR"/*
    
    log_info "复制前端文件..."
    cp -r dist/* "$WEB_DEPLOY_DIR/"
    
    log_info "前端构建完成"
}

# 部署后端
deploy_backend() {
    log_step "部署后端"
    
    cd "$PROJECT_ROOT/backend"
    
    log_info "安装后端依赖..."
    npm install --production
    
    log_info "后端部署完成"
}

# 导入数据库
import_database() {
    log_step "数据库迁移"
    
    DB_SQL="$PROJECT_ROOT/数据库.sql"
    
    if [ -f "$DB_SQL" ]; then
        log_info "导入数据库结构..."
        
        if docker ps | grep -q mysql; then
            log_info "MySQL 在 Docker 中运行"
            docker exec -i "$MYSQL_CONTAINER_NAME" mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
            docker exec -i "$MYSQL_CONTAINER_NAME" mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < "$DB_SQL"
        else
            log_warn "未找到 MySQL Docker 容器，请手动导入数据库"
        fi
        
        log_info "数据库导入完成"
    else
        log_warn "未找到数据库文件：$DB_SQL"
    fi
}

# 配置 Nginx
setup_nginx() {
    log_step "配置 Nginx"
    
    NGINX_CONF="/etc/nginx/conf.d/jhchat.conf"
    
    cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /www/jhchat;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_read_timeout 86400;
    }
}
EOF
    
    log_info "Nginx 配置已创建"
    
    if nginx -t; then
        log_info "Nginx 配置测试通过"
        nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
        log_info "Nginx 已重新加载"
    else
        log_error "Nginx 配置测试失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_step "启动后端服务"
    
    cd "$PROJECT_ROOT/backend"
    
    if command -v pm2 &> /dev/null; then
        log_info "使用 PM2 启动..."
        pm2 delete jhchat-backend 2>/dev/null || true
        pm2 start src/server.js --name jhchat-backend
        pm2 save
        log_info "后端已通过 PM2 启动"
    else
        log_info "使用 nohup 启动..."
        pkill -f "node.*server.js" 2>/dev/null || true
        nohup node src/server.js > "$WEB_DEPLOY_DIR/backend.log" 2>&1 &
        echo $! > "$WEB_DEPLOY_DIR/backend.pid"
        log_info "后端已启动 (PID: $(cat $WEB_DEPLOY_DIR/backend.pid))"
    fi
}

# 显示部署信息
show_info() {
    log_step "部署完成"
    
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "Web 访问地址：http://45.192.101.76"
    echo "后端目录：$PROJECT_ROOT/backend"
    echo "前端目录：$WEB_DEPLOY_DIR"
    echo ""
    echo "服务状态:"
    
    if command -v pm2 &> /dev/null; then
        pm2 list
    else
        ps aux | grep "node.*server.js" | grep -v grep
    fi
    
    echo ""
    echo "查看日志:"
    echo "  前端：tail -f /var/log/nginx/access.log"
    echo "  后端：tail -f $WEB_DEPLOY_DIR/backend.log"
    echo ""
}

# 主流程
main() {
    log_step "江湖聊天室 - 快速部署"
    
    check_environment
    create_directories
    backup_current
    build_frontend
    deploy_backend
    import_database
    setup_nginx
    start_services
    show_info
    
    log_info "部署完成！"
}

# 运行
main
