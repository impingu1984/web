---
name: documentation
description: Creating, updating and using files in ./.agents/memory or ./.agents/specs for project documentation
---

## Instructions

- Use the templates for each file structure
- specs.md is a specification file for the project to read and also update as required.
- decisions.md is a Architecture Decision Record.
- progress.md is a progress log.
- notes.md is for entries Working notes, gotchas, lessons learned, and useful references or scratch.
- techdebt.md is a tech debt register.

## Behaviour

- Always read the relevant file before updating it
- Append new entries — never overwrite existing content
- Use the template structure for all new entries
- Update progress.md and notes.md at the end of every session without being asked
- Never leave a session without updating progress.md
- When debt is identified during implementation, create a techdebt.md entry immediately
- When an architectural decision is made, create a decisions.md entry before continuing

## Templates
- Use ./.agents/skills/documentation/assets/spec.md for new specifications
- Use ./.agents/skills/documentation/assets/decisions.md for new ADR entries
- Use ./.agents/skills/documentation/assets/progress.md for progress structure
- Use ./.agents/skills/documentation/assets/notes.md for notes entries
- Use ./.agents/skills/documentation/assets/techdebt.md for tech debt entries