import { tools, handleSearchToolCall } from "./tool";

// 提取处理逻辑为纯函数，不再需要维护内存中的 Session 状态
async function processMessage(message: any, apiKey: string, model: string): Promise<any> {
  const { method, params, id } = message;

  // 1. 初始化握手
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

  // 2. 客户端通知 (不需要返回值)
  if (method === "notifications/initialized") {
    return null; 
  }

  // 3. 获取工具列表
  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools,
      },
    };
  }

  // 4. 调用工具
  if (method === "tools/call") {
    const { name, arguments: args } = params as {
      name: string;
      arguments: Record<string, any> | null;
    };
    try {
      if (name !== "search") {
        throw new Error(`Unknown tool: ${name}`);
      }

      const result = await handleSearchToolCall(args?.query, apiKey, model);
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

  // 未知方法
  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  };
}

// --- Bun Server 启动 ---

export const server = Bun.serve({
  port: 3000,
  idleTimeout: 0,
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    // 跨域处理 (MCP 规范中要求支持特定 Header)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, MCP-Session-Id, MCP-Protocol-Version",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, MCP-Session-Id, MCP-Protocol-Version",
    };

    // --- 核心修改：统一使用 /mcp 端点处理所有事情 ---
    if (path === "/mcp") {
      const apiKey = url.searchParams.get("apiKey");
      if (!apiKey) {
        return new Response("Missing 'apiKey' query parameter", {
          status: 400,
          headers: corsHeaders,
        });
      }
      const model = url.searchParams.get("model") || "kimi-k2-0905-preview";

      // 1. 处理客户端 POST 请求（核心的数据交互）
      if (req.method === "POST") {
        try {
          const body = await req.json();
          const response = await processMessage(body, apiKey, model);

          // 客户端发送的是 notification（如 notifications/initialized），按照规范必须返回 202 且没有 body
          if (!response) {
            return new Response(null, {
              status: 202, // Accepted
              headers: corsHeaders,
            });
          }

          // 标准 JSON-RPC 请求，直接在 HTTP Body 返回 JSON 结果
          return new Response(JSON.stringify(response), {
            status: 200, // OK
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          });
        } catch (err) {
          console.error("Error processing message:", err);
          return new Response("Invalid JSON or Processing Error", {
            status: 400,
            headers: corsHeaders,
          });
        }
      }

      // 2. 根据 MCP 最新规范，如果客户端尝试通过 GET 建立 SSE 连接，
      // 但我们的 Server 只支持简单的 Request/Response 模式（无服务端主动推送），
      // 我们必须明确返回 HTTP 405 Method Not Allowed。
      if (req.method === "GET") {
        return new Response("SSE stream not supported at this endpoint", {
          status: 405, // Method Not Allowed
          headers: corsHeaders,
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});