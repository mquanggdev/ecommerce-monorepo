#!/usr/bin/env bash
# ==========================================================
# Chạy MỘT LẦN trên VPS trước lần deploy đầu tiên:  bash scripts/init-ssl.sh
# Lấy chứng chỉ HTTPS miễn phí của Let's Encrypt cho DOMAIN và www.DOMAIN.
#
# Điều kiện: bản ghi DNS A của DOMAIN và www.DOMAIN đã trỏ về IP của VPS,
# cổng 80 đang trống (Nginx chưa chạy).
# Sau đó container certbot tự gia hạn, Nginx tự nạp lại mỗi 12 giờ.
# ==========================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

# shellcheck disable=SC1091
source .env
: "${DOMAIN:?Chưa đặt DOMAIN trong .env}"
: "${LETSENCRYPT_EMAIL:?Chưa đặt LETSENCRYPT_EMAIL trong .env}"

COMPOSE="docker compose -f docker-compose.prod.yml"

if $COMPOSE run --rm --no-deps --entrypoint sh certbot -c "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
  echo "Đã có chứng chỉ cho $DOMAIN, bỏ qua."
  exit 0
fi

echo "==> Xin chứng chỉ cho $DOMAIN và www.$DOMAIN"
$COMPOSE run --rm --no-deps -p 80:80 --entrypoint certbot certbot \
  certonly --standalone \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email --non-interactive

echo "==> Xong. Bây giờ có thể deploy."
