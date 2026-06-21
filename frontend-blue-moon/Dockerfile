FROM node:20-slim AS builder

RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Slug del salón (dedicado a Blue Moon). Debe coincidir con el slug en la BD.
ARG VITE_SALON_SLUG
ENV VITE_SALON_SLUG=$VITE_SALON_SLUG

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
