/**
 * universal-bridge — OpenCode plugin for the ZombieCoder Universal Adapter
 * ═══════════════════════════════════════════════════════════════════════
 * What this plugin does
 * ─────────────────────
 *   1. Probes the universal adapter (local TLS first, local HTTP second,
 *      main server last) and mirrors whatever it advertises into OpenCode,
 *      so the model can call those tools natively.
 *   2. Spawns the OCR / screen-recorder / TTS MCP servers as stdio children.
 *   3. Exposes one management tool, `adapter_control`, for status / refresh /
 *      enable / disable.
 *
 * Why `ctx.tool.transform` and not `ctx.tool.add`
 * ────────────────────────────────────────────────
 *   `Context.tool` is a `ToolDomain`, which exposes `transform / reload /
 *   list / hook` — there is NO `add` on it. Tool registration goes through a
 *   transform that hands you a `ToolEditor`, and *that* object has `add`.
 *   Calling `ctx.tool.add(...)` throws "ctx.tool.add is not a function" and
 *   OpenCode drops the whole plugin, so every call below goes through the
 *   single `register()` helper at the bottom.
 *
 * Safety rules
 * ────────────
 *   • NEVER breaks the editor. If no endpoint answers, setup logs a warning
 *     and returns; OpenCode continues with its built-in tools.
 *   • Never writes to stdout during setup (breaks stdio hosts).
 *   • Every proxied call is bounded by a timeout and returns a readable
 *     error string instead of throwing into the model's context.
 */
import { Plugin } from "@opencode/plugin"
import { createRequire } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

// ESM has no __dirname; derive it so the error message can point at the file.
const __dirname = fileURLToPath(new URL(".", import.meta.url))

// ─── Configuration ───────────────────────────────────────────────────────────

/**
 * Order matters: the local adapter is preferred because it sandboxes the file
 * tools and already mirrors the main server's tools (one source, one count).
 * The main server is only a last resort — its file tools are unrestricted.
 */
const ENDPOINTS = [
  process.env.UNIVERSAL_ADAPTER_HTTPS || "https://localhost:5443/mcp",
  process.env.UNIVERSAL_ADAPTER_HTTP || "http://127.0.0.1:5400/mcp",
  process.env.UNIVERSAL_ADAPTER_REMOTE || "https://api.zombiecoder.my.id/mcp",
].filter(Boolean)

const CALL_TIMEOUT_MS = Number(process.env.UNIVERSAL_ADAPTER_TIMEOUT ?? 20000)

const log = (m: string): void => console.log(`[universal-bridge] ${m}`)

/** Names already taken by OpenCode itself; we prefix ours to avoid a clash. */
const PREFIX = process.env.UNIVERSAL_ADAPTER_PREFIX ?? "ua_"

// ─── TLS policy ──────────────────────────────────────────────────────────────
//
// Verification used to be switched off globally (`rejectUnauthorized: false`),
// which meant the remote endpoint was accepted without any identity check at
// all. It is now decided per host:
//
//   loopback (localhost / 127.0.0.1)
//       → trust OUR adapter certificate (~/.zombiecoder/certs/adapter-cert.pem)
//         as a private CA. A different certificate on 5443 is rejected.
//         Only if that file is missing do we fall back to unverified loopback
//         TLS, and we say so out loud.
//   everything else (api.zombiecoder.my.id)
//       → ordinary public-CA verification. That host presents a certificate
//         issued by Google Trust Services, so `rejectUnauthorized: true` works
//         as-is — there is nothing to bypass.
//
// Optional hardening: set UNIVERSAL_ADAPTER_PIN_SHA256 to a certificate
// SHA-256 fingerprint (uppercase hex, colons optional) to pin it. Left unset
// on purpose — the certificate expires Nov 30 2026 and a pin would break the
// bridge on every renewal.

const ADAPTER_CERT_PATH =
  process.env.UNIVERSAL_ADAPTER_CA ?? join(homedir(), ".zombiecoder", "certs", "adapter-cert.pem")

const PIN_SHA256 = (process.env.UNIVERSAL_ADAPTER_PIN_SHA256 ?? "").replace(/:/g, "").toUpperCase()

let warnedMissingCert = false

function tlsPolicy(u: URL): { rejectUnauthorized: boolean; ca?: string[] } {
  if (u.protocol !== "https:") return { rejectUnauthorized: true }

  const host = u.hostname
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1"

  if (loopback) {
    if (existsSync(ADAPTER_CERT_PATH)) {
      return { rejectUnauthorized: true, ca: [readFileSync(ADAPTER_CERT_PATH, "utf8")] }
    }
    if (!warnedMissingCert) {
      warnedMissingCert = true
      log(`⚠ adapter certificate not found at ${ADAPTER_CERT_PATH} — loopback TLS is unverified`)
    }
    return { rejectUnauthorized: false }
  }

  return { rejectUnauthorized: true }
}

// ─── Tiny JSON-RPC client ───────────────────────────────────────────────────

