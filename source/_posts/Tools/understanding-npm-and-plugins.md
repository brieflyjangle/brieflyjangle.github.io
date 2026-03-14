---
title: Understanding npm and How npm Plugins Work
date: 2026-03-14 19:50:41
categories:
  - Tools
tags:
  - npm
  - nodejs
  - package-manager
---

**npm** (Node Package Manager) is the default package manager for Node.js. It lets you install, share, and manage reusable code packages (called plugins or libraries) in your projects.

<!-- more -->

## What is npm?

When you build a project with Node.js, you rarely write everything from scratch. Other developers have already solved common problems and published their solutions as **packages**. npm is the tool that lets you find, install, and use those packages.

Every Node.js project has a `package.json` file that tracks:
- The project's name and version
- The packages it depends on
- Scripts for common tasks (build, test, start, etc.)

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "markdown-it": "^13.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

---

## Key npm Commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install all packages listed in `package.json` |
| `npm install <package>` | Install a specific package and add it to `dependencies` |
| `npm install <package> --save-dev` | Install and add to `devDependencies` |
| `npm uninstall <package>` | Remove a package |
| `npm update` | Update all packages to their latest allowed versions |
| `npm run <script>` | Run a script defined in `package.json` |

---

## dependencies vs devDependencies

| Type | Purpose | Example |
|------|---------|---------|
| `dependencies` | Needed to **run** the project | `markdown-it`, `hexo` |
| `devDependencies` | Only needed during **development** | `jest`, `eslint` |

---

## What is an npm Plugin?

A **plugin** is just an npm package designed to extend the functionality of another tool or framework. Plugins follow a convention — they expose a function or object that the host tool knows how to use.

### How a Plugin Works (Step by Step)

1. **You install it** via npm:
   ```bash
   npm install markdown-it-mark --save
   ```

2. **npm downloads it** into `node_modules/` and records it in `package.json`

3. **The host tool loads it** — usually by `require()`-ing the package name:
   ```js
   const mark = require('markdown-it-mark');
   md.use(mark);
   ```

4. **The plugin registers itself** — it adds new rules, hooks, or behaviour into the host tool

5. **You use the new feature** — e.g. `==highlighted text==` now works in markdown

---

## node_modules Folder

When you run `npm install`, all packages are downloaded into a `node_modules/` folder. This folder can be very large and should always be added to `.gitignore` — anyone who clones your project can recreate it by running `npm install`.

```
my-project/
├── node_modules/       ← never commit this
├── package.json        ← commit this
├── package-lock.json   ← commit this (locks exact versions)
└── src/
```

---

## package-lock.json

The `package-lock.json` file locks the **exact version** of every installed package. This ensures that everyone working on the project gets the exact same versions, preventing "works on my machine" bugs.

---

## npm in Hexo

Hexo relies heavily on npm plugins for nearly everything:

| Plugin | What it adds |
|--------|-------------|
| `hexo-renderer-markdown-it` | Renders Markdown using markdown-it |
| `hexo-deployer-git` | Deploys your site to GitHub Pages |
| `hexo-generator-category` | Generates category pages |
| `markdown-it-mark` | Adds `==highlight==` syntax |
| `hexo-prism-plugin` | Adds code syntax highlighting |

Installing a Hexo plugin is always the same pattern:
```bash
npm install hexo-plugin-name --save
```

Then configure it in `_config.yml` if needed, and run `hexo generate`.
