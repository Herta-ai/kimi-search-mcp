FROM docker.1ms.run/oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --registry https://registry.npmmirror.com

COPY . .
RUN bun build --bytecode --minify \
  --target=bun \
  --compile \
  ./src/index.ts --outfile=./dist/server

FROM docker.1ms.run/oven/bun:1-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist/server /app/server
CMD ["./server"]