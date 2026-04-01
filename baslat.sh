#!/bin/bash
echo "CVision Sunuculari Baslatiliyor..."

# Script'in bulunduğu dizin
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Backend (FastAPI) baslatiliyor..."
# macOS/Linux için virtual env aktivasyonu ve uvicorn başlatma
(
  cd "$SCRIPT_DIR/backend" || exit
  if [ -d "cv_env_313" ]; then
    source cv_env_313/bin/activate
  elif [ -d ".venv" ]; then
    source .venv/bin/activate
  elif [ -d "venv" ]; then
    source venv/bin/activate
  else
    echo "UYARI: Virtual environment bulunamadi! Sistem Python kullaniliyor."
  fi
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
) &
BACKEND_PID=$!

echo "Frontend (Vite/React) baslatiliyor..."
(
  cd "$SCRIPT_DIR/frontend" || exit
  npm run dev -- --host
) &
FRONTEND_PID=$!

echo ""
echo "Islem tamam! Sunucularin hazir olmasi birkac saniye surebilir."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Sunuculari durdurmak icin Ctrl+C basin."

# Ctrl+C ile her iki süreci de temiz kapatma
cleanup() {
  echo ""
  echo "Sunucular durduruluyor..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID 2>/dev/null
  wait $FRONTEND_PID 2>/dev/null
  echo "Sunucular durduruldu."
  exit 0
}

trap cleanup SIGINT SIGTERM

# Her iki süreç de çalışırken bekle
wait
