Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\80036\Documents\Obsidian Vault\slack-task-sync"
WshShell.Run """C:\Users\80036\AppData\Local\Programs\Python\Python313\pythonw.exe"" slack_task_bot.py --realtime", 0, False
Set WshShell = Nothing
