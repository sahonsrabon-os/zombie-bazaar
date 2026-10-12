# MCP Tools — Mission Barisal (153)

Generated from `GET /api/admin/tools` on the live server. Machine-readable
OpenAI function-calling conversion: [`openai-schema.json`](openai-schema.json).
Regenerate after adding/removing tools: `node tools/gen-openai-docs.js`.

| # | Tool | Description | Enabled | Calls | Errors |
|---|------|-------------|---------|-------|--------|
| 1 | `agent_mission` | Execute a mission with all agents in parallel | Y | 0 | 0 |
| 2 | `agent_single` | Execute with a single agent | Y | 0 | 0 |
| 3 | `append_syllabus` | Append a knowledge entry to the project syllabus.md — the shared learning log ALL agents read (append-only; never overwrites). Use when you learn something new worth keeping. | Y | 1 | 0 |
| 4 | `browse_cdp` | Headless-browse a URL via Chrome DevTools Protocol over a PIPE (zero HTTP control channel — no port, no websocket). Opens a page with headless Chrome and returns text, HTML, title, a screenshot (saved to a temp file), computed styles, element queries, the page outline, links or console output. Use for reading AND visually inspecting local or remote pages. | Y | 0 | 0 |
| 5 | `call_agent` | Call another agent for a specific sub-task. Use when the task needs specialized knowledge from another agent (e.g., security review, bug hunting, performance tuning). | Y | 0 | 0 |
| 6 | `combined__ads_activate_entity` | [external:combined] Activate a paused campaign, ad set, or ad. | Y | 0 | 0 |
| 7 | `combined__ads_create_ad` | [external:combined] Create ad linking creative to ad set. | Y | 0 | 0 |
| 8 | `combined__ads_create_ad_set` | [external:combined] Create ad set with targeting, placement, schedule. | Y | 0 | 0 |
| 9 | `combined__ads_create_campaign` | [external:combined] Create campaign with objective and budget. Created in PAUSED status. | Y | 0 | 0 |
| 10 | `combined__ads_create_catalog` | [external:combined] Create product catalog for dynamic ads. | Y | 0 | 0 |
| 11 | `combined__ads_create_product_feed` | [external:combined] Create data feed for product uploads. | Y | 0 | 0 |
| 12 | `combined__ads_get_ad_accounts` | [external:combined] List accessible ad accounts. | Y | 0 | 0 |
| 13 | `combined__ads_get_ad_entities` | [external:combined] Retrieve campaigns, ad sets, ads under an account. | Y | 0 | 0 |
| 14 | `combined__ads_get_catalog` | [external:combined] Get catalog details. | Y | 0 | 0 |
| 15 | `combined__ads_get_dataset_quality` | [external:combined] Get signal health for dataset. | Y | 0 | 0 |
| 16 | `combined__ads_get_datasets` | [external:combined] List datasets in account. | Y | 0 | 0 |
| 17 | `combined__ads_get_help_article` | [external:combined] Search Meta Business Help Center. | Y | 0 | 0 |
| 18 | `combined__ads_get_opportunity_score` | [external:combined] Get Meta's opportunity score. | Y | 0 | 0 |
| 19 | `combined__ads_get_pages_for_business` | [external:combined] Display connected Facebook Pages. | Y | 0 | 0 |
| 20 | `combined__ads_get_pixel` | [external:combined] Get pixel details and health. | Y | 0 | 0 |
| 21 | `combined__ads_get_pixel_stats` | [external:combined] Get pixel event statistics. | Y | 0 | 0 |
| 22 | `combined__ads_get_product` | [external:combined] Get product details. | Y | 0 | 0 |
| 23 | `combined__ads_get_product_feed` | [external:combined] Get product feed details. | Y | 0 | 0 |
| 24 | `combined__ads_get_product_feed_upload` | [external:combined] Get feed upload history. | Y | 0 | 0 |
| 25 | `combined__ads_get_product_set` | [external:combined] Get product set details. | Y | 0 | 0 |
| 26 | `combined__ads_get_product_sets` | [external:combined] List product sets in catalog. | Y | 0 | 0 |
| 27 | `combined__ads_get_products` | [external:combined] List products in catalog. | Y | 0 | 0 |
| 28 | `combined__ads_insights_advertiser_context` | [external:combined] Get industry and geographic context. | Y | 0 | 0 |
| 29 | `combined__ads_insights_anomaly_signal` | [external:combined] Flag KPI deviations from baseline. | Y | 0 | 0 |
| 30 | `combined__ads_insights_auction_ranking_benchmarks` | [external:combined] Compare CTR, CPM, quality ranking. | Y | 0 | 0 |
| 31 | `combined__ads_insights_industry_benchmark` | [external:combined] Compare against industry averages. | Y | 0 | 0 |
| 32 | `combined__ads_insights_performance_trend` | [external:combined] Historical metric trajectory. | Y | 0 | 0 |
| 33 | `combined__ads_update_entity` | [external:combined] Modify campaigns, ad sets, or ads. | Y | 0 | 0 |
| 34 | `combined__ads_upload_products` | [external:combined] Upload products to catalog. | Y | 0 | 0 |
| 35 | `combined__country_get_by_code` | [external:combined] Get country info by 2-letter code (e.g. BD, US, GB). | Y | 0 | 0 |
| 36 | `combined__country_list_all` | [external:combined] List all countries with basic info (name, code, capital, region). | Y | 0 | 0 |
| 37 | `combined__country_search` | [external:combined] Search countries by name. Returns flag, capital, currency, population, languages, timezones. | Y | 0 | 0 |
| 38 | `combined__crypto_market` | [external:combined] Get top cryptocurrencies by market cap. | Y | 0 | 0 |
| 39 | `combined__crypto_price` | [external:combined] Get live price of cryptocurrencies (BTC, ETH, etc.) in multiple currencies. | Y | 0 | 0 |
| 40 | `combined__crypto_search` | [external:combined] Search for a cryptocurrency by name or symbol. | Y | 0 | 0 |
| 41 | `combined__currency_convert` | [external:combined] Convert amount from one currency to another using ECB rates. | Y | 0 | 0 |
| 42 | `combined__currency_list` | [external:combined] List all supported currencies. | Y | 0 | 0 |
| 43 | `combined__currency_rates` | [external:combined] Get exchange rates for a base currency. | Y | 0 | 0 |
| 44 | `combined__ip_lookup` | [external:combined] Get geolocation info from IP address (country, city, ISP, coordinates). | Y | 0 | 0 |
| 45 | `combined__qr_generate` | [external:combined] Generate a QR code image URL from text or URL. | Y | 0 | 0 |
| 46 | `combined__stackoverflow_get_answers` | [external:combined] Get all answers for a Stack Overflow question, sorted by votes. | Y | 0 | 0 |
| 47 | `combined__stackoverflow_get_question` | [external:combined] Get a full Stack Overflow question with body, answers, tags, score. | Y | 0 | 0 |
| 48 | `combined__stackoverflow_get_tag_info` | [external:combined] Get info about a Stack Overflow tag (count, synonyms, wiki). | Y | 0 | 0 |
| 49 | `combined__stackoverflow_get_trending` | [external:combined] Get trending/popular questions on Stack Overflow. | Y | 0 | 0 |
| 50 | `combined__stackoverflow_search` | [external:combined] Search Stack Overflow questions by keyword. Returns titles, scores, views, answers, tags, links. | Y | 0 | 0 |
| 51 | `combined__stackoverflow_search_by_tag` | [external:combined] Search questions filtered by tag(s). | Y | 0 | 0 |
| 52 | `combined__weather_alerts` | [external:combined] Get severe weather alerts for a location. | Y | 0 | 0 |
| 53 | `combined__weather_current` | [external:combined] Get current weather for a location (temp, humidity, wind, conditions). | Y | 0 | 0 |
| 54 | `combined__weather_forecast` | [external:combined] Get weather forecast up to 16 days (daily or hourly). | Y | 0 | 0 |
| 55 | `combined__weather_geocode` | [external:combined] Convert city name to coordinates. | Y | 0 | 0 |
| 56 | `combined__weather_historical` | [external:combined] Get historical weather data for a date range (past data). | Y | 0 | 0 |
| 57 | `combined__wikipedia_get_article` | [external:combined] Get full content of a Wikipedia article as plain text. | Y | 0 | 0 |
| 58 | `combined__wikipedia_get_categories` | [external:combined] Get categories of a Wikipedia article. | Y | 0 | 0 |
| 59 | `combined__wikipedia_get_links` | [external:combined] Get internal links from a Wikipedia article. | Y | 0 | 0 |
| 60 | `combined__wikipedia_get_random` | [external:combined] Get a random Wikipedia article. | Y | 0 | 0 |
| 61 | `combined__wikipedia_get_sections` | [external:combined] Get section structure of a Wikipedia article. | Y | 0 | 0 |
| 62 | `combined__wikipedia_get_summary` | [external:combined] Get a quick summary of a Wikipedia article. | Y | 0 | 0 |
| 63 | `combined__wikipedia_search` | [external:combined] Search Wikipedia articles by keyword. | Y | 0 | 0 |
| 64 | `db_list_tables` | List tables in the configured database (MySQL/SQLite/PostgreSQL). Config from env vars ONLY (DB_*). Cross-platform. | Y | 1 | 0 |
| 65 | `db_query` | Run a SQL query against a configured database (MySQL/SQLite/PostgreSQL). Config comes from env vars ONLY (DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SQLITE_PATH, DB_TIMEOUT, PHP_BIN). MySQL/PostgreSQL use a PHP PDO bridge (db-bridge.php); SQLite uses Node built-in node:sqlite. Cross-platform (Windows/Linux/macOS). | Y | 0 | 0 |
| 66 | `delete_file` | Delete a file or directory (recursive for directories) | Y | 2 | 0 |
| 67 | `env_get` | Read an environment variable by name. Config is env-driven (never hardcoded). Values of KEY/SECRET/PASSWORD/TOKEN/AUTH variables are hidden unless reveal_secrets=true. | Y | 1 | 0 |
| 68 | `exec` | Run a shell command cross-platform in any folder. Windows uses PowerShell, Linux/macOS uses bash (override via EXEC_SHELL_WIN / EXEC_SHELL_LINUX env). Config from env vars ONLY (EXEC_SHELL_WIN, EXEC_SHELL_LINUX, EXEC_TIMEOUT, EXEC_MAX_BUFFER). | Y | 0 | 0 |
| 69 | `facebook-ads__ads_activate_entity` | [external:facebook-ads] Activate a paused campaign, ad set, or ad. | Y | 0 | 0 |
| 70 | `facebook-ads__ads_create_ad` | [external:facebook-ads] Create ad linking creative to ad set. | Y | 0 | 0 |
| 71 | `facebook-ads__ads_create_ad_set` | [external:facebook-ads] Create ad set with targeting, placement, schedule. | Y | 0 | 0 |
| 72 | `facebook-ads__ads_create_campaign` | [external:facebook-ads] Create campaign with objective and budget. Created in PAUSED status. | Y | 0 | 0 |
| 73 | `facebook-ads__ads_create_catalog` | [external:facebook-ads] Create product catalog for dynamic ads. | Y | 0 | 0 |
| 74 | `facebook-ads__ads_create_product_feed` | [external:facebook-ads] Create data feed for product uploads. | Y | 0 | 0 |
| 75 | `facebook-ads__ads_get_ad_accounts` | [external:facebook-ads] List accessible ad accounts. | Y | 0 | 0 |
| 76 | `facebook-ads__ads_get_ad_entities` | [external:facebook-ads] Retrieve campaigns, ad sets, ads under an account. | Y | 0 | 0 |
| 77 | `facebook-ads__ads_get_catalog` | [external:facebook-ads] Get catalog details. | Y | 0 | 0 |
| 78 | `facebook-ads__ads_get_dataset_quality` | [external:facebook-ads] Get signal health for dataset. | Y | 0 | 0 |
| 79 | `facebook-ads__ads_get_datasets` | [external:facebook-ads] List datasets in account. | Y | 0 | 0 |
| 80 | `facebook-ads__ads_get_help_article` | [external:facebook-ads] Search Meta Business Help Center. | Y | 0 | 0 |
| 81 | `facebook-ads__ads_get_opportunity_score` | [external:facebook-ads] Get Meta's opportunity score. | Y | 0 | 0 |
| 82 | `facebook-ads__ads_get_pages_for_business` | [external:facebook-ads] Display connected Facebook Pages. | Y | 0 | 0 |
| 83 | `facebook-ads__ads_get_pixel` | [external:facebook-ads] Get pixel details and health. | Y | 0 | 0 |
| 84 | `facebook-ads__ads_get_pixel_stats` | [external:facebook-ads] Get pixel event statistics. | Y | 0 | 0 |
| 85 | `facebook-ads__ads_get_product` | [external:facebook-ads] Get product details. | Y | 0 | 0 |
| 86 | `facebook-ads__ads_get_product_feed` | [external:facebook-ads] Get product feed details. | Y | 0 | 0 |
| 87 | `facebook-ads__ads_get_product_feed_upload` | [external:facebook-ads] Get feed upload history. | Y | 0 | 0 |
| 88 | `facebook-ads__ads_get_product_set` | [external:facebook-ads] Get product set details. | Y | 0 | 0 |
| 89 | `facebook-ads__ads_get_product_sets` | [external:facebook-ads] List product sets in catalog. | Y | 0 | 0 |
| 90 | `facebook-ads__ads_get_products` | [external:facebook-ads] List products in catalog. | Y | 0 | 0 |
| 91 | `facebook-ads__ads_insights_advertiser_context` | [external:facebook-ads] Get industry and geographic context. | Y | 0 | 0 |
| 92 | `facebook-ads__ads_insights_anomaly_signal` | [external:facebook-ads] Flag KPI deviations from baseline. | Y | 0 | 0 |
| 93 | `facebook-ads__ads_insights_auction_ranking_benchmarks` | [external:facebook-ads] Compare CTR, CPM, quality ranking. | Y | 0 | 0 |
| 94 | `facebook-ads__ads_insights_industry_benchmark` | [external:facebook-ads] Compare against industry averages. | Y | 0 | 0 |
| 95 | `facebook-ads__ads_insights_performance_trend` | [external:facebook-ads] Historical metric trajectory. | Y | 0 | 0 |
| 96 | `facebook-ads__ads_update_entity` | [external:facebook-ads] Modify campaigns, ad sets, or ads. | Y | 0 | 0 |
| 97 | `facebook-ads__ads_upload_products` | [external:facebook-ads] Upload products to catalog. | Y | 0 | 0 |
| 98 | `get_memory` | Retrieve session memory | Y | 0 | 0 |
| 99 | `get_working_dir` | Get current MCP working directory | Y | 40 | 0 |
| 100 | `glob` | Find files by glob pattern inside the MCP working dir (e.g. '**/*.{js,ts}') | Y | 7 | 0 |
| 101 | `grep` | Search file contents with a regex or plain text pattern inside the MCP working dir (bounded depth). Returns matching file paths + line snippets. | Y | 5 | 0 |
| 102 | `http_request` | Make an HTTP request (GET/POST/PUT/PATCH/DELETE) using Node built-in http/https. No external deps. Config: HTTP_TIMEOUT env (ms). Cross-platform. | Y | 0 | 0 |
| 103 | `list_directory` | List contents of a directory | Y | 1 | 0 |
| 104 | `ocr__ocr_batch` | [external:ocr] OCR many images in one call (max 50). Same options as ocr_image. | Y | 0 | 0 |
| 105 | `ocr__ocr_crop` | [external:ocr] Crop a region from an image and extract text (ffmpeg based — no ImageMagick needed). | Y | 2 | 0 |
| 106 | `ocr__ocr_image` | [external:ocr] Extract text from an image file (PNG, JPG, BMP, TIFF, PDF). Bengali+English by default. Use `crop` to read a region, `scale` to enlarge small text, `preprocess` for hard scans, `psm` for layout modes, `with_confidence` for a quality score. | Y | 17 | 0 |
| 107 | `ocr__ocr_screenshot` | [external:ocr] Screenshot the X11 display (ffmpeg x11grab) and OCR it. Region 'full' or 'WxH+X+Y'. | Y | 0 | 0 |
| 108 | `open_browser` | Open a file or URL in the default browser (uses xdg-open/open/start) | Y | 0 | 0 |
| 109 | `public-api__country_get_by_code` | [external:public-api] Get country info by 2-letter code (e.g. BD, US, GB). | Y | 0 | 0 |
| 110 | `public-api__country_list_all` | [external:public-api] List all countries with basic info (name, code, capital, region). | Y | 0 | 0 |
| 111 | `public-api__country_search` | [external:public-api] Search countries by name. Returns flag, capital, currency, population, languages, timezones. | Y | 0 | 0 |
| 112 | `public-api__crypto_market` | [external:public-api] Get top cryptocurrencies by market cap. | Y | 0 | 0 |
| 113 | `public-api__crypto_price` | [external:public-api] Get live price of cryptocurrencies (BTC, ETH, etc.) in multiple currencies. | Y | 0 | 0 |
| 114 | `public-api__crypto_search` | [external:public-api] Search for a cryptocurrency by name or symbol. | Y | 0 | 0 |
| 115 | `public-api__currency_convert` | [external:public-api] Convert amount from one currency to another using ECB rates. | Y | 0 | 0 |
| 116 | `public-api__currency_list` | [external:public-api] List all supported currencies. | Y | 0 | 0 |
| 117 | `public-api__currency_rates` | [external:public-api] Get exchange rates for a base currency. | Y | 0 | 0 |
| 118 | `public-api__ip_lookup` | [external:public-api] Get geolocation info from IP address (country, city, ISP, coordinates). | Y | 0 | 0 |
| 119 | `public-api__qr_generate` | [external:public-api] Generate a QR code image URL from text or URL. | Y | 0 | 0 |
| 120 | `public-api__stackoverflow_get_answers` | [external:public-api] Get all answers for a Stack Overflow question, sorted by votes. | Y | 0 | 0 |
| 121 | `public-api__stackoverflow_get_question` | [external:public-api] Get a full Stack Overflow question with body, answers, tags, score. | Y | 0 | 0 |
| 122 | `public-api__stackoverflow_get_tag_info` | [external:public-api] Get info about a Stack Overflow tag (count, synonyms, wiki). | Y | 0 | 0 |
| 123 | `public-api__stackoverflow_get_trending` | [external:public-api] Get trending/popular questions on Stack Overflow. | Y | 0 | 0 |
| 124 | `public-api__stackoverflow_search` | [external:public-api] Search Stack Overflow questions by keyword. Returns titles, scores, views, answers, tags, links. | Y | 0 | 0 |
| 125 | `public-api__stackoverflow_search_by_tag` | [external:public-api] Search questions filtered by tag(s). | Y | 0 | 0 |
| 126 | `public-api__weather_alerts` | [external:public-api] Get severe weather alerts for a location. | Y | 0 | 0 |
| 127 | `public-api__weather_current` | [external:public-api] Get current weather for a location (temp, humidity, wind, conditions). | Y | 0 | 0 |
| 128 | `public-api__weather_forecast` | [external:public-api] Get weather forecast up to 16 days (daily or hourly). | Y | 0 | 0 |
| 129 | `public-api__weather_geocode` | [external:public-api] Convert city name to coordinates. | Y | 0 | 0 |
| 130 | `public-api__weather_historical` | [external:public-api] Get historical weather data for a date range (past data). | Y | 0 | 0 |
| 131 | `public-api__wikipedia_get_article` | [external:public-api] Get full content of a Wikipedia article as plain text. | Y | 0 | 0 |
| 132 | `public-api__wikipedia_get_categories` | [external:public-api] Get categories of a Wikipedia article. | Y | 0 | 0 |
| 133 | `public-api__wikipedia_get_links` | [external:public-api] Get internal links from a Wikipedia article. | Y | 0 | 0 |
| 134 | `public-api__wikipedia_get_random` | [external:public-api] Get a random Wikipedia article. | Y | 0 | 0 |
| 135 | `public-api__wikipedia_get_sections` | [external:public-api] Get section structure of a Wikipedia article. | Y | 0 | 0 |
| 136 | `public-api__wikipedia_get_summary` | [external:public-api] Get a quick summary of a Wikipedia article. | Y | 0 | 0 |
| 137 | `public-api__wikipedia_search` | [external:public-api] Search Wikipedia articles by keyword. | Y | 0 | 0 |
| 138 | `read_file` | Read a file from the filesystem | Y | 17 | 5 |
| 139 | `read_ssot` | Read the current SSOT.md (Single Source of Truth) file — contains auto-detected project info | Y | 1 | 0 |
| 140 | `remote_mcp_call` | Call a tool on a remote MCP server (outbound MCP client). Use this to invoke tools exposed by connected remote MCP servers. | Y | 0 | 0 |
| 141 | `rename_file` | Rename or move a file/directory | Y | 0 | 0 |
| 142 | `screen-recorder__screen_record_start` | [external:screen-recorder] Start recording the screen. Returns recording ID. Use screen_record_stop to stop. | Y | 0 | 0 |
| 143 | `screen-recorder__screen_record_status` | [external:screen-recorder] Check if a screen recording is active. Lists all active recordings. | Y | 0 | 0 |
| 144 | `screen-recorder__screen_record_stop` | [external:screen-recorder] Stop the active screen recording. Returns the file path and duration. | Y | 0 | 0 |
| 145 | `screen-recorder__screen_screenshot` | [external:screen-recorder] Take a screenshot of the entire screen or a specific region. Returns file path. | Y | 1 | 0 |
| 146 | `set_working_dir` | Set MCP working directory for relative file paths | Y | 57 | 0 |
| 147 | `system_info` | Get cross-platform system info: platform, arch, OS, hostname, Node version, cwd, uptime, memory, non-secret env var names, and the configured DB config (values masked). | Y | 23 | 0 |
| 148 | `terminal` | Run a shell command in the server terminal (cwd = MCP working dir). Returns stdout/stderr/exit code. Windows: PowerShell 5.1; Linux/macOS: bash. | Y | 0 | 0 |
| 149 | `tts__tts_play` | [external:tts] Convert text to speech AND play it immediately. | Y | 0 | 0 |
| 150 | `tts__tts_speak` | [external:tts] Convert text to speech audio file. Uses Microsoft Edge TTS (free, no API key). Default voice: Bengali female (bn-BD-NabanitaNeural). | Y | 7 | 0 |
| 151 | `tts__tts_voices` | [external:tts] List available TTS voices. Filter by language. | Y | 0 | 0 |
| 152 | `web_search` | Search the web for real-time information | Y | 0 | 0 |
| 153 | `write_file` | Write content to a file (creates directories) | Y | 3 | 0 |

_Total: 153 tools (gateway + external). Toggles are live: disabling a tool removes it from_
`tools/list` _and refuses_ `tools/call` _at the execution choke point. Call/error_
_counters are runtime stats — a snapshot at generation time._
