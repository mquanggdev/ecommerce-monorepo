#!/usr/bin/env bash
# ==========================================================
# Dựng VPS Ubuntu mới - chạy MỘT LẦN bằng root:
#   sudo bash setup-vps.sh "<public key SSH dùng cho GitHub Actions>"
#
# - Cài Docker + Docker Compose plugin
# - Tạo user "deploy" (không có mật khẩu, chỉ đăng nhập bằng SSH key) thuộc nhóm docker
# - Tường lửa: chỉ mở SSH, 80, 443 (cổng 3000/4000 của app không mở ra ngoài)
# - Thêm swap 1GB nếu VPS chưa có (Chromium xuất PDF cần thêm RAM lúc cao điểm)
# - Giới hạn log hệ thống 200MB để không đầy ổ đĩa
# - Tạo thư mục /opt/questa cho file deploy
# ==========================================================
set -euo pipefail

DEPLOY_PUBLIC_KEY="${1:?Truyền public key SSH của GitHub Actions làm tham số đầu tiên}"
APP_DIR=/opt/questa

echo "==> Cập nhật hệ thống"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl ufw

echo "==> Cài Docker"
if ! command -v docker > /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "==> Tạo user deploy"
if ! id deploy > /dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
grep -qxF "$DEPLOY_PUBLIC_KEY" /home/deploy/.ssh/authorized_keys 2>/dev/null \
  || echo "$DEPLOY_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

echo "==> Thư mục ứng dụng $APP_DIR"
install -d -m 750 -o deploy -g deploy "$APP_DIR" "$APP_DIR/env" "$APP_DIR/backups"

echo "==> Tường lửa"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Swap"
# VPS đã có swap (file hay phân vùng, tên gì cũng được) thì giữ nguyên.
# Chưa có thì tạo 1GB, chỉ khi ổ đĩa còn trống trên 5GB để không lấn chỗ của Docker.
if [ -n "$(swapon --show --noheadings)" ]; then
  echo "    Đã có swap: $(swapon --show --noheadings | awk '{print $1" "$3}' | tr '\n' ' ')"
else
  free_kb=$(df --output=avail / | tail -1)
  if [ "$free_kb" -gt $((5 * 1024 * 1024)) ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  else
    echo "    Bỏ qua tạo swap: ổ đĩa còn dưới 5GB"
  fi
fi

echo "==> Giới hạn log hệ thống (journal) ở 200MB"
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=200M\n' > /etc/systemd/journald.conf.d/size.conf
systemctl restart systemd-journald

echo "==> Xong. Lấy dòng known_hosts cho GitHub secret VPS_SSH_KNOWN_HOSTS bằng lệnh (chạy trên máy bạn):"
echo "    ssh-keyscan -H <IP VPS>"
