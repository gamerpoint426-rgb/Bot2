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
\n## Change server from the panel\n\nUse **🌐 Server Connection** in the web panel to change the Minecraft hostname/IP, port, and version. Press **Save & Reconnect** and enabled bots reconnect to the new target. This runtime setting resets to the Render environment variables if the service restarts.\n
### Sequential bot names
Bots use stable sequential names from `BOT_NAME_PREFIX`, such as `GP_Bot1`, `GP_Bot2`, `GP_Bot3`. A reconnect keeps the same bot number/name. Adding a bot uses the next free number. The panel also keeps an opened Logs window open across automatic refreshes and does not overwrite the Bot Count field while you are typing.