type RpcReply = { result?: unknown; error?: { code: number; message: string } }

function rpc(url: string, method: string, params: unknown = {}, id = 1): Promise<RpcReply> {
  const u = new URL(url)
  const isHttps = u.protocol === "https:"
  // ESM has no global `require`; createRequire bridges back to the builtins.
  const nodeRequire = createRequire(import.meta.url)
  const mod = isHttps ? nodeRequire("node:https") : nodeRequire("node:http")

  const policy = isHttps ? tlsPolicy(u) : {}

  return new Promise<RpcReply>((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id, method, params })
    const options: any = {
      method: "POST",
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: CALL_TIMEOUT_MS,
      ...policy,
    }

    // Keep Node's hostname check and layer the optional pin on top of it.
    if (PIN_SHA256) {
      const tlsMod = nodeRequire("node:tls")
      options.checkServerIdentity = (host: string, cert: any) => {
        const err = tlsMod.checkServerIdentity(host, cert)
        if (err) return err
        const got = String(cert?.fingerprint256 ?? "").replace(/:/g, "").toUpperCase()
        if (got && got !== PIN_SHA256) {
          return new Error(`certificate pin mismatch for ${host}: ${got}`)
        }
        return undefined
      }
    }

    const req = mod.request(options, (res: any) => {
      let data = ""
      res.on("data", (c: Buffer) => (data += c))
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error(`adapter returned non-JSON (${res.statusCode}): ${data.slice(0, 120)}`))
        }
      })
    })
    req.on("timeout", () => req.destroy(new Error(`timeout after ${CALL_TIMEOUT_MS}ms`)))
    req.on("error", reject)
    req.write(body)
    req.end()
  })
}

/** MCP content is an array; join every text part so nothing is silently lost. */
function contentText(result: any): string {
  const content = result?.content
  if (Array.isArray(content)) {
    const text = content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
    if (text) return text
  }
  return JSON.stringify(result ?? {}, null, 2)
}

