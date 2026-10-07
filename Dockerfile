# Imagen de desarrollo: Vite + Prisma CLI
FROM node:22-bookworm-slim

# OpenSSL lo usa el motor de Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173

ENTRYPOINT ["sh", "docker/entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
