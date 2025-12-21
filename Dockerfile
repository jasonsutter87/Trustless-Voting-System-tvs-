# TVS API Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/veilsign/package.json ./packages/veilsign/
COPY packages/veilchain/package.json ./packages/veilchain/
COPY packages/veilproof/package.json ./packages/veilproof/
COPY packages/tvs-api/package.json ./packages/tvs-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY packages ./packages

# Build
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built artifacts
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/veilsign/package.json ./packages/veilsign/
COPY --from=builder /app/packages/veilsign/dist ./packages/veilsign/dist
COPY --from=builder /app/packages/veilchain/package.json ./packages/veilchain/
COPY --from=builder /app/packages/veilchain/dist ./packages/veilchain/dist
COPY --from=builder /app/packages/veilproof/package.json ./packages/veilproof/
COPY --from=builder /app/packages/veilproof/dist ./packages/veilproof/dist
COPY --from=builder /app/packages/tvs-api/package.json ./packages/tvs-api/
COPY --from=builder /app/packages/tvs-api/dist ./packages/tvs-api/dist

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy static apps
COPY apps ./apps

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "packages/tvs-api/dist/server.js"]
