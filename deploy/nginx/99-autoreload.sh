#!/bin/sh
# Chạy nền trong container Nginx: nạp lại cấu hình mỗi 12 giờ để dùng chứng chỉ HTTPS vừa được certbot gia hạn
(while :; do sleep 12h; nginx -s reload; done) &
