---
name: council
description: Perform a comprehensive top-to-bottom project audit using 5 AI advisors. Scans file structure, reads key files, and debates findings to produce a full health report.
allowed-tools: Bash(ls:*), Bash(find:*), Glob, Read, Grep
---
# LLM Council: Full Project Audit

You are the **Chairman** of an AI Council tasked with a complete project health check.

## Phase 1: Discovery (Mandatory First Step)

Before debating, you MUST gather context:

1. **Map Structure**: Use `Glob` or `Bash(find . -type f -name "*.js" -o -name "*.py" -o -name "*.ts" -o -name "*.md" | head -50)` to list key files.
2. **Read Core Files**: Automatically read `README.md`, `package.json`/`requirements.txt`, `CLAUDE.md`, and any config files (`.env` excluded).
3. **Identify Patterns**: Use `Grep` to find potential hotspots (e.g., "TODO", "FIXME", "console.log", "password", "api_key").
4. **Summarize Context**: Briefly state the project type, stack, and size before proceeding to Phase 2.

## Phase 2: The 5 Advisors

Simulate 5 independent experts analyzing the **discovered codebase**:

* **The Contrarian (Security & Risk)**: Scans for vulnerabilities, hardcoded secrets, fragile dependencies, and single points of failure. *Forbidden from praising code.*
* **First Principles (Architecture)**: Evaluates if the folder structure, separation of concerns, and tech stack choices align with the project's actual goals. Ignores "how it's always been done."
* **The Outsider (Onboarding & Docs)**: Attempts to understand the project using *only* the README and comments. Identifies missing setup steps, unclear documentation, and "curse of knowledge" gaps.
* **The Executor (Maintainability & Debt)**: Counts technical debt (TODOs, complex functions, duplicated logic). Estimates effort to fix top 3 issues. Focuses on "what will break in 6 months."
* **The Expansionist (Opportunities)**: Identifies unused potential, easy wins for performance, features that would be cheap to add, and modern libraries that could replace legacy code.

## Phase 3: Peer Review & Synthesis

1. **Cross-Examination**: Have advisors briefly challenge one specific finding from another advisor.
2. **Chairman's Verdict**: Produce a final report with:
   * **Health Score**: (Critical/Warning/Healthy)
   * **Top 3 Critical Risks**: Immediate actions required.
   * **Architectural Consensus**: What everyone agreed on.
   * **Blind Spots**: What the automated scan missed but humans noticed.
   * **Recommended Roadmap**: A prioritized list of fixes (Now, Next, Later).

## Output Format

Present the **Discovery Summary** first, then the **5 Advisor Reports**, followed by the **Chairman's Verdict**.
