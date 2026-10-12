FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.js && npx tsx src/server.js"]