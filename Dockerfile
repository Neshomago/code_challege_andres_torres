# ---- Stage 1: build the frontend ----
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# ---- Stage 2: backend base — install deps once, shared below ----
FROM node:22-alpine AS backend-base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src

# ---- Stage 3: run the endpoint tests — build fails here if they fail ----
FROM backend-base AS backend-test
COPY test ./test
RUN npm test

# ---- Stage 4: final image, built on top of the tested stage ----
FROM backend-test AS final
RUN npm prune --omit=dev && rm -rf ./db
COPY --from=frontend-build /app/frontend/dist ./public

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]