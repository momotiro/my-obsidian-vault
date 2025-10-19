$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Slack Task Bot.lnk")
$Shortcut.TargetPath = "C:\Users\80036\AppData\Local\Programs\Python\Python313\python.exe"
$Shortcut.Arguments = "`"c:\Users\80036\Documents\Obsidian Vault\slack-task-sync\slack_task_bot.py`" --realtime"
$Shortcut.WorkingDirectory = "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync"
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,165"
$Shortcut.Description = "Slack Task Bot"
$Shortcut.Save()
Write-Host "Shortcut updated: Desktop\Slack Task Bot.lnk (Console version)"
