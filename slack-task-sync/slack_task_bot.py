#!/usr/bin/env python3
"""
Slack Task Sync Bot - Slackのメッセージを絵文字リアクションでタスク化してObsidianに同期
リアルタイム同期対応版
"""
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.socket_mode import SocketModeClient
from slack_sdk.socket_mode.request import SocketModeRequest
from slack_sdk.socket_mode.response import SocketModeResponse
import time
import json
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

# ログファイル設定
LOG_FILE = Path(__file__).parent / "bot.log"

def log(message):
    """ログを出力"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] {message}"

    # コンソールに出力
    print(log_message)
    sys.stdout.flush()

    # ファイルに出力
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_message + '\n')
    except Exception as e:
        print(f"ログ書き込みエラー: {e}")

class SlackTaskSync:
    def __init__(self, token, vault_path, default_tags=None):
        self.client = WebClient(token=token)
        self.vault_path = Path(vault_path)
        self.state_file = Path(__file__).parent / "sync_state.json"
        self.default_tags = default_tags or []
        self.load_state()

    def load_state(self):
        """最後にチェックしたタイムスタンプを読み込み"""
        if self.state_file.exists():
            with open(self.state_file, 'r', encoding='utf-8') as f:
                self.state = json.load(f)
        else:
            self.state = {"last_check": time.time()}

    def save_state(self):
        """状態を保存"""
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f)

    def extract_tags_from_message(self, text):
        """メッセージからタグを抽出（#で始まる単語）"""
        tags = re.findall(r'#(\w+)', text)
        return tags

    def get_task_messages(self, channel_id=None, emoji="white_check_mark", lookback_hours=24):
        """
        タスク絵文字でリアクションされたメッセージを取得
        emoji: デフォルトは✅(white_check_mark)
        lookback_hours: 過去何時間分のメッセージを確認するか（オフライン対応）
        """
        tasks = []
        processed_ids = self.state.get("processed_task_ids", [])

        try:
            # チャンネル指定がない場合は全チャンネルから検索
            if channel_id:
                channels = [{"id": channel_id}]
            else:
                result = self.client.conversations_list(types="public_channel,private_channel")
                channels = result["channels"]

            # 過去lookback_hours時間のタイムスタンプを計算
            oldest_time = time.time() - (lookback_hours * 3600)

            for channel in channels:
                ch_id = channel["id"]

                # 過去lookback_hours時間分のメッセージを取得
                result = self.client.conversations_history(
                    channel=ch_id,
                    oldest=str(oldest_time)
                )

                for message in result.get("messages", []):
                    # リアクションをチェック
                    if "reactions" in message:
                        for reaction in message["reactions"]:
                            if reaction["name"] == emoji:
                                # タスクIDを生成（重複チェック用）
                                task_id = f"{ch_id}_{message.get('ts', '')}"

                                # 既に処理済みの場合はスキップ
                                if task_id in processed_ids:
                                    continue

                                # タスク情報を抽出
                                message_text = message.get("text", "")
                                task = {
                                    "text": message_text,
                                    "timestamp": message.get("ts", ""),
                                    "channel": ch_id,
                                    "user": message.get("user", ""),
                                    "permalink": self.get_permalink(ch_id, message.get("ts", "")),
                                    "tags": self.extract_tags_from_message(message_text),
                                    "task_id": task_id
                                }
                                tasks.append(task)
                                processed_ids.append(task_id)

        except SlackApiError as e:
            print(f"Error: {e.response['error']}")

        # 処理済みIDを保存（最新1000件のみ保持）
        self.state["processed_task_ids"] = processed_ids[-1000:]
        self.save_state()

        return tasks

    def get_permalink(self, channel_id, message_ts):
        """メッセージのパーマリンクを取得"""
        try:
            result = self.client.chat_getPermalink(
                channel=channel_id,
                message_ts=message_ts
            )
            return result.get("permalink", "")
        except SlackApiError:
            return ""

    def extract_due_date(self, text):
        """メッセージから期日を抽出し、元のテキストから削除"""
        import re
        # 日付パターンのマッチング（例: 10/20まで, 10月20日まで, 2025-10-20など）
        patterns = [
            (r'(\d{1,2}/\d{1,2})(まで)?', r'\1'),  # 10/20まで → 10/20
            (r'(\d{1,2})月(\d{1,2})日(まで)?', r'\1/\2'),  # 10月20日まで → 10/20
            (r'(\d{4})-(\d{1,2})-(\d{1,2})', r'\2/\3'),  # 2025-10-20 → 10/20
        ]

        for pattern, replacement in patterns:
            match = re.search(pattern, text)
            if match:
                # 抽出した日付
                if replacement.startswith(r'\1/\2'):
                    # 10月20日の場合
                    due_date = f"{match.group(1)}/{match.group(2)}"
                elif replacement.startswith(r'\2/\3'):
                    # 2025-10-20の場合
                    due_date = f"{match.group(2)}/{match.group(3)}"
                else:
                    # 10/20の場合
                    due_date = match.group(1)

                # 元のテキストから日付部分を削除
                cleaned_text = re.sub(pattern, '', text).strip()
                # 余分なスペースを削除
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text)

                return due_date, cleaned_text

        return None, text

    def format_task_for_obsidian(self, task):
        """Obsidian形式のタスクに変換"""
        text = task["text"].replace("\n", " ")  # 改行を削除

        # 期日を抽出（元のテキストから削除）
        due_date, cleaned_text = self.extract_due_date(text)

        # 期日が指定されていない場合は投稿日を使用
        if not due_date:
            due_date = datetime.now().strftime("%m/%d")
            # 先頭の0を削除（例: 09/05 → 9/5）
            due_date = due_date.lstrip('0').replace('/0', '/')

        # タグは既にcleaned_textに含まれているので、追加しない
        # フォーマット（Slackリンクなし）
        return f"- [ ] {cleaned_text} 📅{due_date}"

    def append_to_task_master(self, tasks):
        """単一のタスクマスターファイルにタスクを追加"""
        task_file = self.vault_path / "tasks.md"
        today = datetime.now().strftime("%Y-%m-%d")

        # タスクファイルが存在しない場合は作成
        if not task_file.exists():
            with open(task_file, 'w', encoding='utf-8') as f:
                f.write("# タスク管理\n\n")

        # ファイルを読み込み
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')

        # 今日の日付セクションを探す
        today_section_index = -1
        for i, line in enumerate(lines):
            if line.strip() == f"## {today}":
                today_section_index = i
                break

        task_lines = [self.format_task_for_obsidian(task) for task in tasks]

        if today_section_index != -1:
            # 今日のセクションが既に存在する場合、その直後に追加
            insert_index = today_section_index + 1
            # 空行をスキップ
            while insert_index < len(lines) and lines[insert_index].strip() == "":
                insert_index += 1

            # タスクを挿入
            for task_line in task_lines:
                lines.insert(insert_index, task_line)
                insert_index += 1
        else:
            # 新しい日付セクションを作成（ファイルの先頭、タイトルの直後に挿入）
            # "# タスク管理"の後に挿入
            title_index = -1
            for i, line in enumerate(lines):
                if line.startswith("# "):
                    title_index = i
                    break

            if title_index != -1:
                # タイトルの直後に新しいセクションを挿入
                insert_index = title_index + 1
                # 空行をスキップ
                while insert_index < len(lines) and lines[insert_index].strip() == "":
                    insert_index += 1

                # 新しい日付セクションとタスクを挿入
                new_section = [f"## {today}", ""] + task_lines + [""]
                for item in reversed(new_section):
                    lines.insert(insert_index, item)
            else:
                # タイトルが見つからない場合、末尾に追加
                lines.extend([f"## {today}", ""] + task_lines + [""])

        # ファイルに書き込み
        with open(task_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        return task_file

    def sync(self, channel_id=None, emoji="white_check_mark"):
        """タスクを同期"""
        print("Slackからタスクを取得中...")
        tasks = self.get_task_messages(channel_id, emoji)

        if tasks:
            print(f"{len(tasks)}件のタスクを見つけました")
            task_file = self.append_to_task_master(tasks)
            print(f"タスクを {task_file} に追加しました")
        else:
            print("新しいタスクはありません")

        # 状態を更新
        self.state["last_check"] = time.time()
        self.save_state()


class RealtimeSlackTaskSync(SlackTaskSync):
    """リアルタイム同期版（Socket Mode使用）"""

    def __init__(self, bot_token, app_token, vault_path, default_tags=None, emoji="white_check_mark"):
        super().__init__(bot_token, vault_path, default_tags)
        self.app_token = app_token
        self.emoji = emoji
        self.socket_client = SocketModeClient(
            app_token=app_token,
            web_client=self.client
        )

    def handle_reaction_added(self, client: SocketModeClient, req: SocketModeRequest):
        """リアクション追加イベントを処理"""
        if req.type == "events_api":
            # イベントを確認
            response = SocketModeResponse(envelope_id=req.envelope_id)
            client.send_socket_mode_response(response)

            event = req.payload["event"]
            if event["type"] == "reaction_added" and event["reaction"] == self.emoji:
                # タスク情報を取得
                channel_id = event["item"]["channel"]
                message_ts = event["item"]["ts"]

                # 重複チェック
                task_id = f"{channel_id}_{message_ts}"
                processed_ids = self.state.get("processed_task_ids", [])

                if task_id in processed_ids:
                    print(f"[SKIP] 既に処理済みのタスク")
                    return

                try:
                    # メッセージを取得
                    result = self.client.conversations_history(
                        channel=channel_id,
                        inclusive=True,
                        oldest=message_ts,
                        limit=1
                    )

                    if result["messages"]:
                        message = result["messages"][0]
                        message_text = message.get("text", "")

                        task = {
                            "text": message_text,
                            "timestamp": message_ts,
                            "channel": channel_id,
                            "user": message.get("user", ""),
                            "permalink": self.get_permalink(channel_id, message_ts),
                            "tags": self.extract_tags_from_message(message_text),
                            "task_id": task_id
                        }

                        # Obsidianに追加
                        self.append_to_task_master([task])

                        # 処理済みとして記録
                        processed_ids.append(task_id)
                        self.state["processed_task_ids"] = processed_ids[-1000:]
                        self.save_state()

                        log(f"[OK] タスク追加: {message_text[:50]}...")

                except SlackApiError as e:
                    log(f"エラー: {e.response['error']}")

    def start_realtime_sync(self):
        """リアルタイム同期を開始"""
        # 起動時に過去24時間分のタスクを取得（オフライン時の対応）
        log("起動時チェック: 過去24時間分のタスクを確認中...")
        tasks = self.get_task_messages(emoji=self.emoji, lookback_hours=24)
        if tasks:
            log(f"{len(tasks)}件の未処理タスクを見つけました")
            self.append_to_task_master(tasks)
        else:
            log("未処理タスクはありません")

        # リアルタイム同期開始
        self.socket_client.socket_mode_request_listeners.append(self.handle_reaction_added)
        log("リアルタイム同期を開始しました。絵文字でリアクションするとタスクが追加されます。")
        log("終了するにはCtrl+Cを押してください。")
        self.socket_client.connect()

        # 接続を維持
        try:
            from threading import Event
            Event().wait()
        except KeyboardInterrupt:
            log("\n同期を終了します...")
            self.socket_client.disconnect()
        except Exception as e:
            log(f"予期しないエラー: {e}")
            raise


def main():
    """メイン関数"""
    try:
        import argparse

        parser = argparse.ArgumentParser(description='Slack Task Sync Bot')
        parser.add_argument('--realtime', action='store_true', help='リアルタイム同期モード')
        parser.add_argument('--tags', nargs='+', help='デフォルトタグ（複数指定可）例: --tags TGS 緊急')
        parser.add_argument('--emoji', default='white_check_mark', help='リアクション絵文字（デフォルト: white_check_mark）')
        args = parser.parse_args()

        # 環境変数から設定を取得
        slack_token = os.getenv("SLACK_BOT_TOKEN")
        app_token = os.getenv("SLACK_APP_TOKEN")  # Socket Modeで必要
        vault_path = os.getenv("OBSIDIAN_VAULT_PATH", r"c:\Users\80036\Documents\Obsidian Vault")
        channel_id = os.getenv("SLACK_CHANNEL_ID")  # オプション

        # デフォルトタグを環境変数またはコマンドラインから取得
        default_tags = args.tags
        if not default_tags:
            tags_str = os.getenv("DEFAULT_TAGS", "")
            default_tags = [t.strip() for t in tags_str.split(",") if t.strip()]

        if not slack_token:
            log("エラー: SLACK_BOT_TOKEN環境変数が設定されていません")
            return

        if args.realtime:
            # リアルタイム同期モード
            if not app_token:
                log("エラー: リアルタイムモードにはSLACK_APP_TOKEN環境変数が必要です")
                return

            log("Bot起動中...")
            bot = RealtimeSlackTaskSync(slack_token, app_token, vault_path, default_tags, args.emoji)
            bot.start_realtime_sync()
        else:
            # バッチ同期モード
            bot = SlackTaskSync(slack_token, vault_path, default_tags)
            bot.sync(channel_id)

    except Exception as e:
        log(f"致命的エラー: {e}")
        import traceback
        log(traceback.format_exc())
        raise


if __name__ == "__main__":
    main()
