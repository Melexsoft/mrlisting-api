#!/usr/bin/env node
/**
 * mrlisting-mcp — a stdio MCP server bridging Claude Code (or any MCP client)
 * to one MrListing directory through the agent API.
 *
 * Zero dependencies by design, like the SDK itself: MCP over stdio is
 * newline-delimited JSON-RPC 2.0, which needs no framework.
 *
 * Environment:
 *   MRLISTING_URL        e.g. https://admin.example.com/api/agent/v1
 *   MRLISTING_AGENT_KEY  an agent key issued under Settings → Agent access
 *
 * Tools are advertised according to the key's permissions: a read-only key
 * yields a read-only toolbox. Every tool maps 1:1 to an agent API endpoint.
 */

const PROTOCOL_VERSION = "2024-11-05"

type Json = Record<string, unknown>

interface ToolDefinition {
  name: string
  description: string
  /** Scope the key must hold; null = any active key. */
  scope: string | null
  inputSchema: Json
  call: (api: Api, args: Json) => Promise<unknown>
}

export interface Api {
  request(method: string, path: string, body?: unknown): Promise<unknown>
}

export function createApi(baseUrl: string, key: string, fetchImpl: typeof fetch = fetch): Api {
  const root = baseUrl.replace(/\/$/, "")

  return {
    async request(method, path, body) {
      const response = await fetchImpl(`${root}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })

      const payload = (await response.json().catch(() => ({}))) as Json
      if (!response.ok) {
        const errors = Array.isArray(payload.errors) ? payload.errors.join("; ") : response.statusText
        throw new Error(`${response.status}: ${errors}`)
      }
      return payload.resource ?? payload
    },
  }
}

const query = (args: Json, keys: string[]) => {
  const params = new URLSearchParams()
  for (const k of keys) {
    const value = args[k]
    if (value !== undefined && value !== null && value !== "") params.set(k, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ""
}

const str = (description: string) => ({ type: "string", description })
const bool = (description: string) => ({ type: "boolean", description })

export const TOOLS: ToolDefinition[] = [
  {
    name: "whoami",
    description: "The connected directory and what this key may do.",
    scope: null,
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/me"),
  },
  {
    name: "get_capabilities",
    description:
      "The full capability map for this key: every granted and ungranted permission, the endpoints each unlocks, configurable settings with their meaning, and the limits that apply. Read this first.",
    scope: null,
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/capabilities"),
  },
  {
    name: "get_reference_data",
    description: "Cities, listing types, tags, article scopes and submission statuses of this directory.",
    scope: null,
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/reference"),
  },
  {
    name: "search_listings",
    description: "Search the directory's entries, drafts included. Filter by status (published|draft) or free text.",
    scope: "listings.read",
    inputSchema: {
      type: "object",
      properties: { q: str("Free-text search"), status: str("published or draft"), page: { type: "number" } },
    },
    call: (api, args) => api.request("GET", `/listings${query(args, ["q", "status", "page"])}`),
  },
  {
    name: "get_listing",
    description: "One entry by slug, with owner-level detail.",
    scope: "listings.read",
    inputSchema: { type: "object", properties: { slug: str("The entry's slug") }, required: ["slug"] },
    call: (api, args) => api.request("GET", `/listings/${encodeURIComponent(String(args.slug))}`),
  },
  {
    name: "create_listing",
    description: "Create an entry. City is free text and resolved server-side. Created unpublished unless published=true.",
    scope: "listings.write",
    inputSchema: {
      type: "object",
      properties: {
        name: str("Entry name"), short_description: str("One-liner"), description: str("Long text"),
        email: str("Contact email"), phone: str("Phone"), website: str("URL"),
        address: str("Street address"), postal_code: str("Postal code"), city_name: str("City, free text"),
        published: bool("Publish immediately"),
      },
      required: ["name"],
    },
    call: (api, args) => api.request("POST", "/listings", { listing: args }),
  },
  {
    name: "update_listing",
    description: "Update an entry's attributes by slug.",
    scope: "listings.write",
    inputSchema: {
      type: "object",
      properties: {
        slug: str("The entry to change"), name: str("Entry name"), short_description: str("One-liner"),
        description: str("Long text"), email: str("Contact email"), phone: str("Phone"), website: str("URL"),
        address: str("Street address"), postal_code: str("Postal code"), city_name: str("City, free text"),
        published: bool("Published state"),
      },
      required: ["slug"],
    },
    call: (api, { slug, ...rest }) =>
      api.request("PATCH", `/listings/${encodeURIComponent(String(slug))}`, { listing: rest }),
  },
  {
    name: "publish_listing",
    description: "Publish or unpublish an entry.",
    scope: "listings.write",
    inputSchema: {
      type: "object",
      properties: { slug: str("The entry"), published: bool("true to publish, false to unpublish") },
      required: ["slug", "published"],
    },
    call: (api, args) =>
      api.request("PATCH", `/listings/${encodeURIComponent(String(args.slug))}`, {
        listing: { published: args.published },
      }),
  },
  {
    name: "delete_listing",
    description: "Delete an entry permanently.",
    scope: "listings.delete",
    inputSchema: { type: "object", properties: { slug: str("The entry to delete") }, required: ["slug"] },
    call: (api, args) => api.request("DELETE", `/listings/${encodeURIComponent(String(args.slug))}`),
  },
  {
    name: "list_categories",
    description: "The directory's categories with listing counts.",
    scope: "categories.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/categories"),
  },
  {
    name: "create_category",
    description: "Create a category.",
    scope: "categories.write",
    inputSchema: {
      type: "object",
      properties: { name: str("Name"), description: str("Description"), published: bool("Visible on the frontend") },
      required: ["name"],
    },
    call: (api, args) => api.request("POST", "/categories", { category: args }),
  },
  {
    name: "update_category",
    description: "Update a category by slug.",
    scope: "categories.write",
    inputSchema: {
      type: "object",
      properties: { slug: str("The category"), name: str("Name"), description: str("Description"), published: bool("Visible") },
      required: ["slug"],
    },
    call: (api, { slug, ...rest }) =>
      api.request("PATCH", `/categories/${encodeURIComponent(String(slug))}`, { category: rest }),
  },
  {
    name: "list_articles",
    description: "Articles including drafts. Filter by scope (blog|glossar|documentation|news), tag or status.",
    scope: "articles.read",
    inputSchema: {
      type: "object",
      properties: { q: str("Free text"), scope: str("Editorial scope"), tag: str("Tag slug"), status: str("published or draft"), page: { type: "number" } },
    },
    call: (api, args) => api.request("GET", `/articles${query(args, ["q", "scope", "tag", "status", "page"])}`),
  },
  {
    name: "get_article",
    description: "One article with its full markdown content.",
    scope: "articles.read",
    inputSchema: { type: "object", properties: { slug: str("The article") }, required: ["slug"] },
    call: (api, args) => api.request("GET", `/articles/${encodeURIComponent(String(args.slug))}`),
  },
  {
    name: "create_article",
    description: "Create an article (markdown content, comma-separated tags). Draft unless published=true.",
    scope: "articles.write",
    inputSchema: {
      type: "object",
      properties: {
        title: str("Title"), excerpt: str("Short summary"), content: str("Markdown body"),
        scope: str("blog | glossar | documentation | news"), tag_list: str("Comma-separated tags"),
        published: bool("Publish immediately"),
      },
      required: ["title"],
    },
    call: (api, args) => api.request("POST", "/articles", { article: args }),
  },
  {
    name: "update_article",
    description: "Update an article by slug.",
    scope: "articles.write",
    inputSchema: {
      type: "object",
      properties: {
        slug: str("The article"), title: str("Title"), excerpt: str("Short summary"), content: str("Markdown body"),
        scope: str("Editorial scope"), tag_list: str("Comma-separated tags"), published: bool("Published state"),
      },
      required: ["slug"],
    },
    call: (api, { slug, ...rest }) =>
      api.request("PATCH", `/articles/${encodeURIComponent(String(slug))}`, { article: rest }),
  },
  {
    name: "list_forms",
    description: "The directory's forms with their field definitions.",
    scope: "forms.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/forms"),
  },
  {
    name: "create_form",
    description:
      "Create a form. fields is an array of {key,label,type,required,options}; types: text, textarea, email, tel, select, checkbox.",
    scope: "forms.write",
    inputSchema: {
      type: "object",
      properties: {
        name: str("Form name"), key: str("URL key, lowercase_with_underscores"),
        kind: str("general | direct_inquiry | regional_inquiry"),
        success_message: str("Shown after submitting"), notify_emails: str("Comma-separated team addresses"),
        fields: { type: "array", description: "Field definitions", items: { type: "object" } },
      },
      required: ["name"],
    },
    call: (api, args) => api.request("POST", "/forms", { form: args }),
  },
  {
    name: "update_form",
    description: "Update a form by key. Passing fields replaces the whole field list.",
    scope: "forms.write",
    inputSchema: {
      type: "object",
      properties: {
        key: str("The form to change"), name: str("Form name"), active: bool("Accepting submissions"),
        kind: str("general | direct_inquiry | regional_inquiry"),
        success_message: str("Shown after submitting"), notify_emails: str("Comma-separated team addresses"),
        fields: { type: "array", description: "Replacement field definitions", items: { type: "object" } },
      },
      required: ["key"],
    },
    call: (api, { key, ...rest }) =>
      api.request("PATCH", `/forms/${encodeURIComponent(String(key))}`, { form: rest }),
  },
  {
    name: "list_schemas",
    description: "Schema definitions (dynamic collections) with their fields.",
    scope: "schemas.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/schemas"),
  },
  {
    name: "get_schema",
    description: "One schema by key, with its fields.",
    scope: "schemas.read",
    inputSchema: { type: "object", properties: { key: str("The schema") }, required: ["key"] },
    call: (api, args) => api.request("GET", `/schemas/${encodeURIComponent(String(args.key))}`),
  },
  {
    name: "create_schema",
    description: "Create a schema (a kind of collection, e.g. Shareholders).",
    scope: "schemas.write",
    inputSchema: {
      type: "object",
      properties: {
        name: str("Schema name"), description: str("What it holds"),
        cardinality: str("one_to_one | one_to_many | many_to_many"),
        published: bool("Expose on the public API"),
      },
      required: ["name"],
    },
    call: (api, args) => api.request("POST", "/schemas", { schema: args }),
  },
  {
    name: "update_schema",
    description: "Update a schema by key; title_field_key names the field used as a record's title.",
    scope: "schemas.write",
    inputSchema: {
      type: "object",
      properties: {
        key: str("The schema"), name: str("Schema name"), description: str("What it holds"),
        active: bool("Active"), published: bool("Expose on the public API"),
        title_field_key: str("Field key used as record title"),
      },
      required: ["key"],
    },
    call: (api, { key, ...rest }) =>
      api.request("PATCH", `/schemas/${encodeURIComponent(String(key))}`, { schema: rest }),
  },
  {
    name: "add_schema_field",
    description: "Add a field to a schema. Types include string, text, number, date, boolean, select, url, email.",
    scope: "schemas.write",
    inputSchema: {
      type: "object",
      properties: {
        schema_key: str("The schema"), label: str("Field label"), field_type: str("Field type"),
        required: bool("Required"), searchable: bool("Searchable"),
        options: { type: "array", items: { type: "string" }, description: "Choices for select fields" },
      },
      required: ["schema_key", "label"],
    },
    call: (api, { schema_key, ...rest }) =>
      api.request("POST", `/schemas/${encodeURIComponent(String(schema_key))}/fields`, { field: rest }),
  },
  {
    name: "update_schema_field",
    description: "Update one field of a schema.",
    scope: "schemas.write",
    inputSchema: {
      type: "object",
      properties: {
        schema_key: str("The schema"), field_key: str("The field"), label: str("Label"),
        required: bool("Required"), searchable: bool("Searchable"),
        options: { type: "array", items: { type: "string" } },
      },
      required: ["schema_key", "field_key"],
    },
    call: (api, { schema_key, field_key, ...rest }) =>
      api.request(
        "PATCH",
        `/schemas/${encodeURIComponent(String(schema_key))}/fields/${encodeURIComponent(String(field_key))}`,
        { field: rest },
      ),
  },
  {
    name: "delete_schema_field",
    description: "Remove a field from a schema.",
    scope: "schemas.write",
    inputSchema: {
      type: "object",
      properties: { schema_key: str("The schema"), field_key: str("The field") },
      required: ["schema_key", "field_key"],
    },
    call: (api, args) =>
      api.request(
        "DELETE",
        `/schemas/${encodeURIComponent(String(args.schema_key))}/fields/${encodeURIComponent(String(args.field_key))}`,
      ),
  },
  {
    name: "list_email_templates",
    description: "The directory's email templates with their placeholders.",
    scope: "email_templates.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/email_templates"),
  },
  {
    name: "update_email_template",
    description:
      "Edit a template's subject/body (plain text with {{placeholders}} from its whitelist) or use_layout.",
    scope: "email_templates.write",
    inputSchema: {
      type: "object",
      properties: {
        key: str("Template key"), subject: str("Subject line"), body: str("Plain-text body"),
        use_layout: bool("Wrap in the system mail layout"),
      },
      required: ["key"],
    },
    call: (api, { key, ...rest }) =>
      api.request("PATCH", `/email_templates/${encodeURIComponent(String(key))}`, { email_template: rest }),
  },
  {
    name: "reset_email_template",
    description: "Restore a template to its packaged default wording.",
    scope: "email_templates.write",
    inputSchema: { type: "object", properties: { key: str("Template key") }, required: ["key"] },
    call: (api, args) => api.request("POST", `/email_templates/${encodeURIComponent(String(args.key))}/reset`),
  },
  {
    name: "get_email_layout",
    description: "The system mail layout: header, footer, colour scheme.",
    scope: "mail_layout.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/mail_layout"),
  },
  {
    name: "update_email_layout",
    description: "Edit the mail layout. Colours are hex like #ff6600; keys: background, surface, text, accent.",
    scope: "mail_layout.write",
    inputSchema: {
      type: "object",
      properties: {
        header_text: str("Header line"), footer_text: str("Footer small print"),
        color_scheme: { type: "object", description: "Hex colours by key" },
      },
    },
    call: (api, args) => api.request("PATCH", "/mail_layout", { mail_layout: args }),
  },
  {
    name: "list_lead_questions",
    description: "The qualification questions asked after signup.",
    scope: "lead_questions.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/lead_questions"),
  },
  {
    name: "create_lead_question",
    description: "Create a lead question. Types: single_choice, multiple_choice, free_text, boolean.",
    scope: "lead_questions.write",
    inputSchema: {
      type: "object",
      properties: {
        question: str("The question"), field_type: str("Question type"), hint: str("Help text"),
        required: bool("Required"), options: { type: "array", items: { type: "string" } },
      },
      required: ["question"],
    },
    call: (api, args) => api.request("POST", "/lead_questions", { lead_question: args }),
  },
  {
    name: "update_lead_question",
    description: "Update a lead question by key.",
    scope: "lead_questions.write",
    inputSchema: {
      type: "object",
      properties: {
        key: str("The question"), question: str("Wording"), hint: str("Help text"),
        required: bool("Required"), active: bool("Asked at all"),
        options: { type: "array", items: { type: "string" } },
      },
      required: ["key"],
    },
    call: (api, { key, ...rest }) =>
      api.request("PATCH", `/lead_questions/${encodeURIComponent(String(key))}`, { lead_question: rest }),
  },
  {
    name: "delete_lead_question",
    description: "Delete a lead question (its answers go with it).",
    scope: "lead_questions.write",
    inputSchema: { type: "object", properties: { key: str("The question") }, required: ["key"] },
    call: (api, args) => api.request("DELETE", `/lead_questions/${encodeURIComponent(String(args.key))}`),
  },
  {
    name: "get_settings",
    description: "Directory settings (never credentials — SMTP password and Stripe keys are not readable).",
    scope: "settings.read",
    inputSchema: { type: "object", properties: {} },
    call: (api) => api.request("GET", "/settings"),
  },
  {
    name: "update_settings",
    description:
      "Change directory settings: name, locale, timezone, primary_domain, mail from, SMTP host/port/user, purchases_enabled. Credentials cannot be set here.",
    scope: "settings.write",
    inputSchema: {
      type: "object",
      properties: {
        name: str("Directory name"), locale: str("e.g. de"), timezone: str("e.g. Berlin"),
        primary_domain: str("Frontend domain"), mail_from_name: str("From name"),
        mail_from_email: str("From address"), smtp_address: str("SMTP host"),
        smtp_port: { type: "number" }, smtp_user_name: str("SMTP user"),
        purchases_enabled: bool("Commerce on/off"),
      },
    },
    call: (api, args) => api.request("PATCH", "/settings", { settings: args }),
  },
  {
    name: "get_form",
    description: "One form by key, with fields and routing settings.",
    scope: "forms.read",
    inputSchema: { type: "object", properties: { key: str("The form's key") }, required: ["key"] },
    call: (api, args) => api.request("GET", `/forms/${encodeURIComponent(String(args.key))}`),
  },
  {
    name: "list_submissions",
    description: "The form submission inbox. Filter by status (new_submission|read|archived|spam) or form key.",
    scope: "submissions.read",
    inputSchema: {
      type: "object",
      properties: { status: str("Status filter"), form_key: str("Only one form's inbox"), page: { type: "number" } },
    },
    call: (api, args) => api.request("GET", `/submissions${query(args, ["status", "form_key", "page"])}`),
  },
  {
    name: "get_submission",
    description: "One submission with all its answers.",
    scope: "submissions.read",
    inputSchema: { type: "object", properties: { id: { type: "number", description: "Submission id" } }, required: ["id"] },
    call: (api, args) => api.request("GET", `/submissions/${Number(args.id)}`),
  },
  {
    name: "set_submission_status",
    description: "Move a submission to read, archived, spam or back to new_submission.",
    scope: "submissions.write",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number", description: "Submission id" }, status: str("New status") },
      required: ["id", "status"],
    },
    call: (api, args) => api.request("PATCH", `/submissions/${Number(args.id)}`, { status: args.status }),
  },
  {
    name: "list_users",
    description: "Website users (read-only; the agent API offers no user writes).",
    scope: "users.read",
    inputSchema: { type: "object", properties: { role: str("user or listing_owner"), page: { type: "number" } } },
    call: (api, args) => api.request("GET", `/users${query(args, ["role", "page"])}`),
  },
]

export function availableTools(scopes: string[]): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.scope === null || scopes.includes(tool.scope))
}

interface RpcMessage {
  jsonrpc: "2.0"
  id?: number | string | null
  method?: string
  params?: Json
}

/** Handles one JSON-RPC message; returns the response, or null for notifications. */
export async function handleMessage(
  message: RpcMessage,
  api: Api,
  scopes: string[],
): Promise<Json | null> {
  const { id, method, params } = message
  const respond = (result: Json): Json => ({ jsonrpc: "2.0", id: id ?? null, result })
  const fail = (code: number, text: string): Json => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message: text } })

  if (method?.startsWith("notifications/")) return null

  switch (method) {
    case "initialize":
      return respond({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "mrlisting-mcp", version: "0.1.0" },
      })
    case "ping":
      return respond({})
    case "tools/list":
      return respond({
        tools: availableTools(scopes).map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      })
    case "tools/call": {
      const name = String(params?.name ?? "")
      const tool = availableTools(scopes).find((t) => t.name === name)
      if (!tool) return fail(-32602, `Unknown or unpermitted tool: ${name}`)

      try {
        const result = await tool.call(api, (params?.arguments as Json) ?? {})
        return respond({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] })
      } catch (error) {
        return respond({
          content: [{ type: "text", text: (error as Error).message }],
          isError: true,
        })
      }
    }
    default:
      return fail(-32601, `Method not found: ${method}`)
  }
}

async function main() {
  const baseUrl = process.env.MRLISTING_URL
  const key = process.env.MRLISTING_AGENT_KEY
  if (!baseUrl || !key) {
    process.stderr.write("mrlisting-mcp needs MRLISTING_URL and MRLISTING_AGENT_KEY.\n")
    process.exit(1)
  }

  const api = createApi(baseUrl, key)

  // The key's scopes decide which tools exist for this session.
  let scopes: string[] = []
  try {
    const me = (await api.request("GET", "/me")) as { key?: { permissions?: string[] } }
    scopes = me.key?.permissions ?? []
  } catch (error) {
    process.stderr.write(`mrlisting-mcp: could not verify the agent key: ${(error as Error).message}\n`)
    process.exit(1)
  }

  let buffer = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk

    let newline
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (!line) continue

      let parsed: RpcMessage
      try {
        parsed = JSON.parse(line)
      } catch {
        continue // not JSON-RPC; nothing sane to answer
      }

      const response = await handleMessage(parsed, api, scopes)
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`)
    }
  })
}

// Only run the loop when executed as a binary, so tests can import the parts.
const executedDirectly = process.argv[1]?.endsWith("mcp.js") || process.argv[1]?.endsWith("mrlisting-mcp")
if (executedDirectly) main()
