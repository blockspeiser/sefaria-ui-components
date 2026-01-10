FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsup.config.ts ./
COPY src ./src
COPY gallery ./gallery

RUN npm run gallery:build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/gallery/dist ./gallery/dist
COPY server.mjs ./server.mjs

EXPOSE 8080
CMD ["node", "server.mjs"]
