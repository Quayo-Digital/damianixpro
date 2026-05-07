# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM deps AS runtime
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 4101
COPY . .
CMD ["node", "server.js"]

