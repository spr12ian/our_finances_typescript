# our_finances_typescript

This repository attempts to use [clasp](https://github.com/google/clasp) to allow
GAS development using TypeScript.

Some of my process was influenced by sqrrrl's
[apps-script-typescript-rollup-starter](https://github.com/sqrrrl/apps-script-typescript-rollup-starter).

## One-time project setup

Ensure environment variable $OUR_FINANCES_SCRIPT_ID is set

`make setup`

Adjust tsconfig.json as needed for GAS e.g.

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "none",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "types": ["google-apps-script"],
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
```

Ensure node npm package scripts are consistent with the Makefile.

```json
{
  "name": "our_finances_typescript",
  "version": "1.0.0",
  "description": "GAS repository",
  "main": "Code.js",
  "scripts": {
    "clean": "rm -rf dist build",
    "build": "tsup src/index.ts --format iife --out-dir dist --target es2015 --no-treeshake",
    "prepare-gas": "rsync -a dist/ build/ && cp appsscript.json build/",
    "gas": "clasp push"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/spr12ian/our_finances_typescript.git"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/spr12ian/our_finances_typescript/issues"
  },
  "homepage": "https://github.com/spr12ian/our_finances_typescript#readme",
  "devDependencies": {
    "@types/google-apps-script": "^1.0.99",
    "esbuild": "^0.25.6",
    "tsup": "^8.5.0",
    "typescript": "^5.8.3"
  }
}
```

## Daily workflow

Make changes as required then

`make gas`
