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

# Slug del salón (dedicado a Blue Moon). Debe coincidir con el slug en la BD.
ARG VITE_SALON_SLUG
ENV VITE_SALON_SLUG=$VITE_SALON_SLUG

# Meta Pixel. Si no se pasa, el build queda sin tracking (dev/staging).
ARG VITE_META_PIXEL_ID
ENV VITE_META_PIXEL_ID=$VITE_META_PIXEL_ID

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
