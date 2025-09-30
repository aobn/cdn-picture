#!/bin/bash

# Docker镜像加速器配置脚本

echo "正在配置Docker镜像加速器..."

# 创建Docker配置目录
sudo mkdir -p /etc/docker

# 备份原有配置
if [ -f /etc/docker/daemon.json ]; then
    sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    echo "已备份原有配置到 /etc/docker/daemon.json.backup"
fi

# 创建新的配置文件
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://dockerproxy.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  }
}
EOF

echo "Docker配置文件已更新"

# 重启Docker服务
echo "正在重启Docker服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 检查Docker状态
if sudo systemctl is-active --quiet docker; then
    echo "✅ Docker服务重启成功"
    echo "✅ 镜像加速器配置完成"
    echo ""
    echo "配置的镜像源："
    echo "- 中科大镜像源: https://docker.mirrors.ustc.edu.cn"
    echo "- 网易镜像源: https://hub-mirror.c.163.com"
    echo "- 百度镜像源: https://mirror.baidubce.com"
    echo "- DockerProxy: https://dockerproxy.com"
else
    echo "❌ Docker服务重启失败，请手动检查"
fi

echo ""
echo "现在可以尝试运行："
echo "docker-compose -f docker-compose.local.yml --profile dev up --build"