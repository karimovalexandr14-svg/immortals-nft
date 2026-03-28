# Деплой IMMORTALS: Netlify + Jamsocket (сокет)

## 1. Фронт на Netlify (статика)

1. Зарегистрируйтесь на [netlify.com](https://www.netlify.com).
2. **Sites → Add new site → Import an existing project** → подключите GitHub/GitLab или перетащите папку проекта (**Deploy manually**).
3. Настройки сборки:
   - **Publish directory**: `.` (корень, где лежат `index.html`, картинки, `gifts-manifest.json`).
   - **Build command**: пусто или `echo skip` (файл `netlify.toml` уже задаёт это).
4. После деплоя сайт будет вида `https://что-то.netlify.app`.

### Файл `config.json` (опционально)

Когда поднимете сокет-сервер, скопируйте `config.example.json` → `config.json` в **корень** сайта (рядом с `index.html`) и подставьте URL бэкенда. Можно добавить файл в репозиторий или загрузить через Netlify **Deploys → Manual deploy**.

---

## 2. Сокет-сервер (не на Netlify)

**Netlify** отдаёт только статику; **WebSocket (Socket.io)** нужно запускать отдельно: [Jamsocket](https://jamsocket.live), Render, Fly.io, Railway и т.д.

### Вариант A: Jamsocket

1. Установите [Jamsocket CLI](https://docs.jamsocket.com/platform/quickstart) и войдите в аккаунт.
2. В папке `server/` есть `Dockerfile` и `server.js`.
3. Соберите образ и задеплойте по [документации Jamsocket](https://docs.jamsocket.com/) (образ Docker с `EXPOSE 3000`, `CMD ["node","server.js"]`).
4. Получите **публичный URL** (wss/https) сервиса.
5. В `config.json` на фронте укажите этот URL в поле `socketUrl` (когда подключите клиент в `index.html`).

### Вариант B: Render / Railway / Fly

1. Создайте **Web Service** из репозитория, **Root directory**: `server`.
2. **Build**: `npm install` → **Start**: `node server.js`.
3. Укажите переменную `PORT` (платформа часто задаёт сама).
4. Включите **WebSocket** в настройках сервиса, если есть переключатель.

---

## 3. Что сделать вам по шагам

| Шаг | Действие |
|-----|----------|
| 1 | Залить проект на GitHub или архивом в Netlify. |
| 2 | Положить в корень **`top.png`** (иконка вкладки «Топ»). |
| 3 | Проверить сайт: маркет, профиль, офлайн-режим. |
| 4 | (Позже) Задеплоить папку **`server/`** на Jamsocket или Render. |
| 5 | Создать **`config.json`** с `socketUrl` и подключить клиент Socket.io в игре (заготовка под это в проекте описана в коде). |

---

## 4. Ограничения

- Без сокета маркет и профиль работают **локально в браузере** (`localStorage`), как сейчас.
- Общий маркет и трейды между игроками появятся только после **реального** подключения фронта к `server.js` по Socket.io и синхронизации событий с вашим UI.
