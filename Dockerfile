# syntax=docker/dockerfile:1
FROM node:18-alpine AS base

FROM base AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

FROM base AS server

ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
ENV PORT=3000

WORKDIR /app

RUN addgroup -g 1001 -S admin
RUN adduser -S stl -u 1001

RUN chown -R stl:admin /app

# You only need to copy next.config.js if you are NOT using the default configuration
# COPY --from=builder /app/next.config.js ./
COPY --from=deps --chown=stl:admin /app/node_modules ./node_modules
#COPY --from=build --chown=stl:admin /app/package.json ./package.json
COPY --from=build --chown=stl:admin /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=stl:admin /app/.next/standalone ./
COPY --from=build --chown=stl:admin /app/.next/static ./.next/static

USER stl

ENTRYPOINT ["node"]

CMD ["server"]

EXPOSE 3000
