require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const mineflayer = require("mineflayer");

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || process.env.PANEL_PORT || 3000);
const HOST = process.env.PANEL_HOST || "0.0.0.0";
const MC_HOST = process.env.MC_HOST || "localhost";
const MC_PORT = Number(process.env.MC_PORT || 25565);
const MC_VERSION = process.env.MC_VERSION || false;
const RECONNECT_DELAY = Math.max(1000, Number(process.env.RECONNECT_DELAY || 10000));
const LOGIN_DELAY = Math.max(500, Number(process.env.LOGIN_DELAY || 2500));
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "";
const JOIN_COMMAND = process.env.JOIN_COMMAND || "";
const LOGIN_COMMAND = process.env.LOGIN_COMMAND || "";

const configuredNames = (process.env.BOT_NAMES || "GP_AFK")
  .split(",").map(s => s.trim()).filter(Boolean);

const botCount = Math.max(0, Number(process.env.BOT_COUNT || 1));
const bots = new Map();

function makeId() {
  return crypto.randomBytes(4).toString("hex");
}

function randomName() {
  const base = configuredNames[Math.floor(Math.random() * configuredNames.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}_${suffix}`;
}

function now() {
  return new Date().toISOString();
}

function publicState(b) {
  return {
    id: b.id,
    name: b.name,
    status: b.status,
    enabled: b.enabled,
    connectedAt: b.connectedAt,
    lastDisconnect: b.lastDisconnect,
    reconnects: b.reconnects,
    lastError: b.lastError,
    lastEvent: b.lastEvent,
    createdAt: b.createdAt
  };
}

function addLog(b, message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  b.logs.push(line);
  if (b.logs.length > 100) b.logs.shift();
  b.lastEvent = message;
  console.log(`[${b.name}] ${message}`);
}

function createBotRecord(id) {
  return {
    id,
    name: randomName(),
    status: "stopped",
    enabled: true,
    connectedAt: null,
    lastDisconnect: null,
    reconnects: 0,
    lastError: null,
    lastEvent: "Created",
    createdAt: now(),
    logs: [],
    bot: null,
    timer: null,
    generation: 0
  };
}

function connect(id) {
  const b = bots.get(id);
  if (!b || !b.enabled) return;

  if (b.timer) {
    clearTimeout(b.timer);
    b.timer = null;
  }

  if (b.bot) {
    try { b.bot.quit("reconnecting"); } catch {}
    b.bot = null;
  }

  b.generation++;
  const generation = b.generation;
  b.name = randomName();
  b.status = "connecting";
  b.lastError = null;
  addLog(b, `Connecting as ${b.name} to ${MC_HOST}:${MC_PORT}`);

  const options = {
    host: MC_HOST,
    port: MC_PORT,
    username: b.name,
    auth: "offline"
  };
  if (MC_VERSION && MC_VERSION !== "auto") options.version = MC_VERSION;

  let bot;
  try {
    bot = mineflayer.createBot(options);
  } catch (err) {
    b.lastError = err.message;
    b.status = "offline";
    addLog(b, `Create error: ${err.message}`);
    scheduleReconnect(b, generation);
    return;
  }

  b.bot = bot;

  bot.once("spawn", () => {
    if (generation !== b.generation) return;
    b.status = "online";
    b.connectedAt = now();
    addLog(b, "Spawned / online");

    if (JOIN_COMMAND) setTimeout(() => {
      if (generation === b.generation && b.bot === bot) bot.chat(JOIN_COMMAND);
    }, LOGIN_DELAY);

    if (LOGIN_COMMAND) setTimeout(() => {
      if (generation === b.generation && b.bot === bot) bot.chat(LOGIN_COMMAND);
    }, LOGIN_DELAY);
  });

  bot.on("chat", (username, message) => {
    if (username !== b.name) addLog(b, `Chat <${username}> ${message}`);
  });

  bot.on("kicked", reason => {
    if (generation !== b.generation) return;
    b.lastDisconnect = now();
    addLog(b, `Kicked: ${String(reason)}`);
  });

  bot.on("error", err => {
    if (generation !== b.generation) return;
    b.lastError = err.message || String(err);
    addLog(b, `Error: ${b.lastError}`);
  });

  bot.on("end", reason => {
    if (generation !== b.generation) return;
    b.status = "offline";
    b.connectedAt = null;
    b.lastDisconnect = now();
    b.bot = null;
    addLog(b, `Disconnected: ${reason || "connection ended"}`);
    scheduleReconnect(b, generation);
  });
}

function scheduleReconnect(b, generation) {
  if (!b.enabled || generation !== b.generation) return;
  if (b.timer) clearTimeout(b.timer);
  b.reconnects++;
  addLog(b, `Reconnecting in ${Math.round(RECONNECT_DELAY / 1000)}s`);
  b.timer = setTimeout(() => {
    b.timer = null;
    if (b.enabled && generation === b.generation) connect(b.id);
  }, RECONNECT_DELAY);
}

function stopBot(id) {
  const b = bots.get(id);
  if (!b) return;
  b.enabled = false;
  b.generation++;
  if (b.timer) clearTimeout(b.timer);
  b.timer = null;
  if (b.bot) {
    try { b.bot.quit("stopped from panel"); } catch {}
  }
  b.bot = null;
  b.status = "stopped";
  b.connectedAt = null;
  addLog(b, "Stopped from panel");
}

function startBot(id) {
  const b = bots.get(id);
  if (!b) return;
  b.enabled = true;
  b.generation++;
  addLog(b, "Starting");
  connect(id);
}

function ensureCount(count) {
  count = Math.max(0, Math.min(100, Number(count) || 0));
  while (bots.size < count) {
    const id = `bot-${makeId()}`;
    bots.set(id, createBotRecord(id));
  }
  while (bots.size > count) {
    const id = [...bots.keys()].pop();
    stopBot(id);
    bots.delete(id);
  }
}

for (let i = 0; i < botCount; i++) {
  const id = `bot-${i + 1}`;
  bots.set(id, createBotRecord(id));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function authorized(req, res, next) {
  if (!PANEL_PASSWORD) return next();
  if (req.headers["x-panel-password"] === PANEL_PASSWORD) return next();
  return res.status(401).json({ error: "Panel password required" });
}

app.get("/health", (req, res) => res.status(200).send("ok"));

app.get("/api/state", authorized, (req, res) => {
  res.json({
    server: { host: MC_HOST, port: MC_PORT, version: MC_VERSION || "auto" },
    reconnectDelay: RECONNECT_DELAY,
    bots: [...bots.values()].map(publicState)
  });
});

app.get("/api/logs/:id", authorized, (req, res) => {
  const b = bots.get(req.params.id);
  if (!b) return res.status(404).json({ error: "Bot not found" });
  res.json({ id: b.id, name: b.name, logs: b.logs });
});

app.post("/api/bots/:id/start", authorized, (req, res) => {
  if (!bots.has(req.params.id)) return res.status(404).json({ error: "Bot not found" });
  startBot(req.params.id);
  res.json({ ok: true });
});

app.post("/api/bots/:id/stop", authorized, (req, res) => {
  if (!bots.has(req.params.id)) return res.status(404).json({ error: "Bot not found" });
  stopBot(req.params.id);
  res.json({ ok: true });
});

app.post("/api/start-all", authorized, (req, res) => {
  for (const id of bots.keys()) startBot(id);
  res.json({ ok: true });
});

app.post("/api/stop-all", authorized, (req, res) => {
  for (const id of bots.keys()) stopBot(id);
  res.json({ ok: true });
});

app.post("/api/bots/count", authorized, (req, res) => {
  ensureCount(req.body.count);
  res.json({ ok: true, count: bots.size });
});

app.post("/api/bots", authorized, (req, res) => {
  const id = `bot-${makeId()}`;
  bots.set(id, createBotRecord(id));
  res.json(publicState(bots.get(id)));
});

app.delete("/api/bots/:id", authorized, (req, res) => {
  if (!bots.has(req.params.id)) return res.status(404).json({ error: "Bot not found" });
  stopBot(req.params.id);
  bots.delete(req.params.id);
  res.json({ ok: true });
});

server.listen(PORT, HOST, () => {
  console.log(`Web panel: http://127.0.0.1:${PORT}`);
  console.log(`Minecraft target: ${MC_HOST}:${MC_PORT}`);
  console.log(`Reconnect delay: ${RECONNECT_DELAY} ms`);
  console.log(`Bots configured: ${bots.size}`);
  console.log(`Panel password: ${PANEL_PASSWORD ? "enabled" : "disabled"}`);

  // Start enabled bots after the panel is ready.
  setTimeout(() => {
    for (const id of bots.keys()) connect(id);
  }, 1000);
});

function shutdown() {
  for (const id of bots.keys()) stopBot(id);
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
