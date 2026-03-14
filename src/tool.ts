import { generateText } from "@xsai/generate-text";

// --- MCP 协议逻辑 ---

const searchTool = {
  name: "search",
  description: "AI联网搜索",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "搜索内容" },
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
    maxSteps: 3,
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
        // @ts-ignore
        type: "builtin_function",
        // @ts-ignore
        function: {
          name: "$web_search",
        },
        execute: (args) => {
          return JSON.stringify(args);
        },
      },
    ],
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
