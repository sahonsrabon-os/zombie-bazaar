# ZombieCoder — Linux Deployment Guide

এই বান্ডেলটি Linux সার্ভারে (VPS/Debian/Ubuntu) চালানোর জন্য তৈরি — সব হার্ডকোডেড
উইন্ডোজ পাথ বাদ, সব কনফিগ **এনভায়রনমেন্ট ভেরিয়েবল-কেন্দ্রিক** (`.env`)।

## দরকারি জিনিস

| নির্ভরতা | প্রয়োজনীয়তা |
|---|---|
| Node.js | **≥ 24** (আগে থেকে `node:sqlite` built-in — কোনো npm dependency নেই) |
| ollama (ঐচ্ছিক) | লোকাল মডেল চালাতে (`ollama pull llama3.2:latest`) |
| ইন্টারনেট | ক্লাউড provider (gemini/groq/opencode) ব্যবহার করতে |

> কোনো `node_modules` / `npm install` লাগে না। বান্ডেলটা সম্পূর্ণ স্বনির্ভর।

## দ্রুত রান

```bash
# 1) Node 24+ (Debian/Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2) ollama (ঐচ্ছিক — লোকাল মডেলের জন্য)
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &        # বা systemd সার্ভিসে রান হয়
ollama pull llama3.2:latest

# 3) বান্ডেল খোলো
unzip zombiecoder-server-linux-*.zip
cd zombiecoder-server
chmod +x start.sh

# 4) প্রথম রান — .env তৈরি হয়
./start.sh
#    → .env-এ keys বসাও (gemini/groq/opencode), আবার ./start.sh

# 5) চেক
curl http://127.0.0.1:3000/health
```

## .env-র মূল কী-গুলো

| ভেরিয়েবল | মান | নোট |
|---|---|---|
| `PORT` | `3000` | HTTP পোর্ট |
| `DOMAIN` | `localhost` / ভেতরের IP / ডোমেইন | bind-host নির্ধারণ |
| `OLLAMA_BASE` | `http://127.0.0.1:11434/v1` | লোকাল ollama |
| `GEMINI_API_KEY` | `<key>` | ক্লাউড |
| `GROQ_API_KEY` | `<key>` | ⚠️ invalid key = fallback জ্যাম |
| `OPENCODE_API_KEY` | `<key>` | |
| `UDS_PATH` | `/tmp/zombiecoder/mcp.sock` | Linux MCP সকেট |
| `ADMIN_TOKEN` | `<password>` | না দিলে admin endpoint 401 |

পুরো তালিকা: `.env.example` — সেখানে প্রতিটি ভেরিয়েবলের বাংলা ব্যাখ্যা আছে।

## systemd (অটো-স্টার্ট)

```ini
[Unit]
Description=ZombieCoder Gateway
After=network.target

[Service]
WorkingDirectory=/opt/zombiecoder-server
ExecStart=/usr/bin/node start.js --start-all -s
Restart=always
RestartSec=5
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
sudo cp zombiecoder.service /etc/systemd/system/
sudo systemctl enable --now zombiecoder
```

## নোট

- **Windows-নির্ভর MCP** (`external mcp/screen-recorder-mcp.js`, `tts-mcp.js`,
  `ocr-mcp.js`) Linux-এ চলবে না — `start-all` সেগুলো সহজে **skip/warn** করে
  (fail-hard নয়); কোর সার্ভার, broker, UDS, tools সব ঠিক চলবে।
- লগ: `logs/YYYY-MM-DD.log` · কনফিগ DB: `data/models.db` (node:sqlite, zero-dep)
- রিস্টার্ট-পর্যায়ে দেখা স্বীকৃতি:
  ```
  Mission Barisal v3.2.1 — START ALL
  [ENV] Loaded: <dir>/.env
  ```