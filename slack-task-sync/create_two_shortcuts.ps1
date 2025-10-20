# Shortcut 1: Console version (with visible window)
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Slack Task Bot (Console).lnk")
$Shortcut.TargetPath = "C:\Users\80036\AppData\Local\Programs\Python\Python313\python.exe"
$Shortcut.Arguments = "`"c:\Users\80036\Documents\Obsidian Vault\slack-task-sync\slack_task_bot.py`" --realtime"
$Shortcut.WorkingDirectory = "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync"
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,165"
$Shortcut.Description = "Slack Task Bot (Console)"
$Shortcut.Save()

# Shortcut 2: Background version (no window)
$Shortcut2 = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Slack Task Bot (Background).lnk")
$Shortcut2.TargetPath = "C:\Users\80036\Documents\Obsidian Vault\slack-task-sync\start_bot_hidden.vbs"
$Shortcut2.WorkingDirectory = "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync"
$Shortcut2.IconLocation = "C:\Windows\System32\shell32.dll,165"
$Shortcut2.Description = "Slack Task Bot (Background)"
$Shortcut2.Save()

Write-Host "Created 2 shortcuts:"
Write-Host "  1. Slack Task Bot (Console).lnk - with visible window"
Write-Host "  2. Slack Task Bot (Background).lnk - background mode"
