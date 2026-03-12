# xsai + 函数调用

```ts
import { generateText } from '@xsai/generate-text'
import { tool } from '@xsai/tool'
import { env } from 'node:process'
import { z } from 'zod'

const weather = await tool({
  description: 'Get the weather in a location',
  execute: ({ location }) =>
    JSON.stringify({
      location,
      temperature: 42,
    }),
  name: 'weather',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
})

const { text } = await generateText({
  apiKey: env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1/',
  maxSteps: 2,
  messages: [
    {
      content: 'You are a helpful assistant.',
      role: 'system',
    },
    {
      content: 'What is the weather in San Francisco?',
      role: 'user',
    },
  ],
  model: 'gpt-4o',
  tools: [weather],
})
```
