FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3030
# Aplica as migrações pendentes antes de subir.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
