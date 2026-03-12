import { tools, handleSearchToolCall } from "./tool";

// --- 类型定义 ---

interface Session {
  id: string;
  apiKey: string;
  model: string;
  writer: WritableStreamDefaultWriter<Uint8Array> | null;
}

// 内存存储会话
const sessions = new Map<string, Session>();

async function processMessage(message: any, session: Session): Promise<any> {
  const { method, params, id } = message;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "kimi-search-mcp",
          version: "1.0.0",
        },
      },
    };
  }

  if (method === "notifications/initialized") {
    return null;
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools,
      },
    };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params as {
      name: string;
      arguments: Record<string, any> | null;
    };
    try {
      if (name !== "search") {
        throw new Error(`Unknown tool: ${name}`);
      }

      const result = await handleSearchToolCall(
        args?.query,
        session.apiKey,
        session.model
      );
      return {
        jsonrpc: "2.0",
        id,
        result,
      };
    } catch (e: any) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: e.message },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  };
}

// 辅助函数：向 SSE 写入事件
async function sendSseEvent(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  event: string,
  data: any
) {
  const encoder = new TextEncoder();
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const message = `event: ${event}\ndata: ${payload}\n\n`;
  await writer.write(encoder.encode(message));
}

// --- Bun Server 启动 ---

export const server = Bun.serve({
  port: 3000,
  idleTimeout: 0,
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    // 跨域处理 (MCP Inspector 通常需要跨域)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
    };

    // 1. 建立 SSE 连接：GET /mcp?apiKey=xxx
    if (path === "/mcp" && req.method === "GET") {
      const apiKey = url.searchParams.get("apiKey");
      if (!apiKey) {
        return new Response("Missing 'apiKey' query parameter", {
          status: 400,
        });
      }

      const model = url.searchParams.get("model") || "kimi-k2-0905-preview";

      const sessionId = crypto.randomUUID();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      sessions.set(sessionId, { id: sessionId, apiKey, writer, model });

      req.signal.addEventListener("abort", () => {
        writer.close().catch(() => {});
        sessions.delete(sessionId);
        console.log(`Session ${sessionId} closed.`);
      });

      // 必须的 SSE 响应头
      const headers = {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      };

      // 核心规范：连接建立后，必须立即推送 event: endpoint，告诉客户端去哪里 POST 数据
      const endpointUrl = `${url.origin}/mcp/${sessionId}/message`;
      sendSseEvent(writer, "endpoint", endpointUrl).catch(console.error);

      return new Response(readable, { headers });
    }

    // 2. 接收客户端消息：POST /mcp/:sessionId/message
    const msgMatch = path.match(/^\/mcp\/([^/]+)\/message$/);
    if (msgMatch && req.method === "POST") {
      const sessionId = msgMatch[1];
      if (!sessionId) {
        return new Response("Invalid session ID", {
          status: 400,
          headers: corsHeaders,
        });
      }
      const session = sessions.get(sessionId);

      if (!session || !session.writer) {
        return new Response("Session not found", {
          status: 404,
          headers: corsHeaders,
        });
      }

      try {
        const body = await req.json();

        // 解析并生成回复
        const response = await processMessage(body, session);

        // 核心规范：返回的数据必须通过 SSE 通道发回去，事件类型为 message
        if (response) {
          await sendSseEvent(session.writer, "message", response);
        }

        // 核心规范：对于 POST 请求本身，只需返回 HTTP 202 Accepted 即可
        return new Response("Accepted", {
          status: 202,
          headers: corsHeaders,
        });
      } catch (err) {
        console.error("Error processing message:", err);
        return new Response("Invalid JSON or Processing Error", {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});
