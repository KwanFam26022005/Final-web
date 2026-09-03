# Stage 1: Build static React SPA
FROM node:24-alpine AS builder

WORKDIR /app

# Accept API base URL build argument
ARG VITE_API_BASE_URL=http://127.0.0.1:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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
