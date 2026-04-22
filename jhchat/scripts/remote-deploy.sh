#!/bin/bash

###############################################################################
# 江湖聊天室 - 远程服务器部署执行脚本
# 用途：SSH 登录服务器并执行部署
###############################################################################

set -e

# 配置
REMOTE_HOST="45.192.101.76"
REMOTE_USER="root"
PROJECT_ROOT="/www/jhchat"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

log_step "连接到远程服务器并执行部署"

# 在服务器上执行的命令
ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

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

log_step "江湖聊天室 - 服务器部署"

# 检查必要工具
check_prerequisites() {
    log_step "检查环境"
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warn "Docker 未安装，部分功能可能不可用"
    fi
    
    if ! command -v nginx &> /dev/null; then
        log_warn "Nginx 未安装"
    fi
    
    log_info "Node.js: $(node -v)"
    log_info "npm: $(npm -v)"
}

# 克隆或更新代码
update_code() {
    log_step "更新代码"
    
    cd /www
    
    if [ -d "games" ]; then
        log_info "更新现有代码..."
        cd games
        git pull origin 260413-feat-jhchat-refactor
    else
        log_info "克隆代码仓库..."
        git clone -b 260413-feat-jhchat-refactor --depth 1 https://github.com/peighangma-dev/games.git
        cd games
    fi
    
    log_info "代码更新完成"
}

# 创建目录
create_directories() {
    log_step "创建目录"
    
    mkdir -p /www/jhchat
    mkdir -p /www/backup/jhchat
    
    log_info "目录创建完成"
}

# 构建前端
build_frontend() {
    log_step "构建前端"
    
    cd /www/games/jhchat/frontend
    
    log_info "安装前端依赖..."
    npm install --production
    
    log_info "构建前端..."
    npm run build
    
    log_info "部署前端到 /www/jhchat..."
    rm -rf /www/jhchat/*
    cp -r dist/* /www/jhchat/
    
    log_info "前端构建完成"
}

# 部署后端
deploy_backend() {
    log_step "部署后端"
    
    cd /www/games/jhchat/backend
    
    log_info "安装后端依赖..."
    npm install --production
    
    log_info "后端部署完成"
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
    
    log_info "Nginx 配置已创建"
    
    # 测试配置
    if nginx -t; then
        log_info "Nginx 配置测试通过"
        nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
        log_info "Nginx 已重新加载"
    else
        log_error "Nginx 配置测试失败"
        exit 1
    fi
}

# 导入数据库
import_database() {
    log_step "数据库迁移"
    
    DB_SQL="/www/games/jhchat/数据库.sql"
    
    if [ -f "$DB_SQL" ]; then
        log_info "导入数据库结构..."
        
        # 检查 MySQL 容器
        if docker ps | grep -q mysql; then
            CONTAINER_NAME=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
            log_info "MySQL 容器：$CONTAINER_NAME"
            
            docker exec -i "$CONTAINER_NAME" mysql -u root -pLmPNsiGKRKLCkH48 jhchat < "$DB_SQL"
        else
            log_warn "未找到 MySQL Docker 容器，请手动导入数据库"
        fi
        
        log_info "数据库导入完成"
    else
        log_warn "未找到数据库文件：$DB_SQL"
    fi
}

# 启动后端服务
start_backend() {
    log_step "启动后端服务"
    
    cd /www/games/jhchat/backend
    
    # 检查 PM2
    if command -v pm2 &> /dev/null; then
        log_info "使用 PM2 启动..."
        pm2 delete jhchat-backend 2>/dev/null || true
        pm2 start src/server.js --name jhchat-backend
        pm2 save
        log_info "后端已通过 PM2 启动"
    else
        # 尝试使用 nohup
        log_info "使用 nohup 启动..."
        pkill -f "node.*server.js" 2>/dev/null || true
        nohup node src/server.js > /www/jhchat/backend.log 2>&1 &
        echo $! > /www/jhchat/backend.pid
        log_info "后端已启动 (PID: $(cat /www/jhchat/backend.pid))"
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
    echo "后端目录：/www/games/jhchat/backend"
    echo "前端目录：/www/jhchat"
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
    echo "  后端：tail -f /www/jhchat/backend.log"
    echo ""
}

# 主流程
check_prerequisites
update_code
create_directories
build_frontend
deploy_backend
import_database
setup_nginx
start_backend
show_info

log_info "部署完成！"
ENDSSH

log_step "部署完成"
echo ""
echo "部署到 ${REMOTE_HOST} 完成！"
echo "访问地址：http://${REMOTE_HOST}"
echo ""
