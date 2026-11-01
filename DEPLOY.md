# Быстрый запуск: почему не работают рейтинг и друзья

Vercel отдаёт только статичный сайт. Сервер (аккаунты, друзья, рейтинг, SQLite) на Vercel не запускается, поэтому приложение работает в офлайн-режиме на localStorage. Нужен отдельный сервер с постоянным диском. Он уже готов: `Dockerfile` собирает сайт и API в один контейнер.

## Вариант A. Всё на одном сервере (проще всего)
1. Залейте проект в GitHub.
2. Render: New → Blueprint → репозиторий (читает `render.yaml`). Либо Railway / Fly.io: деплой из Dockerfile + том, смонтированный в `/data`.
3. Переменные: `DATA_DIR=/data`, `TRUST_PROXY=1`, `ADMIN_USERS=ваш_логин`.
4. Откройте выданный адрес. Рейтинг и друзья заработают сразу, Vercel не нужен.

## Вариант B. Сайт на Vercel, сервер отдельно
1. Задеплойте сервер, как в варианте A, и скопируйте его адрес.
2. В `vercel.json` замените `ЗАМЕНИТЕ-НА-АДРЕС-СЕРВЕРА` на этот адрес (например `gas.onrender.com`, с `https://`).
3. Сделайте redeploy на Vercel. Запросы `/api/*` пойдут на ваш сервер, CORS настраивать не нужно.

Проверка: `https://ваш-сайт/api/health` должен вернуть `{"ok":true,...}`.

**Важно:** без постоянного диска база стирается при каждом перезапуске. Бесплатные тарифы без диска не подходят.

---

# GAS / GeoPath — Чек-лист перед деплоем

## 1. Environment variables

| Variable | Where | Example | Required |
|----------|-------|---------|----------|
| `VITE_API_URL` | Frontend build | `https://api.yourdomain.com` or empty (same origin) | No (defaults to same origin) |
| `PORT` | Server | `8787` | No |
| `DATABASE_URL` / SQLite path | Server | see `server/db.js` | Yes for production |
| JWT / session secret | Server | strong random string | Yes |
| Telegram bot token (if Stars) | Server | from @BotFather | Only if payments |

Create `.env` / `.env.production` — never commit secrets.

## 2. Frontend (Vite)

```bash
npm ci
npm run build          # → dist/
npm run check          # content integrity
```

- PWA: `public/manifest.webmanifest` + `icon.svg` already present.
- Ensure `index.html` has correct `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` for safe-area.
- Theme init: `public/theme-init.js` runs before paint (FOUC prevention).

## 3. Backend

```bash
npm run server         # or node server/index.js
```

- Health: `GET /api/health` → `{ ok: true }`
- CORS: allow your frontend origin
- Rate-limit auth endpoints
- Pro status is **server-authoritative** — never trust client `state.pro` alone for gated content

## 4. Nginx / reverse proxy (example)

```nginx
server {
  listen 443 ssl http2;
  server_name gas.example.com;

  root /var/www/gas/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

## 5. Vercel / static hosting

- Build command: `npm run build`
- Output: `dist`
- Rewrites: `/api/*` → your backend URL
- SPA fallback: all routes → `index.html`

## 6. Pre-flight smoke tests

- [ ] Open on iPhone Safari 320–430px — no overlapping buttons, nav above home indicator
- [ ] Placement test completes → plan with level + weak spots
- [ ] Offline: kill network → localStorage still works, no white screen
- [ ] 401 → token cleared, redirect to auth
- [ ] Lesson / Blitz / Atlas crash isolated by ErrorBoundary
- [ ] Pro content gated on server
- [ ] `npm run check` passes
- [ ] Dark / light / auto theme switch without flash

## 7. Performance

- Lazy-load Atlas, WorldMap, Leaderboard if not already (React.lazy + Suspense)
- Images: prefer WebP / SVG; QImage already handles fallbacks
- Keep bundle under ~300 KB gzipped for main chunk

## 8. Security

- HTTPS only
- HttpOnly / Secure cookies if you move sessions off localStorage
- CSP headers recommended
- Sanitize any user-generated profile fields on server

## Автоперевод (английский / казахский)
Всё, чего нет в словарях, приложение само переводит через сервер и кэширует в `data/translations.json`.
Нужна одна переменная окружения (любая из двух):
- `GOOGLE_TRANSLATE_KEY` — Google Cloud Translation (en + kk, 500 тыс. символов в месяц бесплатно);
- `DEEPL_KEY` — DeepL API Free (только английский, 500 тыс. символов в месяц бесплатно).
Дневной лимит символов: `TRANSLATE_DAILY_CHARS` (по умолчанию 300000). Без ключа всё работает как раньше.
