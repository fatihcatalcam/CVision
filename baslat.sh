#!/bin/bash
echo "CVision Sunuculari Baslatiliyor..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Eski processleri temizle
echo "Eski processler temizleniyor..."
lsof -ti :8001 | xargs kill -9 2>/dev/null && echo "  Port 8001 temizlendi." || true
lsof -ti :5173 | xargs kill -9 2>/dev/null && echo "  Port 5173 temizlendi." || true
sleep 1

echo "Backend (FastAPI) baslatiliyor..."
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
  npm run dev -- --host --port 5173
) &
FRONTEND_PID=$!

echo ""
echo "Islem tamam! Sunucularin hazir olmasi birkac saniye surebilir."
echo "  Backend : http://localhost:8001"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Sunuculari durdurmak icin Ctrl+C basin."

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

wait
