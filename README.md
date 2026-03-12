# Kimi Search MCP

<p align="center">
  <strong>基于 Kimi AI 的 MCP 联网搜索服务</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#配置说明">配置说明</a> •
  <a href="#部署">部署</a> •
  <a href="#api-接口">API 接口</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/runtime-Bun-000000?style=flat-square&logo=bun" alt="Bun">
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/protocol-MCP-FF6B6B?style=flat-square" alt="MCP">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

---

## 功能特性

- **AI 联网搜索** - 基于 Moonshot AI (Kimi) 的智能联网搜索能力
- **MCP 协议支持** - 完整实现 Model Context Protocol (2024-11-05 版本)
- **Streamable HTTP** - 采用最新的 Streamable HTTP 传输模式
- **轻量高效** - 基于 Bun 运行时，启动快、内存占用低
- **Docker 支持** - 提供开箱即用的 Dockerfile，便于容器化部署
- **跨平台编译** - 支持编译为独立可执行文件

## 快速开始

### 环境要求

- [Bun](https://bun.sh) >= 1.0.0
- Moonshot AI API Key

### 安装依赖

```bash
bun install
```

### 开发运行

```bash
bun run dev
```

服务启动后访问: `http://localhost:3000/mcp?apiKey=YOUR_API_KEY`

### 构建可执行文件

```bash
bun run build
```

编译后的可执行文件位于 `dist/kimi-search-mcp`

## 配置说明

### 环境变量

| 参数 | 必填 | 说明 |
|------|:----:|------|
| `apiKey` | 是 | Moonshot AI API Key |
| `model` | 否 | 使用的模型名称，默认 `kimi-k2-0905-preview` |

### 支持的模型

- `kimi-k2-0905-preview` (默认)
- 其他 Moonshot AI 提供的模型

## 部署

### Docker 构建

```bash
docker build -t kimi-search-mcp .
```

### Docker 运行

```bash
docker run -d -p 3000:3000 kimi-search-mcp
```

### Docker Compose

```yaml
version: '3'
services:
  kimi-search-mcp:
    build: .
    ports:
      - "3000:3000"
```

## API 接口

### 端点

```
POST http://localhost:3000/mcp?apiKey=YOUR_API_KEY&model=MODEL_NAME
```

### MCP 工具列表

#### `search` - AI 联网搜索

使用 Kimi AI 进行联网搜索并返回智能摘要结果。

**参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `query` | string | 是 | 搜索内容 |

**示例请求:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "今天北京天气"
    }
  }
}
```

**示例响应:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "搜索结果..."
      }
    ]
  }
}
```

## 项目结构

```
kimi-search-mcp/
├── src/
│   ├── index.ts      # 入口文件
│   ├── server.ts     # MCP 服务器实现
│   └── tool.ts       # 工具定义与处理
├── dist/             # 编译输出目录
├── Dockerfile        # Docker 构建文件
├── package.json      # 项目配置
└── tsconfig.json     # TypeScript 配置
```

## 在 Claude Desktop 中使用

在 Claude Desktop 配置文件中添加:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kimi-search": {
      "url": "http://localhost:3000/mcp?apiKey=YOUR_API_KEY"
    }
  }
}
```

## 技术栈

- [Bun](https://bun.sh) - 高性能 JavaScript 运行时
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [@xsai/generate-text](https://github.com/nicholasxuu/xsai) - AI 文本生成
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol

## 许可证

[MIT License](LICENSE)

---

<p align="center">
  Made with ❤️ using <a href="https://bun.sh">Bun</a>
</p>
