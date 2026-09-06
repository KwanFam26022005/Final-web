# Stage 1: Build static React SPA
FROM node:24-alpine AS builder

WORKDIR /app

# Accept API base URL and Reverb WebSocket build arguments
ARG VITE_API_BASE_URL=http://127.0.0.1:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_REVERB_APP_KEY=reverb_key_local
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST=127.0.0.1
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ARG VITE_REVERB_PORT=8080
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME=http
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve static bundle via lightweight Nginx web server
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=5s --timeout=5s --start-period=5s --retries=5 \
    CMD wget -qO- http://127.0.0.1:5173/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
