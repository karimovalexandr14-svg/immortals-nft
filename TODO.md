# Деплой WebSocket для IMMORTALS (онлайн маркет/трейд)

## ✅ 1. [COMPLETE] Создан TODO.md
Status: Done

## ✅ 2. [COMPLETE] Install deps в server/
```powershell
powershell "cd server; npm install"
```
Status: Done (90 pkgs, 0 vulns).


## ✅ 3. [COMPLETE] Локальный тест backend
```powershell
powershell "cd server; npm start"
```
Status: Running on port 3000 (active terminal).

## ✅ 4. [COMPLETE] Create config.json
Status: Created with ws://localhost:3000 (local test ready).

## ⏳ 5. GitHub repo (веб-интерфейс, без Git)
**На github.com (логин/регистрация):**
1. New Repository → `immortals-nft` (public) → Create
2. Кнопка "Upload files" → выбрать все файлы из проекта (кроме .git, node_modules)
3. Commit message: "Initial IMMORTALS + server"
4. Commit files
5. Скопировать URL: `https://github.com/YOUR_USERNAME/immortals-nft`

## ⏳ 6. Deploy Railway (GitHub)
**На railway.app:**
1. Sign Up (GitHub + Authorize) / Login
2. New Project → Deploy from GitHub repo
3. Выбрать `immortals-nft`
4. Выбрать "server" folder (root service)
5. Deploy (автоматический)
6. Скопировать URL (вкладка Deployments → open service)
7. Полный URL: `wss://immortals-nft.up.railway.app` (или свой)

## ⏳ 7. Update config.json
Локально отредактировать (или через GitHub web):
```json
{"socketUrl": "wss://immortals-nft.up.railway.app"}
```
(заменить на реальный URL от Railway)

## ⏳ 8. Deploy frontend Netlify
**На netlify.com:**
1. Drag-n-drop весь проект (или его папку с config.json) на netlify.com
2. Деплоится автоматический → получишь URL (https://immortals-xxxx.netlify.app)
3. config.json должен быть в корне папки для fetch

## ⏳ 9. Тест онлайн
2 браузера → trade/market синхронизируется через WebSocket (Railway)

## ✅ COMPLETE
[ ] All steps done → attempt_completion
