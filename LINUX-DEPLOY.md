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
curl http://127.0.0.1:5050/health
```

## .env-র মূল কী-গুলো

| ভেরিয়েবল | মান | নোট |
|---|---|---|
| `PORT` | `5050` (`.env`-এ `PORT=5050`) | HTTP পোর্ট — লাইভ প্রমাণ: ৫০৫০-এ বাইন্ড (`api.js` কোড-ফলব্যাক ৩০০০, `.env` থাকলে তা ব্যবহার হয় না) |
| `DOMAIN` | `localhost` / ভেতরের IP / ডোমেইন | bind-host নির্ধারণ |
| `OLLAMA_BASE` | `http://127.0.0.1:11434/v1` | লোকাল ollama |
| `GEMINI_API_KEY` | `<key>` | ক্লাউড |
| `GROQ_API_KEY` | `<key>` | ⚠️ invalid key = fallback জ্যাম |
| `OPENCODE_API_KEY` | `<key>` | |
| `UDS_PATH` | `/tmp/zombiecoder-test/mcp.sock` (ডিফল্ট `/tmp/zombiecoder/mcp.sock` — monu_the_builder প্রজেক্টও ওই ডিফল্ট পাথ ব্যবহার করে, ধাক্কা এড়াতে `-test`-এ সরানো হয়েছে) | Linux MCP সকেট |
| `ADMIN_TOKEN` | `<password>` | না দিলে admin endpoint 401 |

পুরো তালিকা: `.env.example` — সেখানে প্রতিটি ভেরিয়েবলের বাংলা ব্যাখ্যা আছে।

## systemd (অটো-স্টার্ট)

> ⚠️ **সংস্করণ-নোট (২০২৬-১০-১২):** পুরনো নির্দেশনায় `zombiecoder.service` নামে একটা
> সিস্টেম-লেভেল ইউনিট ছিল (পথ `/opt/zombiecoder-server`, পোর্ট 3000) — **সেটা এখন
> বাস্তবে নেই** (ইউনিট ফাইল কোথাও নেই, পথ-পোর্টও স্টেল)। বর্তমান সেটআপ **ইউজার
> ইউনিট** `zombiecoder-gateway.service`, যেটা রিপোর স্ক্রিপ্ট থেকে অটো-জেনারেট হয় —
> তাই হাতে ইউনিট ফাইল লিখতে হয় না, নতুন মেশিনেও এক কমান্ডেই তৈরি:

```bash
# ইউনিট জেনারেট + এনাবেল (পাথ স্ক্রিপ্ট নিজে বের করে — হার্ডকোড নেই)
./scripts/install-service.sh            # শুধু লেখা + enable
./scripts/install-service.sh --start    # …আর এখনই চালু
# পরিষ্কার করতে:  ./scripts/install-service.sh --remove
```

স্ক্রিপ্টটি যা করে (সবটাই রিপোর-লোকেশন-ডিরাইভেড):
- `WorkingDirectory` / `ExecStart` = রিপোর রুট (স্ক্রিপ্টের অবস্থান থেকে বের করা)
- `Restart=always` (ক্র্যাশ = ২ সেকেন্ডে অটো-রিস্টার্ট) + লগ `logs/systemd-{out,err}.log`
- `loginctl enable-linger` — লগআউট/রিবুটের পরেও চালু থাকে (লগইন ছাড়াই বুটে স্টার্ট)
- সব পাথ (`$HOME`-ভিত্তিক) — অর্থাৎ নতুন OS ইনস্টলে ফাইল এডিট করতে হয় না

সার্ভার চালু থাকলে যাচাই:

```bash
node scripts/healthcheck.js        # সব কম্পোনেন্টের PASS/FAIL টেবিল
node scripts/healthcheck.js --fix  # যা নেই সেটা নিজে মেরামত + রি-চেক
systemctl --user status zombiecoder-gateway.service
```

## নোট

- **Windows-নির্ভর MCP** (`external mcp/screen-recorder-mcp.js`, `tts-mcp.js`,
  `ocr-mcp.js`) Linux-এ চলবে না — `start-all` সেগুলো সহজে **skip/warn** করে
  (fail-hard নয়); কোর সার্ভার, broker, UDS, tools সব ঠিক চলবে।
- লগ: ইউনিফায়েড `logs/zc.jsonl` (api + provider + adapter + transport, সফল/ব্যর্থ
  প্রতি ইভেন্ট) · পুরনো ডেটেড `logs/YYYY-MM-DD.log` · সিস্টেমড `logs/systemd-*.log`
  · কনফিগ DB: `data/models.db` (node:sqlite, zero-dep)
- রিস্টার্ট-পর্যায়ে দেখা স্বীকৃতি:
  ```
  Mission Barisal v3.2.1 — START ALL
  [ENV] Loaded: <dir>/.env
  ```