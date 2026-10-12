# 🔍 ZombieCoder — অডিট ও সমাধান পরিকল্পনা

**তারিখ:** 2026-10-11
**পরিস্থিতি:** ৯টি বিষয়ে যাচাই, ৩টি গুরুতর সমস্যা পাওয়া গেছে

---

## 📌 তোমার প্রশ্নগুলোর উত্তর (প্রমাণসহ)

### ১. `code-guru (llama-local)` নামে আসলে কোনো মডেল আছে?

## ❌ নেই। তোমার সন্দেহ ১০০% সঠিক ছিল।

**প্রমাণ ১:** Ollama-তে ইনস্টল করা মডেল মাত্র দুটো —
```
$ curl http://127.0.0.1:11434/api/tags
  qwen2.5:1.5b, deepseek-r1:1.5b
  `llama-local` আছে? False
```

**প্রমাণ ২:** কোডে কোথাও এটা সংজ্ঞায়িত নেই — শুধু একটা মন্তব্যে:
```
tools/model-alias.js:7  * id ("llama-local", design log S6)
```
আর `MODEL_ALIASES=` **ফাঁকা**, `BRIDGE_MODEL=` **ফাঁকা**। মানে alias-ম্যাপ চালু নেই।

**প্রমাণ ৩ (সবচেয়ে কষ্টের):** যেকোনো বানানো মডেল নামও একইভাবে কাজ করে —

| ডাকা মডেল | provider | actual_model |
|-----------|----------|--------------|
| `code-guru` | **None** | **None** |
| `llama-local` | opencode | llama-local |
| **`zzz-কোনো-মডেল-নেই`** | **opencode** | **zzz-কোনো-মডেল-নেই** |
| `gemini-3.5-flash-lite` | gemini | gemini-3.5-flash-lite |

**অর্থাৎ কোনো মডেলই যাচাই হচ্ছে না!** যা খুশি লিখে পাঠাও, upstream-এ চলে যায়।

### কারণটা কোথায়

`api.js:1609 resolveProvider()` তিন ধাপে কাজ করে:
1. `allNames` তে exact match → পায় না
2. **`models: []` খালি wildcard প্রোভাইডার** (opencode) → ধরে ফেলে (`api.js:1652`)
3. তাই যেকোনো নাম চলে যায়

মূল কারণ:
```
OPENCODE_MODELS=          ← ফাঁকা ⇒ wildcard
OPENCODE_API_KEY=<YOUR_OPENCODE_KEY>   ← placeholder, আসল key নয়
```

### ২. এজেন্ট কি নিজের মডেল পায়?

## ❌ `code-guru` কলে `provider: None`, `elapsed: 0ms`

উত্তর আসে, কিন্তু **এজেন্টের নিজের মডেল থেকে না** — fallback প্রোভাইডার থেকে। লগে:
```
[SINGLE_AGENT_COMPLETE] {agent:"code-guru", contentLength:72, elapsed:1009}
```

### ৩. প্রোভাইডার হিসেবে `zombiecoder` উচিত না?

## ✅ তুমি ঠিক বলেছ। যাচাই করে দেখেছি কী হয়

`local-llm-bridge.js:527` লোকাল মডেলের উত্তর ধরে `reasoning_content` যোগ করে।
`provider/index.js` তা সরাসরি upstream-এ পাঠায়।

ফলে Ollama বলে: `property 'reasoning_content' is unsupported` → 502।

**আমি এটা ইতিমধ্যে ঠিক করেছি** (`provider/index.js` normalizeMessages-এ স্যানিটাইজার)।

### ৪. Ollama কেন ঠাসা হয়ে আছে?

**সৎ উত্তর:** কোথাও hardcode নেই। কিন্তু দুটো বাস্তব কারণে Ollama সবচেয়ে পিছনে পড়ে:

| কারণ | প্রমাণ |
|-------|--------|
| `OLLAMA_PRIORITY` সবচেয়ে বেশি (নম্বর বড়) | priority-এ শেষে যায় |
| `OPENCODE_PRIORITY=6` (wildcard) আগে ধরে | যেকোনো নাম নিজেই ধরে নেয় |
| `llama-local` মেলে না | তাই Ollama পর্যন্ত পৌঁছায়ই না |

**আসল সমস্যা Ollama নয় — wildcard প্রোভাইডার।** সেটা ঠিক করলে Ollama নিজে থেকেই কাজ করবে।

### ৫. UDS দিয়ে কি সাড়া কমবে?

