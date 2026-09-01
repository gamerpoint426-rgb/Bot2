# MC Bot Manager — Render edition

This version is prepared for Render as a Node.js Web Service. The web panel and Mineflayer bots run in the same service.

## Deploy
1. Upload this project to a GitHub repository.
2. In Render, create a New Web Service and select the repository.
3. Use `npm install` as the build command and `npm start` as the start command.
4. Set `MC_HOST`, `MC_PORT`, `MC_VERSION`, `BOT_COUNT`, `RECONNECT_DELAY`, `PANEL_PASSWORD`, and other optional variables in Render Environment.
5. Open the Render URL after deployment.

Do not commit `.env` or real passwords.

## Important
This is a Web Service because the panel needs HTTP. Render Free web services have limitations and are not a reliable choice for genuine 24/7 bot uptime. For continuous operation, use an always-on paid service. Render Background Workers are also suitable for continuous bot processes, but a separate Web Service is needed for the panel.
