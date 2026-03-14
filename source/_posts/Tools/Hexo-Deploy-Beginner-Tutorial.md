---
title: Hexo Deploy Beginner-Tutorial
date: 2026-02-01 10:00:00
categories:
  - Tools
tags:
  - hexo
  - deploy
  - beginner
---

A quick guide to get your Hexo blog deployed from scratch.

<!-- more -->

## Prerequisites

- Node.js (v12+)
- Git installed and configured
- A GitHub account

## Step 1: Install Hexo

```bash
npm install -g hexo-cli
```

## Step 2: Create a New Blog

```bash
hexo init my-blog
cd my-blog
npm install
```

## Step 3: Preview Locally

```bash
hexo server
```

Visit `http://localhost:4000` in your browser.

## Step 4: Create a New Post

```bash
hexo new "My First Post"
```

Edit the generated file in `source/_posts/My-First-Post.md`.

### Organising Posts by Category

The proper way to create a post and place it in the correct category folder at the same time is to include the folder name in the title:

```bash
hexo new post "FolderName/post-title"
```

**Examples:**
```bash
hexo new post "Hexo/my-new-hexo-post"
hexo new post "Machine_learning/04-new-paper"
hexo new post "Music/Music-Scales"
```

This creates the file directly inside the matching subfolder:
```
source/_posts/Hexo/my-new-hexo-post.md
source/_posts/Machine_learning/04-new-paper.md
source/_posts/Music/Music-Scales.md
```

> **Important:** Hexo does NOT automatically set the category from the folder name. You must also add `categories` in the frontmatter to match the folder:
>
> ```yaml
> ---
> title: My Post
> date: 2026-01-01
> categories:
>   - FolderName
> tags:
> ---
> ```

### Using the `hexo-new-post` Claude Skill

To automate the above and avoid forgetting to set the category, use the `/hexo-new-post` skill in Claude Code. It will:

1. Run `hexo new post "Category/post-title"` to create the file in the right folder
2. Automatically add the matching `categories` frontmatter so folder and category are always in sync
3. Confirm the file path back to you

**How to invoke it:**

Just tell Claude Code to create a new post naturally:
```
create a new post about Music Scales under Music
new blog post: Tools/my-new-tool
```

Or invoke the skill directly:
```
/hexo-new-post
```

**Rules the skill enforces:**
- The `categories` frontmatter always matches the folder name exactly (case-sensitive)
- Never leaves `categories:` empty when a folder is used
- Always uses `hexo new post "Folder/title"` — never creates `.md` files manually

## Step 5: Generate Static Files

```bash
hexo generate
```

This creates the `public/` folder with your static site.

## Step 6: Configure Deployment

Edit `_config.yml` and add your deploy settings:

```yaml
deploy:
  type: git
  repo: git@github.com:username/username.github.io.git
  branch: main
```

Install the Git deployer plugin:

```bash
npm install hexo-deployer-git --save
```

## Step 7: Deploy

```bash
hexo clean && hexo deploy
```

Your site is now live at `https://username.github.io/`.

## Useful Commands

| Command | Description |
|---------|-------------|
| `hexo new "title"` | Create a new post |
| `hexo server` | Start local server |
| `hexo generate` | Generate static files |
| `hexo deploy` | Deploy to remote |
| `hexo clean` | Clear cache and public folder |

## Tips

- Always run `hexo clean` before `hexo generate` if you changed themes or config.
- Use `hexo server --draft` to preview draft posts locally.
- Add `<!-- more -->` in your post to control where the excerpt cuts off on the homepage.
