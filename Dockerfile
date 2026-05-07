# syntax=docker/dockerfile:1.7

# Multi-target Dockerfile for:
# - `frontend`: build Vite -> serve via Nginx
# - `voice`: Express sidecar (server/index.mjs) + TTS/WebPush/WhatsApp routes
# - `tts`: Express sidecar (server/ttsServer.mjs)

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
# Vite needs VITE_* variables at build time for client-side integrations.
# Provide these via docker-compose `build.args` (or build-args manually).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_YOUVERIFY_BASE_URL
ARG VITE_APPRUVE_BASE_URL
ARG VITE_FLUTTERWAVE_PUBLIC_KEY
ARG VITE_FLUTTERWAVE_BASE_URL
ARG VITE_MAPTILER_API_KEY
ARG VITE_VOICE_SERVER_URL
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_ENABLE_SUPPORT_CHAT
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_ENABLE_RUNTIME_CSP
ARG VITE_CSP_ALLOW_UNSAFE_EVAL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_YOUVERIFY_BASE_URL=$VITE_YOUVERIFY_BASE_URL
ENV VITE_APPRUVE_BASE_URL=$VITE_APPRUVE_BASE_URL
ENV VITE_FLUTTERWAVE_PUBLIC_KEY=$VITE_FLUTTERWAVE_PUBLIC_KEY
ENV VITE_FLUTTERWAVE_BASE_URL=$VITE_FLUTTERWAVE_BASE_URL
ENV VITE_MAPTILER_API_KEY=$VITE_MAPTILER_API_KEY
ENV VITE_VOICE_SERVER_URL=$VITE_VOICE_SERVER_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
ENV VITE_ENABLE_SUPPORT_CHAT=$VITE_ENABLE_SUPPORT_CHAT
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ENABLE_RUNTIME_CSP=$VITE_ENABLE_RUNTIME_CSP
ENV VITE_CSP_ALLOW_UNSAFE_EVAL=$VITE_CSP_ALLOW_UNSAFE_EVAL

COPY . .
RUN npm run build

FROM nginx:alpine AS frontend
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80

FROM node:${NODE_VERSION}-alpine AS voice-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM voice-deps AS voice
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 4000
RUN mkdir -p server/uploads
COPY server ./server
CMD ["node", "server/index.mjs"]

FROM voice-deps AS tts
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 4010
COPY server ./server
CMD ["node", "server/ttsServer.mjs"]

