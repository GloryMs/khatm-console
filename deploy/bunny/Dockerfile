# Staging image for bunny Magic Containers. Build from the repo root:
#   docker build -f deploy/bunny/Dockerfile --build-arg VITE_QR_API_BASE=https://<api-host> -t <tag> .
# Keep the build-stage image aligned with the repo's own Dockerfile.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_QR_API_BASE
RUN test -n "$VITE_QR_API_BASE" || (echo "VITE_QR_API_BASE build-arg is required" >&2; exit 1)
ENV VITE_QR_API_BASE=$VITE_QR_API_BASE
RUN npm run build

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/bunny/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Old Value: ENV NGINX_RESOLVER=1.1.1.1
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
EXPOSE 8080