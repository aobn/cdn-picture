# Docker 部署指南

## 快速开始

### 1. 开发环境部署

```bash
# 启动开发环境
docker-compose --profile dev up --build

# 或者直接使用Docker
docker build -t init-shadcn-dev --target development .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules init-shadcn-dev
```

访问地址：http://localhost:5173

### 2. 生产环境部署

```bash
# 启动生产环境（端口80）
docker-compose --profile prod up --build -d

# 或者启动生产环境（端口3000）
docker-compose --profile prod-custom up --build -d

# 或者直接使用Docker
docker build -t init-shadcn-prod --target production .
docker run -p 80:80 -d init-shadcn-prod
```

访问地址：
- 默认：http://localhost
- 自定义端口：http://localhost:3000

## 详细说明

### Dockerfile 说明

- **多阶段构建**：分为base、build、production、development四个阶段
- **base阶段**：安装pnpm和依赖
- **build阶段**：构建生产版本
- **production阶段**：使用Nginx提供静态文件服务
- **development阶段**：运行开发服务器

### 环境配置

#### 开发环境特点
- 热重载支持
- 源码映射
- 实时编译
- 端口：5173

#### 生产环境特点
- 静态文件服务
- Gzip压缩
- 缓存优化
- 安全头设置
- React Router支持
- 端口：80

### 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up --build

# 清理未使用的镜像
docker image prune

# 进入容器
docker exec -it <container_name> sh
```

### 自定义配置

#### 修改端口
编辑 `docker-compose.yml` 文件中的 `ports` 配置：

```yaml
ports:
  - "8080:80"  # 将容器的80端口映射到主机的8080端口
```

#### 添加环境变量
在 `docker-compose.yml` 中添加：

```yaml
environment:
  - VITE_API_URL=https://api.example.com
  - VITE_APP_TITLE=My App
```

#### API代理配置
如果需要代理API请求，取消注释 `nginx.conf` 中的API代理部分并修改后端地址。

### 生产部署建议

1. **使用HTTPS**：配置SSL证书
2. **域名配置**：修改nginx.conf中的server_name
3. **环境变量**：使用.env文件管理配置
4. **监控**：添加健康检查和日志监控
5. **备份**：定期备份重要数据

### 故障排除

#### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :5173
   # 或修改docker-compose.yml中的端口映射
   ```

2. **构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -a
   # 重新构建
   docker-compose build --no-cache
   ```

3. **权限问题**
   ```bash
   # 确保Docker有足够权限
   sudo docker-compose up
   ```

4. **内存不足**
   ```bash
   # 增加Docker内存限制
   # 在Docker Desktop中调整资源分配
   ```

### 性能优化

1. **多阶段构建**：减少最终镜像大小
2. **依赖缓存**：利用Docker层缓存
3. **Gzip压缩**：减少传输大小
4. **静态资源缓存**：提高加载速度
5. **健康检查**：确保服务可用性

## 部署到云平台

### Docker Hub
```bash
# 构建并推送到Docker Hub
docker build -t yourusername/init-shadcn .
docker push yourusername/init-shadcn
```

### 云服务器部署
```bash
# 在服务器上拉取并运行
docker pull yourusername/init-shadcn
docker run -p 80:80 -d yourusername/init-shadcn