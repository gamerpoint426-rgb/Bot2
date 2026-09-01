# Minecraft Bot Manager

A small Node.js + Mineflayer multi-bot manager with a mobile-friendly web panel.

## Requirements

- Node.js 18+ (Node.js LTS recommended)
- A Minecraft server you control / are authorized to keep bots connected to
- Internet access from the machine running the bot manager

## Termux installation

```bash
pkg update && pkg upgrade
pkg install nodejs-lts
```

Check:

```bash
node -v
npm -v
```

## Install

Extract this project, then:

```bash
cd mc-bot-manager
npm install
cp .env.example .env
nano .env
```

Set at least:

```env
MC_HOST=your-server.example
MC_PORT=25565
MC_VERSION=1.21.11
BOT_COUNT=1
RECONNECT_DELAY=10000
PANEL_PORT=3000
```

Set `PANEL_PASSWORD` if the panel will be exposed beyond localhost.

Then:

```bash
npm start
```

Open on the same phone:

```text
http://127.0.0.1:3000
```

## More bots

You can either use the panel's Bots count field or change:

```env
BOT_COUNT=5
```

Then restart the program.

The panel supports up to 100 configured bot records, but the practical limit depends on your server and the device/VPS running the bots. Increase gradually.

## Reconnect behavior

A normal disconnect causes the manager to wait `RECONNECT_DELAY` milliseconds, then reconnect. With:

```env
RECONNECT_DELAY=10000
```

the delay is 10 seconds.

A fresh random name is selected for each connection.

## Authentication

This example uses offline-mode Mineflayer accounts. If your server requires `/login`, set:

```env
LOGIN_COMMAND=/login YOUR_PASSWORD
LOGIN_DELAY=2500
```

Do not put a real password in a file you share publicly.

For online-mode/Microsoft-auth accounts, use the appropriate Mineflayer authentication setup instead of treating the account as offline mode.

## Resource packs

Mineflayer bots can encounter servers that require resource packs. Resource-pack handling depends on the server configuration and Mineflayer version. If your server blocks players until a pack is accepted, configure the server's bot/player policy appropriately rather than trying to bypass a required acceptance step.

## Keeping Termux alive

Android may stop background processes. For testing, keep Termux open. On supported devices you can also disable battery optimization for Termux.

For real 24/7 operation, a VPS/Linux host is more reliable.

## Security

Do not expose the panel publicly without a password and preferably a firewall/reverse proxy. Port 3000 is the web panel, not the Minecraft port.

This project is intended for servers you own or have permission to automate.
