# Firebase emulators (Auth, Firestore, Functions, Storage + UI) with the Cloud
# Functions built in. The same image runs the seed script. Build context: repo root.

# firebase-tools requires Java 21+ (Debian trixie ships it).
FROM node:22-trixie-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
  && rm -rf /var/lib/apt/lists/*

# Everything below runs as the unprivileged `node` user (the emulator binaries
# are cached in its home directory, so they must be downloaded as that user too).
WORKDIR /app
RUN chown node:node /app
USER node

# Root tooling: firebase-tools, firebase-admin, tsx (seed).
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
# Download the emulator binaries at build time instead of on every start.
RUN npx firebase setup:emulators:firestore \
  && npx firebase setup:emulators:storage \
  && npx firebase setup:emulators:ui

COPY --chown=node:node functions/package.json functions/package-lock.json ./functions/
RUN npm --prefix functions ci
COPY --chown=node:node functions ./functions
RUN npm --prefix functions run build

COPY --chown=node:node firebase.json firestore.rules firestore.indexes.json storage.rules ./
COPY --chown=node:node scripts ./scripts

# Inside a container the emulators must listen on 0.0.0.0 to be reachable
# through the published ports (compose publishes them on 127.0.0.1 only).
# The repo's firebase.json stays on localhost.
RUN node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('firebase.json'));\
for (const k of ['auth','firestore','functions','storage','ui']) c.emulators[k].host='0.0.0.0';\
c.emulators.hub={host:'0.0.0.0',port:4400};c.emulators.logging={host:'0.0.0.0',port:4500};\
fs.writeFileSync('firebase.json',JSON.stringify(c,null,2));"

EXPOSE 4000 4400 4500 9150 9099 8080 5001 9199
CMD ["npx", "firebase", "emulators:start", "--project", "demo-runcty"]
