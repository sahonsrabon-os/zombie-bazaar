# 🚀 start.js — Mission Barisal বুটস্ট্র্যাপ ডকুমেন্টেশন

**ফাইল:** `/home/sahon/continue/start.js`
**সংস্করণ:** 3.2.1

---

## দুটি মোড

```bash
node start.js              # ইন্টার‌্যাক্টিভ মেনু: CONFIG ALL / START ALL
node start.js --start-all  # সরাসরি পুরো বুটস্ট্র্যাপ
node start.js -s           # সাইলেন্ট মোড (stdout কম)
```

---

## `--start-all` এর ৮টি ধাপ

| ধাপ | কাজ | লগ ট্যাগ |
|-----|-----|---------|
| 1 | `.env` লোড | `[ENV] Loaded:` |
| 2 | পরিবেশ শনাক্ত (OS/CPU/RAM) | `[ENV-DETECT]` |
| 3 | ডাটাবেজ নিশ্চিত | `[DB]` |
| 4 | runtime config সংরক্ষণ | `[STORE]` |
| 5 | `~/.zombiecoder/config.json` নিশ্চিত | `[CONFIG]` |
| 6 | পুরোনো প্রসেস পরিষ্কার | `[CLEANUP]` |
| 7 | PHP broker spawn | `[BROKER]` |
| 8 | local MCP সার্ভার + `api.js` | `[HEALTH]` |

---

## 🔐 নিরাপত্তা — `cleanupOldProcesses()`

এটিই সবচেয়ে বিপজ্জনক-মনে মনে হওয়া অংশ, কিন্তু কোডে দুটি গার্ড আছে:

```js
// গার্ড ১ — নিজের প্রসেস কখনো নয়
if (pid === process.pid) continue;
if (args.indexOf("start.js") !== -1) continue;

// গার্ড ২ — শুধু THIS ডিরেক্টরির প্রসেস
if (args.indexOf(__dirname) === -1) continue;   // ← api.js:478
```

**গার্ড ২ কেন জরুরি:** `/home/sahon/continue` থেকে চালালে `/home/sahon/z/monu_the_builder`-এর প্রসেস **অক্ষত থাকে** — না থাকলে একটা টেস্ট রান production মেরে দিত।

যা মারে: **শুধু টার্গেট পোর্টের** প্রসেস (`kill`, তারপর ৫ সেকেন্ড অপেক্ষা, তারপর force-kill)।

---

## পোর্ট আইসোলেশন

একই মেশিনে দুটো ইনস্ট্যান্স চালাতে হলে কনফ্লিক্ট এড়াতে হয়:

| ভ্যারিয়েবল | production (monu) | টেস্ট (continue) |
|-----------|------------------|------------------|
| `PORT` | 5000 | 5050 |
| `UDS_PORT` | 5100 | 5150 |
| `UDS_PATH` | `/tmp/zombiecoder/monu.sock` | `/tmp/zombiecoder/mcp.sock` (ডিফল্ট) |
| `BROKER_PORT` | 9998 | 9999 |
| `BRIDGE_PORT` | 11435 | 11436 |

> **২০২৬-১০-১২ পুনর্বিন্যাস:** UDS পাথ বদলে monu-কে নিজের `monu.sock` দেওয়া হয়েছে;
> ডকুমেন্টেড ডিফল্ট `/tmp/zombiecoder/mcp.sock` এখন continue সার্ভারের।
| `OCR_MCP_PORT` | 3100 | 3110 |
| `SCREEN_MCP_PORT` | 3101 | 3111 |
| `TTS_MCP_PORT` | 3102 | 3112 |

> `UDS_PATH`-এর লাইভ সকেটটা আলাদা রাখা জরুরি — production চলা থাকলে টেস্ট ইনস্ট্যান্স সেটা ধরে নিত।

---

## স্প্যান করা প্রসেস

| প্রসেস | স্প্যান করে | ট্রান্সপোর্ট |
|--------|------------|-------------|
| `api.js` | `require()` (ইন-প্রসেস) | HTTP |
| `external tools/php-broker-server.js` | `spawn()` (আলাদা) | HTTP `:BROKER_PORT` |
| `external mcp/ocr-mcp.js` | `start-local-mcp.js` | stdio **অথবা** HTTP |
| `external mcp/screen-recorder-mcp.js` | একই | একই |
| `external mcp/tts-mcp.js` | একই | একই |
| `universal-adapter/index.js` | `start-local-mcp.js` (servers.json) | HTTP :5400 · HTTPS :5443 · stdio |

---

## ✅ MCP সার্ভার এখন dual-transport

`external mcp/*.js` তিনটি দুইভাবে চলে:

