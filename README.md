# sotf-mods.com API

## Setup
First create a .env (you can clone .env.example) and fill the variables
```env
PORT=
BASE_URL=
DATABASE_URL=
JWT_SECRET=
KELVINGPT_API=
KELVINGPT_API_AUTHORITY=
FILE_UPLOAD_ENDPOINT=
FILE_DOWNLOAD_ENDPOINT=
FILE_PREVIEW_ENDPOINT=
```

To setup the project run:

```bash
bun install
bunx prisma generate
```

## Getting Started
To run the project run the following commands

```bash
bun run src/index.ts
```

## Development
To start the development server run:
```bash
bun run dev
```

## Caveats
If you are running on linux and issue an error with sharp you might solve it by running:
```bash
cd node_modules/sharp
bun install
```

Open http://localhost:3000/ with your browser to see the result.