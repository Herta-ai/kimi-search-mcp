import { startServer } from "./server";

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  let port = 3000;
  let host = "0.0.0.0";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-p" || arg === "--port") {
      const value = args[++i];
      if (value) {
        port = parseInt(value, 10);
        if (isNaN(port)) {
          console.error(`Invalid port: ${value}`);
          process.exit(1);
        }
      }
    } else if (arg === "--host") {
      const value = args[++i];
      if (value) {
        host = value;
      }
    }
  }

  return { port, host };
}

const { port, host } = parseArgs();
const server = startServer(host, port);

console.log(`🚀 MCP Server running at http://${host}:${server.port}`);
console.log(`🔑 Entry point: GET http://localhost:${server.port}/mcp?apiKey=test123`);
