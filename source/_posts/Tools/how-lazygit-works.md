---
title: How Lazygit Works
date: 2026-03-14 19:54:55
categories:
  - Tools
tags:
  - git
  - lazygit
  - terminal
  - developer-tools
---

**Lazygit** is a terminal UI for Git that lets you manage your repository visually without leaving the command line — no need to memorise complex git commands.

<!-- more -->

## What is Lazygit?

Lazygit wraps standard git commands behind a keyboard-driven interface. Instead of typing `git add`, `git commit`, `git push`, etc., you navigate panels with arrow keys and single keypresses.

It runs entirely in the terminal, making it fast and available everywhere git is.

```bash
# Install on macOS
brew install lazygit

# Open in your repo
lazygit
```

---

## The Interface

When you open lazygit, the screen is split into **5 panels**:

```
┌─────────────────┬──────────────────────────────────┐
│   Status        │                                  │
├─────────────────│           Diff / Preview          │
│   Files         │                                  │
├─────────────────│                                  │
│   Branches      │                                  │
├─────────────────┤                                  │
│   Commits       │                                  │
├─────────────────┤                                  │
│   Stash         │                                  │
└─────────────────┴──────────────────────────────────┘
```

| Panel | What it shows |
|-------|--------------|
| **Status** | Current branch and repo state |
| **Files** | Unstaged and staged changes |
| **Branches** | Local and remote branches |
| **Commits** | Full commit history |
| **Stash** | Stashed changes |

Navigate between panels with the **arrow keys** or **Tab**. The right side always shows a **diff/preview** of whatever is selected.

---

## Core Workflow

### 1. Stage Files

In the **Files** panel, press:
- `Space` — stage or unstage a single file
- `a` — stage or unstage **all** files

Staged files move to the top of the list (shown in green).

### 2. Commit

Press `c` to commit. A prompt appears for your commit message. Type it and press Enter.

For a more detailed commit with a body, press `C` (capital) to open your editor.

### 3. Push & Pull

| Key | Action |
|-----|--------|
| `P` | Push to remote |
| `p` | Pull from remote |
| `f` | Fetch |

### 4. Branches

Switch to the **Branches** panel and:
- `Space` — checkout a branch
- `n` — create a new branch
- `d` — delete a branch
- `r` — rebase current branch onto selected

### 5. View & Navigate Commits

Switch to the **Commits** panel to see history:
- `Space` — checkout a commit
- `s` — squash commit into the one below
- `r` — rename a commit message
- `d` — drop (delete) a commit
- `p` — pick (reorder during rebase)

---

## Useful Shortcuts

| Key | Action |
|-----|--------|
| `?` | Show help / all keybindings |
| `q` | Quit lazygit |
| `[` / `]` | Switch between panels |
| `e` | Edit file in your editor |
| `o` | Open file |
| `/` | Search / filter |
| `z` | Undo last action |
| `ctrl+z` | Redo |
| `ctrl+r` | Switch recent repos |

---

## How it Works Under the Hood

Lazygit doesn't replace git — it **calls git commands** on your behalf. Every action you take in the UI translates to one or more standard git commands running in the background.

For example:
- Pressing `Space` on a file → `git add <file>` or `git restore --staged <file>`
- Pressing `c` → `git commit`
- Pressing `P` → `git push`

This means lazygit is safe to use alongside the regular `git` CLI — they both operate on the same repository state.

---

## Why Use Lazygit?

| Without Lazygit | With Lazygit |
|----------------|-------------|
| `git status` + `git add` + `git diff` | One screen shows everything |
| `git log --oneline --graph` | Visual commit tree in Commits panel |
| `git stash`, `git stash pop` | Stash panel with single keypresses |
| Interactive rebase via `git rebase -i` | Edit commits directly in Commits panel |
| Memorise many commands | Just press `?` to see all options |
