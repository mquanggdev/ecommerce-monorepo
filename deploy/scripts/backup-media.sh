#!/usr/bin/env bash
# ==========================================================
# Sao lưu ảnh upload (volume media-data) ra file nén, giữ 7 bản gần nhất.
# Chạy tay hoặc đặt cron trên VPS, vd mỗi ngày 2h sáng:
#   0 2 * * * /opt/questa/scripts/backup-media.sh >> /opt/questa/backups/backup.log 2>&1
# Khôi phục: docker run --rm -v questa_media-data:/data -v /opt/questa/backups:/backup alpine \
#              sh -c "cd /data && tar xzf /backup/<tên-file>.tar.gz"
# ==========================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$BACKUP_DIR"

FILE="media-$(date +%Y%m%d-%H%M%S).tar.gz"
docker run --rm \
  -v questa_media-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine sh -c "cd /data && tar czf /backup/$FILE ."

# Giữ 7 bản mới nhất
ls -1t "$BACKUP_DIR"/media-*.tar.gz | tail -n +8 | xargs -r rm -f
echo "Đã sao lưu: $BACKUP_DIR/$FILE"
