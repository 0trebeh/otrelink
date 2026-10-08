# Otrelink MCP server

Lets an AI assistant (Claude Desktop, Claude Code, Cursor…) create and edit **your** Otrelink pages: add blocks, change the design, publish, see analytics, update the food truck's location for today, and more.

It acts as you through a **personal API token** (Business plan): it can only see and change the pages of the account that owns the token.

## 1. Get a token

In Otrelink: **Your pages → API → New token**. Choose *Read & write* (or *Read only* if the assistant should only look). Copy the `otl_…` token: it is shown only once.

## 2. Install

From the Otrelink folder (it uses `@otrelink/core` from this repository):

```bash
npm install
```

The server is `packages/mcp/src/index.js`. It needs two environment variables:

| Variable | Example |
|---|---|
| `OTRELINK_URL` | `https://your-otrelink.com` (the dashboard/API address, not the public page address) |
| `OTRELINK_TOKEN` | `otl_…` |

## 3. Connect your assistant

Use the **absolute path** of `index.js` on your computer.

### Claude Desktop

Settings → Developer → Edit Config (`claude_desktop_config.json`), then restart Claude Desktop:

```json
{
  "mcpServers": {
    "otrelink": {
      "command": "node",
      "args": ["C:\\Users\\you\\Proyects\\Otrelink\\packages\\mcp\\src\\index.js"],
      "env": {
        "OTRELINK_URL": "https://your-otrelink.com",
        "OTRELINK_TOKEN": "otl_…"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add otrelink -e OTRELINK_URL=https://your-otrelink.com -e OTRELINK_TOKEN=otl_… -- node /absolute/path/to/Otrelink/packages/mcp/src/index.js
```

(The server name goes **before** `-e`.)

### Cursor and others

Same `mcpServers` block as Claude Desktop, in `.cursor/mcp.json` (or your client's MCP settings).

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
| `upload_file` | Upload a local image or PDF and get its URL |

## Good to know

- Changes are saved right away (and are live if the page is published). If you have the same page open in the dashboard with unsaved changes, saving there overwrites what the assistant did — reload the editor first.
- Your plan's limits apply: blocks or backgrounds your plan doesn't include are refused.
- Each token can make 120 requests per minute. A tool usually makes one or two.
- A token can't touch your account, password, billing or other tokens. Revoke it any time in **API**; it stops working immediately.

## Try it

> "Create a page `cafe-luna` from the restaurant template, change the title to Café Luna, use the Forest theme and add a FAQ with our opening hours."

> "Today the truck is at Plaza Altamira until 10 pm and the al pastor is sold out."

## Develop

```bash
npm test -w @otrelink/mcp
```

The tests run every tool against an in-memory API (no server needed).
