@echo off
REM Slack Task Sync Bot - Auto Start Script
cd /d "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync"
"C:\Users\80036\AppData\Local\Programs\Python\Python313\python.exe" slack_task_bot.py --realtime
pause
