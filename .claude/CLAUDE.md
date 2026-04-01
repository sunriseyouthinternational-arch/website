# Agent Delegation Policy
- **Prefer Subagents:** Always prefer spawning a specialized subagent via `/agents` for tasks involving more than one file, architectural changes, or complex research.
- **Context Management:** Use subagents to manage context windows. If the task requires loading more than 5 files, create a new specialized subagent to handle the work in parallel [2, 5].
- **Plan, Then Delegate:** Create a high-level plan, then immediately assign subagents to implement tasks to reduce main session overhead [1, 4].
