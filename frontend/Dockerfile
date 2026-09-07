FROM node:20-slim AS builder

# pnpm pineado: sin versión, npm instala la última y un cambio de major
# rompe el build sin que cambie el código (pnpm 12 convirtió el warning de
# "ignored build scripts" en error). Debe coincidir con el lockfile v9.
RUN npm install -g pnpm@10.33.0

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
