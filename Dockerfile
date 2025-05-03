
# ┌────────────────────────────────────────────┐
# │ 1) BUILD FRONT‑END ASSETS WITH VITE/INKSCAPE
# └────────────────────────────────────────────┘
FROM node:18-bullseye AS builder
WORKDIR /app

# 1.1 Copy only manifest files (cache npm install)
COPY package.json package-lock.json bun.lockb components.json ./

# 1.2 Install front‑end deps
RUN npm ci

# 1.3 Copy front‑end source, configs, static public folder
COPY src/       src/
COPY public/    public/
COPY index.html postcss.config.js tailwind.config.ts vite.config.ts tsconfig.app.json ./

# 1.4 Copy Supabase configuration
COPY supabase/  supabase/

# 1.5 Build: runs your npm script which should invoke Inkscape and then Vite
RUN npm run build



# ┌────────────────────────────────────────────┐
# │ 2) ASSEMBLE RUNTIME: NODE + INKSCAPE + SERVER
# └────────────────────────────────────────────┘
FROM node:18-bullseye
WORKDIR /app

# 2.1 Install Inkscape CLI for runtime processing
RUN apt-get update \
 && apt-get install -y --no-install-recommends inkscape \
 && rm -rf /var/lib/apt/lists/*

# 2.2 Copy & install only server dependencies (production only)
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --production

# 2.3 Copy server source code
COPY server/ server/

# 2.4 Copy Supabase edge functions if they exist
COPY supabase/functions/ /app/supabase/functions/ 2>/dev/null || :

# 2.5 Inject built front‑end into server's public folder
COPY --from=builder /app/dist server/public

# 2.6 Expose your app's port and set start command
EXPOSE 3000
CMD ["node", "server/server.js"]
