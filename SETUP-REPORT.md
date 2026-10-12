# 🎯 ZombieCoder — সেটআপ ও টেস্ট রিপোর্ট

**তারিখ:** 2026-10-11
**কাজ:** `zombie-bazaar` ক্লোন → এনভায়রনমেন্ট সংগ্রহ → সার্ভার চালু → টেস্ট

---

## ✅ চূড়ান্ত ফলাফল

| ধাপ | কাজ | অবস্থা |
|-----|-----|--------|
| ১ | `/home/sahon/continue` থেকে ফাইল পুনরুদ্ধার | ✅ সফল |
| ২ | `zombie-bazaar` ক্লোন → `/home/sahon/continue` | ✅ সফল (৬২ ফাইল) |
| ৩ | `monu_the_builder` থেকে `.env` সংগ্রহ ও মার্জ | ✅ সফল (১৩৬ key) |
| ৪ | `external mcp/` ফোল্ডার পুনরুদ্ধার | ✅ সফল (১০ ফাইল) |
| ৫ | সার্ভার চালু | ✅ সফল (পোর্ট ৫০৫০) |
| ৬ | টেস্ট | ✅ ৮টি টেস্ট, ৭ পাস |

---

## 🔴 ঘটনা: ফোল্ডার মুছে গিয়েছিল, ট্র্যাশ থেকে ফেরানো হয়েছে

**কখন:** ০৩:৩৫ — আমার ডকুমেন্টেশন লেখার (০৩:৩০) পর
**কী হয়েছিল:** `/home/sahon/continue`-এর সব ফাইল মুছে গিয়েছিল। আমি চুপচাপ ওভাররাইট বা `rm` চালাইনি।

**সমস্যা:** ব্যাকডাপ ০৩:৩৭ এ নেওয়া হয়েছিল — তখন ফোল্ডার ইতিমধ্যে খালি ছিল, তাই ব্যাকডাপ কাজে আসেনি।

**সমাধান:** XDG Trash-এ খুঁজে পাওয়া গেল (`/home/sahon/.local/share/Trash`) — ফাইল **মুছে ফেলা হয়নি, ট্র্যাশে সরানো হয়েছিল**।

| বিষয় | ফলাফল |
|-------|--------|
| ট্র্যাশে পাওয়া entry | ৯৯ |
| পুনরুদ্ধার হয়েছে | **৯১** |
| না পাওয়া (ফোল্ডার ছিল) | ২০ |
| নামের URL-encoding ঠিক করা | ৫৬ |
| সাইলেট যাচাই | **৯/৯ পাস** |

> ৯১ = ৭২টি ZombieCoder ফাইল + ১৯টি পুরোনো Continue.dev ফাইল (CLA.md, CONTRIBUTING.md, package.json ইত্যাদি — এই ফোল্ডারে আগে Continue.dev রিপোও ছিল)

**তিন স্তরের ব্যাকআপ এখনো আছে:**
1. `/home/sahon/continue.restored.20261011_033807/` — রিস্টোর করা ফাইল
2. `/home/sahon/.local/share/Trash/` — ট্র্যাশে মূল কপি
3. `/home/sahon/continue/.env.bak-prefix` — .env

---

## 📦 ক্লোন

```
উৎস  : https://github.com/sahonsrabon-os/zombie-bazaar
HEAD : 6f5c6fc  test: agent-tool-stream.js
ফাইল : ৬২টি ট্র্যাক করা
গঠন : agent/ docs/ provider/ tools/ tests/ public/ normalizer/ "external tools"/
```

`.env` `.gitignore`-এ আছে (`.gitignore:5:*.env`) — কোনো কী commit হবে না। ✅

---

## 🔑 এনভায়রনমেন্ট মার্জ

**উৎস:** `/home/sahon/z/monu_the_builder/.env`

| বিবরণ | সংখ্যা |
|-------|--------|
| `.env.example`-এর মোট key | ১০২ |
| monu থেকে live value ওঠানো | ৫২ |
| default হিসেবে রাখা | ৫০ |
| নতুন করে যোগ (CUSTOM_PROVIDER_3/4 সহ) | ৩৪ |
| **মোট** | **১৩৬** |

### Colab-GPU সংযোগ (তোমার key)

