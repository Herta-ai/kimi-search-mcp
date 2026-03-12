# Kimi Search

下面是一个简单的调用例子：

```js
/**
 * 使用 Kimi 的内置 $web_search 功能进行联网搜索
 */
async function kimiWebSearch(
  query: string,
  model: string = "kimi-k2-0905-preview"
): Promise<string> {
  const client = getClient(); // 在调用时才检查 API Key

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "你是 Kimi，一个由 Moonshot AI 提供的智能助手。请根据搜索结果提供准确、详细的回答。",
    },
    {
      role: "user",
      content: query,
    },
  ];

  // 定义 $web_search 工具
  // 必须使用 builtin_function 类型，不然 Kimi API 会拒绝 $ 开头的名称
  const tools: any[] = [
    {
      type: "builtin_function",  // 关键：使用 builtin_function
      function: {
        name: "$web_search",
      },
    },
  ];

  let finishReason: string | null = null;

  // 循环处理工具调用
  while (finishReason === null || finishReason === "tool_calls") {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 8000,
      tools,
    });

    const choice = response.choices[0];
    finishReason = choice.finish_reason;

    if (finishReason === "tool_calls" && choice.message.tool_calls) {
      // 将 assistant 消息添加到上下文
      messages.push(choice.message as OpenAI.Chat.ChatCompletionMessageParam);

      // 处理每个工具调用
      for (const toolCall of choice.message.tool_calls) {
        const toolCallName = toolCall.function.name;
        const toolCallArguments = JSON.parse(toolCall.function.arguments);

        let toolResult: any;

        if (toolCallName === "$web_search") {
          // 对于 Kimi 的 $web_search，直接返回参数
          // Kimi 会自动在后端执行搜索
          toolResult = toolCallArguments;
        } else {
          toolResult = { error: `未知工具: ${toolCallName}` };
        }

        // 添加工具调用结果到消息历史
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    } else if (choice.message.content) {
      // 返回最终结果
      return choice.message.content;
    }
  }

  return "搜索未返回结果";
}
```
