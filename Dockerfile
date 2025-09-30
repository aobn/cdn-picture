# 使用官方Node.js镜像作为基础镜像
FROM node:20-alpine AS base

# 安装pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建阶段
FROM base AS build

# 构建应用
RUN pnpm run build

# 生产阶段 - 使用Nginx提供静态文件服务
FROM nginx:alpine AS production

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建产物到nginx目录
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]

# 开发阶段
FROM base AS development

# 暴露开发服务器端口
EXPOSE 5173

# 启动开发服务器
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]