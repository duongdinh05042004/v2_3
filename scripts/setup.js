/**
 * First-run setup after clone/pull — creates .env from .env.example if missing.
 * Cross-platform (Windows / macOS / Linux). Does not install Docker for you.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

function main() {
  if (!fs.existsSync(examplePath)) {
    // eslint-disable-next-line no-console
    console.error('Missing .env.example');
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    // eslint-disable-next-line no-console
    console.log('Created .env from .env.example');
  } else {
    // eslint-disable-next-line no-console
    console.log('.env already exists — left unchanged');
  }

  // eslint-disable-next-line no-console
  console.log(`
Next steps (pick one):

A) Docker only (recommended — works on any machine with Docker):
   docker compose up --build
   docker compose exec api npm run seed

B) Local Node + Docker infra (Postgres/Redis in Docker):
   npm install
   npm run infra:up
   npm run migration:run
   npm run seed
   npm run start:dev
   npm run mock:bitrix
   npm run mock:tiktok
`);
}

main();
