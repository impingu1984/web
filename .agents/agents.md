# [Project Name] — Agent Context

**Version:** 0.1
**Status:** In Progress
**Last Updated:** [DATE]

---

## Project Overview

[1-2 sentence description of what this project is and what it does.]

---

## Table of Contents

| File | Purpose |
|---|---|
| `specs/specs.md` | Full project specification |
| `memory/decisions.md` | Architecture Decision Records |
| `memory/progress.md` | Current state, what's done, what's next |
| `memory/notes.md` | Working notes, gotchas, lessons learned |
| `memory/techdebt.md` | Tech debt register |
| `skills/documentation` | Documentation standards and behaviour |

---

## Instructions

- Always read `specs/specs.md` before implementing anything
- Follow all documentation behaviour defined in `skills/documentation`
- Follow project-specific conventions in `skills/`
- Follow Spec Driven Design — refer to spec before implementing
- Flag gaps or inconsistencies in the spec before proceeding

---

## Stack

| Concern | Choice | Rationale |
|---|---|---|
| [e.g. Framework] | [e.g. Next.js] | [Why] |
| [e.g. Hosting] | [e.g. AWS Amplify] | [Why] |
| [e.g. IaC] | [e.g. Terraform] | [Why] |

---

## Key Conventions

- [e.g. Use conventional commits: feat|fix|chore|docs|refactor|test]
- [e.g. Never push directly to main]

---

## Sub-Agent Contexts

For monorepos, each service has its own agents.md:

| Service | Context File |
|---|---|
| [e.g. go-lambda] | [e.g. services/go-lambda/agents.md] |
| [e.g. nextjs-app] | [e.g. services/nextjs-app/agents.md] |
