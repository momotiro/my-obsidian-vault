# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian vault containing:
- Personal notes and literature collection
- A Claude Code multi-agent communication demo project (`Claude-Code-Communication/`)
- Daily notes and work-related content

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
- `LiteratureNote/` - Book notes and research clippings
- `Claude-Code-Communication/` - Multi-agent demo system
- `develop/` - Development projects

## Working with this Repository

This is primarily a knowledge management vault with one technical demo project. When working with the Claude-Code-Communication system, ensure tmux sessions are properly configured and follow the hierarchical communication patterns defined in the instruction files.