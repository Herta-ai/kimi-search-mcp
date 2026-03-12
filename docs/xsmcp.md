# xsMCP

### HTTP Server Structure

`@xsmcp/server-http` is based on [Web Standards](https://hono.dev/docs/concepts/web-standard), not Express.

```ts
import { createFetch } from '@xsmcp/server-http'
import { createServer } from '@xsmcp/server-shared'
import { serve } from 'srvx'

import * as tools from '...'

const server = createServer({ ...options })

for (const tool of tools) {
  server.addTool(tool)
}

// (req: Request) => Promise<Response>
const fetch = createFetch(server)

// node.js, deno, bun
serve({ fetch })

// cloudflare workers, pages
export default { fetch }
```

It can be used as a server on its own or with `hono`, `elysia` and `itty-router` for more features:

```ts
import { createFetch } from '@xsmcp/server-http'
import { createServer } from '@xsmcp/server-shared'
import { Elysia } from 'elysia'
import { Hono } from 'hono'
import { AutoRouter } from 'itty-router'

import * as tools from '...'

const server = createServer({ ...options })

for (const tool of tools) {
  server.addTool(tool)
}

const fetch = createFetch(server)

// hono
new Hono()
  .post('/mcp', ({ req }) => fetch(req.raw))

// elysia
new Elysia()
  .post('/mcp', ({ request }) => fetch(request))

// itty-router
AutoRouter()
  .post('/mcp', req => fetch(req))
```

At the same time, it does not depends on any server framework thus minimizing the size.

For simplicity reasons, this server only returns JSON Response, not SSE.
