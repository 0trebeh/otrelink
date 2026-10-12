# Otrelink MCP server

Lets an AI assistant (Claude, Claude Code, Cursor…) create and edit **your** Otrelink pages: add blocks, change the design, publish, see analytics, update the food truck's location for today, and more.

It runs **online**, inside the Otrelink app, at **`https://your-otrelink.com/api/mcp`** (Streamable HTTP). Nothing to install. It acts as you through a **personal API token** (Business plan): it can only see and change the pages of the account that owns the token.

## 1. Get a token

In Otrelink: **Your pages → API → New token**. Choose *Read & write* (or *Read only* if the assistant should only look). Copy the `otl_…` token: it is shown only once. The **API** page also has every config below ready to copy, with your address and token.

## 2. Connect your assistant

### Claude (web, phone and desktop)

1. In claude.ai: **Customize → Connectors → + Add → Add custom connector**.
2. URL: `https://your-otrelink.com/api/mcp`. Sign in: **No sign in**. Request header: `Authorization: Bearer otl_…`.
3. The connector is saved in your Claude account, so it is available in the Claude apps on all your devices.

### Claude Code

```bash
claude mcp add --transport http otrelink https://your-otrelink.com/api/mcp \
  --header "Authorization: Bearer otl_…"
```

### Cursor and other apps with a config file

Apps that only start local servers reach the URL through the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge (needs Node.js). Add this to their MCP settings (in Cursor: `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "otrelink": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-otrelink.com/api/mcp", "--header", "Authorization:${OTRELINK_AUTH}"],
      "env": { "OTRELINK_AUTH": "Bearer otl_…" }
    }
  }
}
```

(The header has no space after `Authorization:` on purpose: on Windows, spaces inside `args` break. The space goes in `OTRELINK_AUTH`.)

## Tools

**Account & catalog**

| Tool | What it does |
|---|---|
| `get_account` | Plan, page limit, features that are on, where public pages live |
| `list_block_types` | Every block type, its category and whether your plan allows it |
| `get_block_type` | Fields of a block type (keys, options, defaults, required) and block options (style, animation, schedule) |
| `list_themes` | Theme presets |
| `list_templates` | Ready-made pages (restaurant, food truck, business card…) |
| `get_design_options` | Every design key, background types, profile/settings fields and social platforms |

**Pages**

| Tool | What it does |
|---|---|
| `list_pages` | Your pages with their public URLs |
| `get_page` | Block outline with ids (or the full page as JSON) |
| `create_page` | New page, empty or from a template |
| `update_page` | Slug, profile (title, bio, avatar), social icons, settings |
| `publish_page` | Publish or hide a page |
| `delete_page` | Delete a page (needs `confirm: true`) |
| `check_slug` | Is a username free? |

**Blocks**

| Tool | What it does |
|---|---|
| `add_block` | Add a block anywhere (top level, inside a collection, before/after another block) |
| `update_block` | Change fields, style options, show/hide |
| `move_block` | Reorder, move into or out of a collection |
| `remove_block` | Delete a block |
| `duplicate_block` | Copy a block right after itself |

**Design**

| Tool | What it does |
|---|---|
| `set_theme` | Apply a theme preset |
| `list_palettes` | Color palette presets (light and dark) |
| `apply_palette` | Recolor a page: a preset, your own colors, or one brand color |
| `update_design` | Change colors, fonts, buttons, accent, background… |

**Business**

| Tool | What it does |
|---|---|
| `get_analytics` | Visits, clicks, top links, countries, devices, busiest hours |
| `list_orders` | Pickup orders (read only) |
| `get_today` / `update_today` | Open/closed, today's location, note, sold-out products, pause orders |

**Files**

| Tool | What it does |
|---|---|
| `upload_file` | Upload an image or PDF (sent as base64, max 8 MB) and get its URL |

## Good to know

- Changes are saved right away (and are live if the page is published). If you have the same page open in the dashboard with unsaved changes, saving there overwrites what the assistant did — reload the editor first.
- Your plan's limits apply: blocks or backgrounds your plan doesn't include are refused.
- Each token can make 120 requests per minute. A tool usually makes one or two.
- A token can't touch your account, password, billing or other tokens. Revoke it any time in **API**; it stops working immediately.

## Try it

> "Create a page `cafe-luna` from the restaurant template, change the title to Café Luna, use the Forest theme and add a FAQ with our opening hours."

> "Today the truck is at Plaza Altamira until 10 pm and the al pastor is sold out."

## How it works

- `apps/web/app/api/mcp/route.js` serves the tools from `packages/mcp/src/server.js`. **Stateless**: every request builds its own server, so restarts and several instances are fine.
- The tools call the same app's API on `127.0.0.1:$PORT` (or `MCP_INTERNAL_URL`) with the caller's token, so plan limits, read-only tokens and the 120 requests/min limit apply as usual. The public address is passed along so uploaded files get public URLs.
- `upload_file` takes `{ name, base64 }` (max 8 MB): the server never reads its own disk.
- Claude connects from Anthropic's cloud, so the app must be reachable from the internet. On Render's free plan the first call after the service sleeps can take 30–50 s and may time out; try again.
- Later: **OAuth** sign-in (the user clicks *Connect*, logs in to Otrelink and approves), so nobody has to paste a token.

## Develop

```bash
npm test -w @otrelink/mcp
```

The tests run every tool against an in-memory API (no server needed).