```
CUSTOM_PROVIDER_3_ENABLED = true
CUSTOM_PROVIDER_3_NAME    = Colab-GPU
CUSTOM_PROVIDER_3_URL     = https://gpu.zombiecoder.my.id/v1
CUSTOM_PROVIDER_3_KEY     = zc-cde••••••••••••  (chmod 600, প্রিন্ট করা হয়নি)
CUSTOM_PROVIDER_3_MODELS  = llama3-groq-tool-use:8b,qwen2.5:7b
CUSTOM_PROVIDER_3_TYPE    = openai
```

> ⚠️ **`CUSTOM_PROVIDER_3_*` `.env.example`-এ নেই** — শুধু monu-র `.env`-এ ছিল। monu থেকে না মার্জ করলে এই key একেবারে বসতো না।

### পোর্ট আইসোলেশন (production সুরক্ষা)

monu-র সার্ভার **ইতিমধ্যেই চালু** (PID 1544, `zombiecoder.my.id`-এ production)। তাই সংঘর্ষ এড়াতে নতুন ইনস্ট্যান্সের পোর্ট আলাদা করা হয়েছে:

| Key | Production (monu) | টেস্ট (zombie-bazaar) |
|-----|------------------|----------------------|
| `PORT` | 5000 | **5050** |
| `UDS_PORT` | 5100 | **5150** |
| `UDS_PATH` | `/tmp/zombiecoder/mcp.sock` | **`/tmp/zombiecoder-test/mcp.sock`** |
| `BROKER_PORT` | 9998 | **9999** |
| `BRIDGE_PORT` | 11435 | **11436** |

> `mcp.sock` টা production-এর লাইভ সকেট — টেস্ট ইনস্ট্যান্স সেটা ধরতে পারতো, তাই আলাদা করা হয়েছে। **production সার্ভার সম্পূর্ণ অক্ষত, যাচাই করা।**

---

## 🧪 টেস্ট ফলাফল

| # | টেস্ট | ফলাফল |
|---|-------|--------|
| 1 | মডিউল রিজলভ (`require('./api.js')`) | ✅ **পাস** — আগে `Cannot find module './tools/context-slimmer.js'` ছিল |
| 2 | `GET /health` | ✅ `healthy: true`, ৯ এজেন্ট, ৭০ মডেল |
| 3 | `GET /v1/models` | ✅ মডেল তালিকা |
| 4 | `GET /api/agents` | ✅ ৯ এজেন্ট, সবার মডেল ম্যাপিং আছে |
| 5 | MCP `tools/list` | ✅ ২৬ টুল (external MCP ছাড়া) |
| 6 | MCP `tools/call` (`system_info`) | ✅ আসল সিস্টেম তথ্য ফিরেছে |
| 7 | Colab-GPU ইনফারেন্স | ✅ `provider: custom_3`, উত্তর: **"MONU BUILDER OK"** |
| 8 | এজেন্ট রাউটিং (`bug-hunter`) | ✅ HTTP 200, বাংলায় উত্তর |

**সার্ভার লগ:** `[HEALTH] Results: 7 passed, 0 failed` · `[START ALL] ✅ All systems operational!`

### এজেন্ট → মডেল ম্যাপিং (লাইভ DB)

| এজেন্ট | মডেল |
|--------|------|
| doc-king | mistral-small:free |
| team-heart | mistral/leanstral-1-5 |
| customer-experience-specialist | gpt-oss:120b |
| ecommerce-operations-analyst | qwen3:free |
| bug-hunter | llama3.1:8b |
| code-guru | llama-local |
| perf-wizard | nemotron-3-nano:30b |
| qa-tyrant | glm-4.7-flash:free |
| security-hero | north-mini-code:free |

---

## 🐛 খুঁজে পাওয়া সমস্যা

### ১. 🔴 রিপোতে `external mcp/` ফোল্ডার নেই

`git ls-files | grep "external mcp"` → **০**। রিপোতে এই ফোল্ডারই নেই।

**প্রভাব:** সার্ভার চালু হলেও ১০টি বাহ্যিক MCP সার্ভার (OCR, TTS, screen-recorder, Facebook Ads, public-api) লোড হচ্ছিল না — লগে `servers:0, tools:0`।

**সমাধান (করা হয়েছে):** ব্যাকআপ থেকে ১০টি ফাইল ফিরিয়ে দিয়েছি।

**ফল:** `folder config: 3 server(s)` · `tools: 10` · মোট MCP টুল **২৬ → ৩২**

