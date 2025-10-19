$WshShell = New-Object -ComObject WScript.Shell
$StartupFolder = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupFolder "SlackTaskBot.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync\start_bot_hidden.vbs"
$Shortcut.WorkingDirectory = "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync"
$Shortcut.Save()
Write-Host "Startup shortcut created at: $ShortcutPath"
