/**
 * test-plugin.mjs — Load the real plugin and run its real setup() against a
 * mock OpenCode context, so we can see exactly which tools it registers.
 *
 * The mock deliberately mirrors the REAL `Context.tool` from
 * `@opencode/plugin@2.x`, which is a `ToolDomain`:
 *
 *     transform(cb)  ← the ONLY way to register a tool; cb gets a ToolEditor
 *     list() / reload() / hook()
 *
 * `ToolEditor` (what the callback receives) has add/get/update/remove.
 *
 * There is intentionally NO `ctx.tool.add`. An earlier version of this test
 * invented one, which made it pass while the plugin failed to load in the
 * real editor ("ctx.tool.add is not a function", 34 times in opencode.log).
 * If the plugin regresses to calling ctx.tool.add, this test throws the same
 * way OpenCode does.
 *
 * Nothing is mocked except the ctx object itself.
 */

// Point the plugin at the LOCAL adapter before index.ts is imported — its
// endpoints are read at module load. The main server is excluded so this test
// can never silently pass against the wrong backend.
process.env.UNIVERSAL_ADAPTER_HTTPS ??= "https://localhost:5443/mcp";
process.env.UNIVERSAL_ADAPTER_HTTP ??= "http://127.0.0.1:5400/mcp";
process.env.UNIVERSAL_ADAPTER_REMOTE = "";

const registered = [];

const ctx = {
  tool: {
    // ToolDomain — no `add` lives here, exactly like the real host.
    transform: async (cb) => {
      cb({
        add: (tool) => {
          const i = registered.findIndex((t) => t.name === tool.name);
          if (i !== -1) registered.splice(i, 1);
          registered.push(tool);
        },
        get: (id) => registered.find((t) => t.name === id),
        update: (id, mutate) => {
          const t = registered.find((x) => x.name === id);
          if (t) mutate(t);
        },
        remove: (id) => {
          const i = registered.findIndex((t) => t.name === id);
          if (i !== -1) registered.splice(i, 1);
        },
        namespace: () => {},
        list: () => registered,
      });
      return { dispose: async () => {} };
    },
    list: async () => registered,
    reload: async () => {},
    hook: async () => ({ dispose: async () => {} }),
  },
};

console.log("─".repeat(68));
console.log("  Loading universal-bridge plugin (real index.ts)");
console.log("─".repeat(68));

const mod = await import("./index.ts");
const plugin = mod.default;

await plugin.setup(ctx);

console.log(`\n  Registered tools: ${registered.length}\n`);

// ── Prove the tools actually execute against the live adapter ────────────────
let pass = 0,
  fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? "  → " + detail : ""}`);
  }
};

console.log("  Mirrored adapter tools:");
for (const t of registered.slice(0, 8)) console.log(`     ${t.name.padEnd(26)} ${(t.description || "").slice(0, 44)}`);
console.log(`     … and ${Math.max(0, registered.length - 8)} more`);

console.log("\n  Mock matches the real host API:\n");
ok("ctx.tool.transform is the registration path", typeof ctx.tool.transform === "function");
ok("no ctx.tool.add (the bug that broke the plugin)", typeof ctx.tool.add === "undefined");

console.log("\n  Live execution through the plugin:\n");

// Local adapter's own tools.
for (const name of ["ua_system_info", "ua_hash_text"]) {
  const t = registered.find((x) => x.name === name);
  if (!t) {
    ok(name, false, "not registered");
    continue;
  }
  const args = name === "ua_hash_text" ? { text: "plugin bridge proof" } : {};
  const res = await t.execute(args, {});
  ok(name, typeof res.output === "string" && res.output.length > 0, String(res.output).slice(0, 80));
}

// The main server's tools must arrive THROUGH the adapter — this is the whole
// point of the pull-sync. agent_mission is a main-server-only tool name.
{
  const t = registered.find((x) => x.name === "ua_agent_mission");
  ok("ua_agent_mission (main server, pulled via adapter)", !!t);
}

// Main-server tool actually executing end to end: adapter → main server.
{
  const t = registered.find((x) => x.name === "ua_get_working_dir");
  if (t) {
    const res = await t.execute({}, {});
    ok(
      "ua_get_working_dir forwards to the main server",
      typeof res.output === "string" && res.output.includes("/"),
      String(res.output).slice(0, 80),
    );
  } else {
    ok("ua_get_working_dir forwards to the main server", false, "not registered");
  }
}

// Count proof: 152 main-server tools - 7 collisions + 9 local = 154.
{
  const ua = registered.filter((t) => t.name.startsWith("ua_")).length;
  ok(`adapter mirrors 154 tools (got ${ua})`, ua === 154, `expected 154, got ${ua}`);
}

// management tool
const ctl = registered.find((x) => x.name === "adapter_control");
ok("adapter_control registered", !!ctl);
if (ctl) {
  const st = await ctl.execute({ action: "status" }, {});
  // adapter_status reports name "universal-adapter".
  ok(
    "adapter_control status",
    String(st.output).includes('"name": "universal-adapter"'),
    String(st.output).slice(0, 90),
  );
  ok("status shows the main server link", String(st.output).includes("main_server"), String(st.output).slice(0, 90));

  const tl = await ctl.execute({ action: "tools" }, {});
  ok("adapter_control tools", String(tl.output).includes("ua_"), String(tl.output).slice(0, 90));

  const rf = await ctl.execute({ action: "refresh" }, {});
  ok("adapter_control refresh", String(rf.output).includes("Re-registered"), String(rf.output).slice(0, 90));

  const en = await ctl.execute({ action: "enable", tool: "ua_hash_text" }, {});
  ok("adapter_control enable", String(en.output).includes("enabled"), String(en.output).slice(0, 90));
}

// error path must not throw, and the ADAPTER's sandbox must win over the main
// server's unrestricted read_file (collision policy: local implementation wins).
{
  const t = registered.find((x) => x.name === "ua_read_file");
  if (t) {
    const r = await t.execute({ path: "../../../etc/passwd" }, {});
    ok(
      "sandbox blocks paths outside roots",
      String(r.output).includes("outside allowed roots"),
      String(r.output).slice(0, 90),
    );
  } else {
    ok("sandbox blocks paths outside roots", false, "ua_read_file not registered");
  }
}

console.log("\n" + "─".repeat(68));
console.log(`  PLUGIN TEST: ${pass} passed, ${fail} failed`);
console.log("─".repeat(68));
process.exit(fail === 0 ? 0 : 1);
