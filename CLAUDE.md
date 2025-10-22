# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian vault containing:
- Personal notes and daily work logs
- A Claude Code multi-agent communication demo project (`Claude-Code-Communication/`)
- Development projects

**Kindle/Literature Notes:** Moved to separate vault `../Obsidian-Kindle/` for better sync performance

## Key Projects

### Claude-Code-Communication Demo
Located in `Claude-Code-Communication/`, this is a tmux-based multi-agent system demonstration where Claude agents communicate hierarchically:

**Architecture:**
- **PRESIDENT** (separate session): Project overseer
- **boss1** (multiagent session): Team leader  
- **worker1,2,3** (multiagent session): Task executors

**Communication Flow:**
PRESIDENT → boss1 → workers → boss1 → PRESIDENT

**Setup Commands:**
```bash
cd Claude-Code-Communication
./setup.sh                    # Initialize tmux environment
tmux attach-session -t multiagent
tmux attach-session -t president
```

**Agent Communication:**
```bash
./agent-send.sh [agent_name] "[message]"
./agent-send.sh --list        # Show available agents
```

**Role Instructions:**
- PRESIDENT: Follow `instructions/president.md`
- boss1: Follow `instructions/boss.md`
- workers: Follow `instructions/worker.md`

## File Structure

- `daily/` - Daily notes and work logs
- `work/` - Work-related projects and analyses
- `Claude-Code-Communication/` - Multi-agent demo system
- `develop/` - Development projects

**Note:** Kindle highlights and literature notes have been moved to a separate vault at `../Obsidian-Kindle/` to improve sync performance.

## Working with this Repository

This is primarily a knowledge management vault with one technical demo project. When working with the Claude-Code-Communication system, ensure tmux sessions are properly configured and follow the hierarchical communication patterns defined in the instruction files.

## Obsidian Tagging Notes

- When using tags in Obsidian, use `#TGS` instead of `#TGSタスク`
- Avoid redundant or unnecessary tags across the vault
- TGSタグもつけておいてください

## Task Management Commands

### `タスク整理`
When the user says **「タスク整理」**, perform the following operation on `tasks.md`:

1. Find all completed tasks (`- [x]`) in the upper section (before `---`)
2. Move them to the `## 完了済み` section at the bottom
3. Organize by tag subsections (e.g., `### #LOLCN`, `### #RGO`, etc.)
4. Keep only incomplete tasks (`- [ ]`) in the upper section

**Example:**
```markdown
# タスク管理

## #LOLCN
- [ ] Incomplete task 1
- [ ] Incomplete task 2

---

## 完了済み

### #LOLCN
- [x] Completed task 1 ✅ 2025-10-21
- [x] Completed task 2 ✅ 2025-10-20
```

### `タスク起動`
When the user says **「タスク起動」**, start the Slack-Obsidian task sync bot:

```bash
cd "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync" && "C:\Users\80036\AppData\Local\Programs\Python\Python313\python.exe" slack_task_bot.py --realtime
```

Run this command in the background using `run_in_background: true`. The bot will:
- Monitor Slack channel C09M891TXAR for ✅ reactions
- Automatically add tasks to tasks.md organized by tags
- Sort tasks by due date within each tag section
- Add weekday information to dates (e.g., 📅10/21(火))