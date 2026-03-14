---
title: Claude Code — Plugins, Marketplace, Agents, Skills & Commands
date: 2026-03-14 15:28:08
categories:
  - Tools
tags:
  - claude-code
  - ai
  - developer-tools
---

Claude Code is Anthropic's official CLI for interacting with Claude. It has four key concepts that extend what it can do: **commands**, **skills**, **agents**, and **plugins**.

<!-- more -->

## The Simple Difference

Think of it like a restaurant:

| Concept | Restaurant Analogy | What it does |
|---------|-------------------|--------------|
| **Command** | Light switch | Instant action, no AI involved |
| **Skill** | Recipe card | A saved set of instructions Claude follows |
| **Agent** | A specialist chef | Claude spawns a helper to handle one focused job |
| **Plugin** | A supply box | A package that brings in new skills, agents, or commands |

---

## Commands

**Commands are instant actions** — they run immediately without involving Claude's AI at all.

You type `/something` and it just happens right away.

```bash
/clear          # wipes the conversation
/help           # shows help
/agents         # opens the agents list
/skills         # opens the skills list
/plugin list    # lists installed plugins
/fast           # toggles fast mode
```

Think of them like keyboard shortcuts — quick, direct, no thinking involved.

---

## Skills

**Skills are saved instructions** that Claude reads and follows when you invoke them.

Instead of typing a long, detailed request every time, you save it as a skill and call it with a short name.

```bash
/commit              # Claude follows the "how to write a good commit" instructions
/simplify            # Claude follows the "review and simplify code" instructions
/hexo-new-post       # Claude follows the "create a Hexo post properly" instructions
```

Skills are just markdown files stored in `~/.claude/skills/`. You can write your own.

> **Command vs Skill:** `/clear` is a command (instant, no AI). `/commit` is a skill (Claude reads instructions and acts on them).

---

## Agents

**Agents are specialist helpers** that Claude spins up to handle one focused task, then reports back.

When a task is too complex or involves too many steps, instead of doing everything itself, Claude can delegate to an agent that has the right tools for that specific job.

```
You ask Claude to review your code
  → Claude launches a "code-reviewer" agent
  → Agent reads the code and analyses it
  → Agent reports findings back to Claude
  → Claude summarises for you
```

Built-in agents:

| Agent | What it specialises in |
|-------|----------------------|
| `Explore` | Searching through codebases quickly |
| `Plan` | Designing step-by-step implementation plans |
| `claude-code-guide` | Answering questions about Claude Code itself |

Agents can also run in **parallel** — Claude can launch several at once for independent tasks.

> **Skill vs Agent:** A skill tells Claude *how* to do something. An agent is a separate Claude instance that *does* the task on its own.

---

## Plugins

**Plugins are packages** that add new skills, agents, or commands to Claude Code all at once.

Instead of setting things up one by one, a plugin bundles everything together and installs it in one go.

```bash
/plugin marketplace add anthropics/skills   # install a plugin
/plugin list                                # see what's installed
/reload-plugins                             # apply after installing
```

Plugins are installed to `~/.claude/plugins/`. A single plugin can add multiple skills and agents at once.

---

## How They All Fit Together

```
You
 │
 ├─ type /clear          → Command  (instant, no AI)
 ├─ type /commit         → Skill    (Claude reads instructions and acts)
 ├─ ask a complex task   → Agent    (Claude delegates to a specialist helper)
 └─ type /plugin install → Plugin   (adds new skills/agents/commands)
```

---

## File Locations

| Path | What lives there |
|------|-----------------|
| `~/.claude/skills/` | Your custom skills |
| `~/.claude/agents/` | Your custom agents |
| `~/.claude/plugins/` | Installed plugins |
| `~/.claude/settings.json` | Global settings |
| `~/.claude/keybindings.json` | Custom keyboard shortcuts |
