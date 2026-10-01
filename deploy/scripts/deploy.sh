#!/usr/bin/env bash
# ==========================================================
# Chạy trên VPS (GitHub Actions gọi qua SSH):  bash scripts/deploy.sh <IMAGE_TAG>
#
# 1. Kéo image mới từ ghcr.io
# 2. Chạy lại ecommerce + file-manager (+ nginx, certbot)
# 3. Chờ healthcheck. Không khỏe → tự quay về tag cũ và báo lỗi (exit 1)
# Ảnh upload (volume media-data) và chứng chỉ HTTPS không bị ảnh hưởng.
# ==========================================================
set -euo pipefail

NEW_TAG="${1:?Thiếu tham số IMAGE_TAG}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

COMPOSE="docker compose -f docker-compose.prod.yml"
HEALTH_TIMEOUT=180 # giây

# Đọc/ghi IMAGE_TAG trong .env để lệnh docker compose chạy tay sau này vẫn dùng đúng bản đang chạy
current_tag() { grep -E '^IMAGE_TAG=' .env | cut -d= -f2-; }
set_tag() {
  if grep -qE '^IMAGE_TAG=' .env; then
    sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=$1|" .env
  else
    echo "IMAGE_TAG=$1" >> .env
  fi
}

# Chờ tới khi mọi service có healthcheck đều "healthy"
wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT))
  while (( SECONDS < deadline )); do
    local unhealthy=0
    for service in ecommerce file-manager; do
      local id status
      id="$($COMPOSE ps -q "$service")"
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || echo missing)"
      [[ "$status" == "healthy" ]] || unhealthy=1
    done
    (( unhealthy == 0 )) && return 0
    sleep 5
  done
  return 1
}

# Xóa image cũ của dự án để ổ đĩa không đầy dần; giữ bản đang chạy và bản ngay trước (để còn quay về)
cleanup_old_images() {
  local prefix
  prefix="$(grep -E '^IMAGE_PREFIX=' .env | cut -d= -f2-)"
  for repo in "$prefix/ecommerce" "$prefix/file-manager"; do
    docker images "$repo" --format '{{.Tag}}' \
      | grep -vxF -e "$NEW_TAG" -e "${PREVIOUS_TAG:-}" -e latest \
      | xargs -r -I{} docker rmi "$repo:{}" > /dev/null 2>&1 || true
  done
  docker image prune -f > /dev/null || true
}

PREVIOUS_TAG="$(current_tag || true)"
echo "==> Deploy tag $NEW_TAG (đang chạy: ${PREVIOUS_TAG:-chưa có})"

# Kéo image trước (biến môi trường IMAGE_TAG được ưu tiên hơn .env); kéo lỗi thì dừng, .env giữ nguyên bản cũ
IMAGE_TAG="$NEW_TAG" $COMPOSE pull ecommerce file-manager

set_tag "$NEW_TAG"

# "up" tự báo lỗi khi service không khỏe (nginx chờ ecommerce healthy) nên không để set -e dừng script ở đây:
# phải chạy tiếp xuống phần quay về bản cũ
if $COMPOSE up -d --remove-orphans && wait_healthy; then
  echo "==> Deploy thành công: $NEW_TAG"
  cleanup_old_images
  exit 0
fi

echo "!!! Bản $NEW_TAG không khỏe. Log gần nhất:"
$COMPOSE logs --tail 80 ecommerce file-manager || true

if [[ -n "$PREVIOUS_TAG" && "$PREVIOUS_TAG" != "$NEW_TAG" ]]; then
  echo "==> Quay về bản trước: $PREVIOUS_TAG"
  set_tag "$PREVIOUS_TAG"
  if $COMPOSE up -d --remove-orphans && wait_healthy; then
    echo "==> Đã quay về $PREVIOUS_TAG, website vẫn chạy bản cũ"
  else
    echo "!!! Bản cũ cũng không khỏe, cần kiểm tra trên VPS"
  fi
fi
exit 1