/** Try each endpoint until one answers tools/list. */
async function findEndpoint(): Promise<{ url: string; tools: any[] } | null> {
  for (const url of ENDPOINTS) {
    try {
      const reply = await rpc(url, "tools/list")
      if (reply?.result?.tools?.length) {
        return { url, tools: reply.result.tools }
      }
      log(`${url} answered but advertised no tools`)
    } catch (e: any) {
      log(`${url} unreachable — ${e.message}`)
    }
  }
  return null
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export default Plugin.define({
  id: "universal-bridge",
  async setup(ctx: any) {
    const found = await findEndpoint()

    if (!found) {
      log(
        "adapter not reachable on any endpoint — skipping tool mirroring.\n" +
          "           Start it with:  node " +
          '"' +
          __dirname +
          '/index.js"',
      )
      // Do NOT throw. A missing adapter must never take the editor down.
      return
    }

    log(`connected → ${found.url} (${found.tools.length} tools)`)
    if (found.url.includes("api.zombiecoder.my.id")) {
      log("⚠ local adapter not running — fell back to the main server, whose file tools are NOT sandboxed")
    }

    /** What we mirror: one entry per tool, registered in a single transform. */
    const mirrored: { name: string; tool: any }[] = []

    const mirrorInfo = (url: string, tool: any) => ({
      name: PREFIX + tool.name,
      description: tool.description || "",
      input: tool.inputSchema ?? { type: "object", properties: {}, required: [] },
      output: { type: "string" },
      async execute(args: any) {
        try {
          const reply = await rpc(url, "tools/call", { name: tool.name, arguments: args ?? {} })
          if (reply.error) {
            return {
              output: `❌ ${reply.error.message} (code ${reply.error.code})`,
              metadata: {},
            }
          }
          return { output: contentText(reply.result), metadata: {} }
        } catch (e: any) {
          // Never throw into the model context — a readable string is more
          // useful to it than an unhandled rejection.
          return { output: `❌ ${e.message}`, metadata: {} }
        }
      },
    })

    for (const tool of found.tools) {
      mirrored.push({ name: PREFIX + tool.name, tool })
    }
    await register(ctx, mirrored.map((m) => mirrorInfo(found.url, m.tool)))

    // ─── Child-process (stdio) MCP servers ───────────────────────────────
    // OCR / screen-recorder / TTS run as real child processes of this
    // plugin — no TCP port is allocated, nothing is exposed on any
    // interface, and their lifetime is tied to the parent process.
    const childServers: Array<{ name: string; pid: number; tools: number }> = []
    try {
      const nodeRequire = createRequire(import.meta.url)
      const { createStdioClient } = nodeRequire("/home/sahon/continue/mcp-stdio-client.js")

      const ROOT = "/home/sahon/continue"
      const CHILDREN = [
        { name: "ocr", args: ["external mcp/ocr-mcp.js"] },
        { name: "screen-recorder", args: ["external mcp/screen-recorder-mcp.js"] },
        { name: "tts", args: ["external mcp/tts-mcp.js"] },
      ]

      const childInfos: any[] = []
      for (const def of CHILDREN) {
        try {
          const client = createStdioClient({ name: def.name, args: def.args, cwd: ROOT, timeoutMs: 30000 })
          const tools = await client.tools()
          for (const t of tools) {
            childInfos.push({
              name: `mcp_${def.name}_${t.name}`,
              description: `[stdio child: ${def.name}] ${t.description || ""}`,
              input: t.inputSchema ?? { type: "object", properties: {}, required: [] },
              output: { type: "string" },
              async execute(a: any) {
                try {
                  const r = await client.call("tools/call", { name: t.name, arguments: a ?? {} })
                  return { output: contentText(r), metadata: {} }
                } catch (e: any) {
                  return { output: `❌ ${e.message}`, metadata: {} }
                }
              },
            })
          }
          childServers.push({ name: def.name, pid: client.pid, tools: tools.length })
          log(`child "${def.name}" pid=${client.pid} → ${tools.length} tools (stdio, no port)`)
        } catch (e: any) {
          log(`child "${def.name}" unavailable: ${e.message}`)
        }
      }
      await register(ctx, childInfos)
    } catch (e: any) {
      log(`child MCP setup skipped: ${e.message}`)
    }

    // ─── Management tool: let the client drive the adapter itself ───────────
    await register(ctx, [
      {
        name: "adapter_control",
        description:
          "Manage the universal adapter: check status, re-scan tools, or enable/disable a tool. " +
          "Use this whenever you need to know what the adapter offers right now.",
        input: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["status", "refresh", "enable", "disable", "tools"],
              description: "What to do.",
            },
            tool: {
              type: "string",
              description:
                "Tool name (required for enable/disable). Use the 'ua_' prefix to list them first.",
            },
          },
          required: ["action"],
        },
        output: { type: "string" },

        async execute(args: any) {
          try {
            switch (args?.action) {
              case "status": {
                const reply = await rpc(found.url, "tools/call", {
                  name: "adapter_status",
                  arguments: {},
                })
                const base = reply.error ? `❌ ${reply.error.message}` : contentText(reply.result)
                const children = childServers.length
                  ? "\n\nchild MCP servers (stdio, no ports):\n" +
                    childServers
                      .map((c) => `  • ${c.name.padEnd(18)} pid=${String(c.pid).padEnd(7)} ${c.tools} tools`)
                      .join("\n")
                  : "\n\nchild MCP servers: none"
                return {
                  output: `endpoint: ${found.url}\n\n${base}${children}`,
                  metadata: {},
                }
              }

              case "tools": {
                const list = mirrored.map((m) => m.name)
                return { output: list.join("\n"), metadata: {} }
              }

              case "refresh": {
                const again = await findEndpoint()
                if (!again) return { output: "Adapter unreachable", metadata: {} }
                found.url = again.url
                found.tools = again.tools
                mirrored.length = 0
                for (const t of again.tools) mirrored.push({ name: PREFIX + t.name, tool: t })
                await register(
                  ctx,
                  again.tools.map((t: any) => mirrorInfo(again.url, t)),
                )
                const ids = again.tools.map((t: any) => PREFIX + t.name)
                return {
                  output: `Re-registered ${ids.length} tool(s) from ${again.url}:\n${ids.join("\n")}`,
                  metadata: {},
                }
              }

              case "enable":
              case "disable": {
                if (!args?.tool) return { output: "`tool` is required", metadata: {} }
                const name = String(args.tool).replace(new RegExp("^" + PREFIX), "")
                const reply = await rpc(found.url, `tools/${args.action}`, { name })
                return {
                  output: reply.error ? `❌ ${reply.error.message}` : contentText(reply.result),
                  metadata: {},
                }
              }

              default:
                return { output: `Unknown action: ${args?.action}`, metadata: {} }
            }
          } catch (e: any) {
            return { output: `❌ ${e.message}`, metadata: {} }
          }
        },
      },
    ])

    log(`mirrored ${mirrored.length} tools: ${mirrored.slice(0, 6).map((m) => m.name).join(", ")}${mirrored.length > 6 ? ", …" : ""}`)
    log("management tool: adapter_control (actions: status, tools, refresh, enable, disable)")
  },
})

/**
 * Register (or re-register) a batch of tools through ONE transform.
 *
 * `Context.tool` has no `add` — registration goes through
 * `tool.transform((editor) => editor.add(info))`, where `ToolEditor` exposes
 * `add / get / update / remove / namespace`. Batching into a single transform
 * also means a refresh replaces the set atomically instead of once per tool.
 */
async function register(ctx: any, infos: any[]): Promise<void> {
  if (!infos.length) return
  await ctx.tool.transform((editor: any) => {
    for (const info of infos) {
      // Re-adding an existing name is undefined behaviour in the host, so
      // drop the previous registration first.
      if (typeof editor.get === "function" && editor.get(info.name)) {
        try {
          editor.remove(info.name)
        } catch {
          /* fall through to add */
        }
      }
      editor.add(info)
    }
  })
}