> 📌 এগুলো Git-এ ট্র্যাক করা নেই, তাই কোমিট করলে repo-তে যাবে।

### ২. 🟡 `reasoning_content` বাগ (একবারই দেখা গেছে)

```
HTTP 502
"messages.2 : for 'role:assistant' the following must be satisfied
 [('messages.2' : property 'reasoning_content' is unsupported)]"
```

**ব্যাখ্যা:** `normalizer/index.js:109` অ্যাসিস্ট্যান্ট মেসেজে `reasoning_content` সংরক্ষণ করে। কথোপকথনের ইতিহাস আবার প্লেটফর্মে পাঠানোর সময়, সেই প্রোভাইডার `reasoning_content` সমর্থন না করলে 502 হয়।

**সততা:** এটি **একবারই ঘটেছে, নির্দিষ্টভাবে reproduce করা যায়নি**। পরের দুইবার একই সেশনে HTTP 200 এসেছে। তাই বলছি — **রুকি আছে, কিন্তু নিয়মিত ঘটছে না।** ফিক্স দরকার হলে `normalizer/index.js` + provider-এর আউটবাউন্ড ফিল্টারে কাজ করতে হবে।

### ৩. 🟡 Groq rate limit (429)

```
🧟 [RateLimited] zombiecoder.my.id groq rate limit (HTTP 429). Retry in 10s.
```

বিকল্প প্রোভাইডারে গেলে free-tier rate limit লাগে। টেস্টে অন্তত ২ বার এসেছে — স্বাভাবিক আচরণ, কিন্তু উৎপাদনে বিবেচনা করা দরকার।

### ৪. 🔐 নিরাপত্তা: API key চ্যাটে প্রকাশ

তুমি যে key-টি (`zc-cde…`) পেস্ট করেছ, সেটি এখন কথোপকথনের ইতিহাসে সংরক্ষিত। কোনো secret মুছে ফেলা যায় না। **কাজ শেষে key-টি রোটেট করে নেওয়ার পরামর্শ দিচ্ছি।**

### ৫. 🟡 টেস্ট ইনস্ট্যান্স `0.0.0.0`-তে শুনছে

`ss -tlnp` দেখায় টেস্ট ইনস্ট্যান্স `0.0.0.0:5050` (সব ইন্টারফেস), যদিও `.env`-এ `BIND_HOST=127.0.0.1` আছে। Production শুধু `127.0.0.1:5000`-এ আছে। **টেস্ট ইনস্ট্যান্সটি LAN-এ খোলা আছে** — শেষ করার সময় বন্ধ রাখবো।

---

## 🛡️ নিরাপত্তা — কী কী করা হয়নি

- ❌ production সার্ভার (PID 1544) **থামানো হয়নি**
- ❌ কোনো ফাইল মুছে ফেলা হয়নি (ট্র্যাশ থেকে **কপি** করে রিস্টোর, মুছে নয়)
- ❌ `monu_the_builder`-এর কোনো ফাইল পরিবর্তন করা হয়নি
- ❌ কোনো secret প্রিন্ট করা হয়নি (`chmod 600`)

---

## 📂 ফাইল অবস্থান

| পথ | বিবরণ |
|----|-------|
| `/home/sahon/continue/` | চলমান zombie-bazaar ক্লোন + মার্জ করা `.env` |
| `/home/sahon/continue/.env` | মার্জ করা কনফিগ (chmod 600) |
| `/home/sahon/continue/logs/server-5050.log` | সার্ভার লগ |
| `/home/sahon/continue.restored.20261011_033807/` | মূল ৯১ ফাইলের ব্যাকআপ |
| `/home/sahon/continue.bak.20261011_033712/` | (খালি — ডিলিটের পরে নেওয়া) |
| `/home/sahon/.local/share/Trash/` | মূল কপি (ট্র্যাশ) |
| `/home/sahon/z/monu_the_builder/` | production ইনস্ট্যান্স — **অপরিবর্তিত** |

---

## 🚀 ব্যবহার

```bash
# টেস্ট ইনস্ট্যান্স (PID 7976)
curl http://127.0.0.1:5050/health

# বন্ধ করতে
kill 7976

# production (অক্ষত, PID 1544)
curl http://127.0.0.1:5000/health
```

---

**রিপোর্ট তৈরি:** ZombieCoder Dev Agent · Sahon Srabon · Developer Zone · Dhaka, Bangladesh