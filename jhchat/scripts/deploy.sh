#!/bin/bash

###############################################################################
# 江湖聊天室 - 服务器部署脚本
# 用途：将代码同步到服务器并部署
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_NAME="jhchat"
PROJECT_ROOT="/workspace/jhchat"
WEB_DEPLOY_DIR="/www/jhchat"
BACKUP_DIR="/www/backup/jhchat"
MYSQL_ROOT_PASSWORD="LmPNsiGKRKLCkH48"
MYSQL_CONTAINER_NAME="mysql80"
MYSQL_DATA_DIR="/www/dk_project/dk_app/mysql/mysql_80"
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

# 检查是否以 root 运行
check_root() {
    if [ "$(whoami)" != "root" ]; then
        log_error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# 创建必要目录
create_directories() {
    log_step "创建目录结构"
    
    mkdir -p "$WEB_DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_ROOT/deploy"
    
    log_info "Web 部署目录：$WEB_DEPLOY_DIR"
    log_info "备份目录：$BACKUP_DIR"
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
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm install --production
    
    # 构建
    log_info "构建前端..."
    npm run build
    
    # 清理部署目录
    log_info "清理部署目录..."
    rm -rf "$WEB_DEPLOY_DIR"/*
    
    # 复制构建产物
    log_info "复制前端文件..."
    cp -r dist/* "$WEB_DEPLOY_DIR/"
    
    log_info "前端构建完成"
}

# 部署后端
deploy_backend() {
    log_step "部署后端"
    
    cd "$PROJECT_ROOT/backend"
    
    # 安装依赖
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
        
        # 检查 MySQL 是否在 Docker 中运行
        if docker ps | grep -q mysql; then
            log_info "MySQL 在 Docker 中运行"
            docker exec -i "$MYSQL_CONTAINER_NAME" mysql -u root -p"$MYSQL_ROOT_PASSWORD" jhchat < "$DB_SQL"
        else
            # 假设本地 MySQL
            log_info "使用本地 MySQL"
            mysql -u root -p"$MYSQL_ROOT_PASSWORD" jhchat < "$DB_SQL"
        fi
        
        log_info "数据库导入完成"
    else
        log_warn "未找到数据库文件：$DB_SQL"
    fi
}

# 配置 Nginx
setup_nginx() {
    log_step "配置 Nginx"
    
    NGINX_CONF="/etc/nginx/sites-available/jhchat"
    NGINX_LINK="/etc/nginx/sites-enabled/jhchat"
    
    cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/jhchat;
    index index.html;
    
    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Socket.IO 需要更长的超时
        proxy_read_timeout 86400;
    }
}
EOF
    
    # 创建软链接
    if [ ! -f "$NGINX_LINK" ]; then
        ln -s "$NGINX_CONF" "$NGINX_LINK"
        log_info "Nginx 配置已创建"
    fi
    
    # 测试配置
    if nginx -t; then
        log_info "Nginx 配置测试通过"
        systemctl reload nginx
        log_info "Nginx 已重新加载"
    else
        log_error "Nginx 配置测试失败"
        exit 1
    fi
}

# 启动服务（使用 systemd 或 docker-compose）
start_services() {
    log_step "启动服务"
    
    # 检查是否使用 Docker Compose
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log_info "使用 Docker Compose 启动服务..."
        
        cd "$PROJECT_ROOT"
        docker-compose down || true
        docker-compose up -d
        
        log_info "等待服务启动..."
        sleep 10
        
        # 检查服务状态
        docker-compose ps
    else
        log_info "使用 Node.js 直接启动后端..."
        
        # 使用 PM2 管理（如果已安装）
        if command -v pm2 &> /dev/null; then
            pm2 delete jhchat-backend || true
            pm2 start "$PROJECT_ROOT/backend/src/server.js" --name jhchat-backend
            pm2 save
            log_info "后端已通过 PM2 启动"
        else
            log_warn "PM2 未安装，请手动启动后端服务"
        fi
    fi
}

# 显示部署信息
show_deployment_info() {
    log_step "部署完成"
    
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "Web 访问地址：http://$(hostname -I | awk '{print $1}')"
    echo "后端服务：http://localhost:3001"
    echo "前端目录：$WEB_DEPLOY_DIR"
    echo "备份目录：$BACKUP_DIR"
    echo ""
    echo "服务状态:"
    
    if command -v docker-compose &> /dev/null && [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        docker-compose ps
    fi
    
    if command -v pm2 &> /dev/null; then
        echo ""
        echo "PM2 进程:"
        pm2 list
    fi
    
    echo ""
    echo "查看日志:"
    echo "  前端：journalctl -u nginx -f"
    echo "  后端：pm2 logs jhchat-backend 或 docker-compose logs backend"
    echo ""
}

# 清理旧版本
cleanup_old_versions() {
    log_step "清理旧版本"
    
    # 清理 7 天前的备份
    find "$BACKUP_DIR" -name "backup_*" -mtime +7 -exec rm -rf {} \;
    log_info "已清理 7 天前的备份"
}

# 主函数
main() {
    log_step "江湖聊天室 - 服务器部署"
    
    check_root
    create_directories
    backup_current
    build_frontend
    deploy_backend
    import_database
    setup_nginx
    start_services
    cleanup_old_versions
    show_deployment_info
    
    log_info "部署完成！"
}

# 解析命令行参数
case "${1:-deploy}" in
    deploy)
        main
        ;;
    build-frontend)
        create_directories
        build_frontend
        ;;
    backup)
        backup_current
        ;;
    restore)
        if [ -n "$2" ]; then
            log_info "从备份恢复：$2"
            rm -rf "$WEB_DEPLOY_DIR"/*
            cp -r "$2"/* "$WEB_DEPLOY_DIR/"
            log_info "恢复完成"
        else
            log_error "请指定备份路径"
            exit 1
        fi
        ;;
    rollback)
        # 回滚到上一个版本
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | grep backup_ | head -2 | tail -1)
        if [ -n "$LATEST_BACKUP" ]; then
            log_info "回滚到：$LATEST_BACKUP"
            rm -rf "$WEB_DEPLOY_DIR"/*
            cp -r "$BACKUP_DIR/$LATEST_BACKUP"/* "$WEB_DEPLOY_DIR/"
            log_info "回滚完成"
        else
            log_error "未找到备份"
            exit 1
        fi
        ;;
    *)
        echo "用法：$0 {deploy|build-frontend|backup|restore|rollback}"
        exit 1
        ;;
esac