## ✅ হ্যাঁ, ঠিক ইচ্ছার কথা

`BRIDGE_SOCKET=/tmp/local-llm.sock` আগে থেকেই সেট করা, আর সকেটটাও আছে।

| | TCP loopback | Unix Socket |
|---|---|---|
| latency | TCP + HTTP পার্সিং | কোনো পার্সিং নেই |
| বিলম্ব | ~১-৩ ms কম | TCP handshake বাদ |
| স্কোপ | যে কোনো লোকাল প্রসেস | Unix user মাত্র |

**এটা করতে হবে `BRIDGE_BACKEND` ও upstream-কে UDS-এ সুইচ করতে।**

---

## 🔴 পাওয়া ৩টি সমস্যা (অগ্রাধিকার)

| # | সমস্যা | প্রভাব | অবস্থা |
|---|--------|--------|--------|
| **১** | `OPENCODE_API_KEY=<YOUR_OPENCODE_KEY>` placeholder + `OPENCODE_MODELS=` ফাঁকা | **যেকোনো বানানো মডেলও চলে** | ❌ অমীকার |
| **২** | `llama-local` অস্তিত্বহীন | এজেন্টের মডেল ভাঙা | ❌ |
| **৩** | MCP টুল ১৩১, ডকুমেন্টে ৩৬ দাবি | ডক-রিয়ালিটি মিলছে না | ❌ |

### ৩ নম্বর সমস্যাটা তোমার প্রশ্নের সরাসরি উত্তর

ডকুমেন্টে বলা হয় **৩৬ টুল**। বাস্তবে:

```
২৩টি বিল্ড-ইন MCP টুল + external MCP যোগ করার পর ১৩১
```

আমার মতে **৩৬ সংখ্যাটাই সঠিক**, কারণ সেটাই *core* টুল। বাকিগুলো optional external MCP। আমার প্রস্তাব:

```
৩৬ core  |  external MCP আলাদা ভাগে
```

এতে ব্যবহারকারী বুঝবে মূল কত আর বাহিরের কত।

---

## 📋 কাজের পরিকল্পনা

### ধাপ ১ — মডেল যাচাই (সবচেয়ে জরুরি)
- `resolveProvider()`-এ wildcard-এর আগে **strict validation**
- অচেনা মডেল → সঠিক এরর, চুপচাপ fallback নয়
- `llama-local` → আসল Ollama মডেলে ম্যাপ (DB/env থেকে, hardcode নয়)

### ধাপ ২ — এজেন্ট → মডেল সংযোগ
- admin প্যানেল থেকে মডেল বদলালে সেই এজেন্ট সেটি ব্যবহার করবে
- **DB থেকেই** পড়বে, hardcode কোথাও নেই

### ধাপ ৩ — প্রোভাইডার আলাদা না
- local ও cloud-এর জন্য একই ইন্টারফেস
- normalized OpenAI ফরম্যাটেই সবাইকে পাঠানো

### ধাপ ৪ — টুল মার্কার + execution
- model-এর JSON থেকে সরাসরি এক্সিকিউট
- Facebook token ইনপুট প্যারামিটার

### ধাপ ৫ — এপিআই কানেক্ট সিস্টেম
- e-commerce প্রজেক্ট যুক্ত করা যাবে
- **কানেক্ট না থাকলেও crash না** — ফিচার শুধু বন্ধ

### ধাপ ৬ — UDS
- `local-llm-bridge` ও Ollama দুটোই UDS-এ
- সাড়া কমবে

### ধাপ ৭ — সিস্টেম ইন্টিগ্রেশন
- `.bashrc` + systemd unit
- মেশিন বুটে নিজে থেকে চালু

---

## ❓ যা আমি জানি না

1. **`OPENCODE_API_KEY` আসল key কি?** — `<YOUR_OPENCODE_KEY>` placeholder। তোমাকে দিতে হবে।
2. **`llama-local` কি চাও?** — Ollama-তে `qwen2.5:1.5b` আছে, কিন্তু সেটা ১.৫B (ছোট)। বড় মডেল চাইলে `ollama pull` লাগবে।
3. **৩৬ নাকি ১৩১ — কোনটাই "আমাদের"?** — আমার মতে ৩৬ core। তুমি সিদ্ধান্ত দাও।
4. **e-commerce প্রজেক্ট কোনগুলো?** — পথ জানালে যুক্ত করে দেব।

---

**তৈরি:** ZombieCoder Dev Agent · Sahon Srabon