```bash
# HTTP (standalone / legacy)
node ocr-mcp.js                      # :3100 শোনবে

# stdio (চাইল্ড প্রসেস — কোনো পোর্ট নেই)
MCP_TRANSPORT=stdio node ocr-mcp.js # কোনো সকেট খুলবে না
```

নির্বাচন `external mcp/stdio-transport.js` → `wantsStdio()` করে।

### যা লাভ

| বিষয় | HTTP | stdio |
|-------|------|-------|
| পোর্ট | প্রতিটি সার্ভারের ১টি | ০ |
| সংঘর্ষের ঝুঁকি | আছে | নেই |
| মৃত্যু | অক্ষত থাকতে পারে | parent গেলেই মরে |
| তদারকি | `netstat` লাগে | parent-এর জিম্মা |

**যাচাই:** stdio মোডে চালিয়ে `ss -tln` আগে-পরে একই সংখ্যা — কোনো পোর্ট খোলে না।

---

## 📇 এজেন্ট ডেটাবেজ সিঙ্ক

`start.js` সরাসরি DB আপডেট করে না — সেটার জন্য আলাদা টুল:

```bash
node tools/sync-agents.js           # dry-run (কিছু বদলায় না)
node tools/sync-agents.js --write   # প্রয়োগ (ব্যাকআপ সহ)
```

যা করে: `agent/*.js` → `models.db`-এর `agents` টেবিলে পার্সোনা লেখে।

**যা করে না:** `model` কলাম ছোঁয় না। `agent/*.js`-এ `model:"MODELS_DB"` একটি সেন্টিনেল — আসল মডেল অ্যাডমিন প্যানেল/DB থেকে আসে, ওই সিদ্ধান্ত মুছে ফেলা উচিত নয়।

---

## 🔍 hardcode সমস্যা ও সমাধান

### পাওয়া বাগ ১: ছোট পার্সোনা

`api.js` `loadPersonas()`-এ DB আগে push করে, তারপর ফাইল লোড করে `!seen.has(id)` দিয়ে — ফলে **ফাইলের পূর্ণ পার্সোনা কখনো ব্যবহার হতো না**:

| এজেন্ট | DB-র পার্সোনা | ফাইলের পার্সোনা |
|--------|--------------|----------------|
| code-guru | ২৮ অক্ষর | ১,৩০৯ অক্ষর |
| qa-tyrant | ৩০ অক্ষর | ১,৬০৪ অক্ষর |

**সমাধান:** (ক) `tools/sync-agents.js` দিয়ে DB ঠিক করা, (খ) `api.js`-এ ফাইলের পার্সোনা বড় হলে backfill।

### পাওয়া বাগ ২: slash-মডেল ভাঙা

```js
// আগে — যেকোনো slash মডেল বদলে যেত
const safeModel = model.includes("/") ? "nemotron-3-ultra-free" : model;
```

কিন্তু DB-তে `mistral/leanstral-1-5`, `qwen/qwen3.8-27b` — slash আছে! মানে এজেন্ট ভুল প্রোভাইডারে চলে যেত।

**সমাধান:** hardcode সরিয়ে `defaultAgentModel()` — যা `models` টেবিল থেকে পড়ে।

### পাওয়া বাগ ৩: SQLite-এর syntax ভুল

`ORDER BY (a ASC, b ASC)` — এটা MySQL-এর সিনট্যাক্স, SQLite চায় না। `try/catch` এটা নীরবে ধরে `MODELS_DB` ফেরত দিত — মানে বাগ চুপচাপ থাকতো।

---

## স্বাস্থ্য পরীক্ষা

`start.js` বুটের পরে ৭টি endpoint যাচাই করে:

```
[HEALTH] Results: 7 passed, 0 failed
[START ALL] ✅ All systems operational!
```

| Endpoint | যাচাই করে |
|----------|-----------|
| `/health` | `healthy: true` |
| `/api/v1/models` | অ্যারে আছে কি |
| `/api/v0/models` | অ্যারে আছে কি |
| `/api/agents` | `agents` অ্যারে |
| `/identity` | ডোমেইন আছে কি |
| `/api/domain` | ডোমেইন আছে কি |
| `/api/mcp-clients` | ক্লায়েন্ট তালিকা |

---

## ⚠️ পরিচিত সমস্যা

1. **`opencode` প্রোভাইডার সিঙ্ক ব্যর্থ** — `HTTP 404` (লগে `AUTO_SYNC_DONE`)। groq/gemini/ollama ঠিক আছে।
2. **TTS-এর Python নির্ভরতা নেই** — `edge_tts` মডিউল ইনস্টল না। ফলে `tts_voices`/`tts_speak` রানটাইমে এরর দেয়।
3. **`external tools/servers.json` অচল** — কেউ পড়ে না। পড়া হয় `external mcp/servers.json` (স্পেস যুক্ত)।

---

**তৈরি:** ZombieCoder Dev Agent · Sahon Srabon · Developer Zone