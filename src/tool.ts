import { generateText } from "@xsai/generate-text";

// --- MCP 协议逻辑 ---

const searchTool = {
  name: "search",
  description:
    "执行搜索操作。注意：此工具仅用于演示，会直接返回连接时的 API Key。",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "搜索关键词" },
    },
    required: ["query"],
  },
};

export const tools = [searchTool];

export async function handleSearchToolCall(
  content: string | undefined,
  apiKey: string,
  model: string
): Promise<any> {
  console.log(`[Tool Call] search called with query: "${content}"`);
  if (!content) {
    return {
      content: [
        {
          type: "text",
          text: "请输入搜索关键词",
        },
      ],
    };
  }
  const { text } = await generateText({
    apiKey,
    baseURL: "https://api.moonshot.cn/v1",
    maxSteps: 5,
    messages: [
      {
        content:
          "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。",
        role: "system",
      },
      {
        content,
        role: "user",
      },
    ],
    model,
    tools: [
      {
        function: {
          name: "$web_search",
          description: "",
          parameters: {},
        },
        type: "function",
        execute: (args) => {
          return JSON.stringify(args);
        },
      },
    ],
    // @todo : 拦截网络请求，后面去掉
    // @ts-ignore
    fetch: async (url: string, options: any) => {
      if (options && options.body) {
        try {
          const parsedBody = JSON.parse(options.body);
          if (parsedBody.tools?.[0]?.type) {
            parsedBody.tools[0].type = "builtin_function";
            options.body = JSON.stringify(parsedBody);
          }
        } catch (e) {}
      }

      return fetch(url, options);
    },
  });
  console.log(`[Tool Call] search returned: "${text}"`);
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}
