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

    def add_weekday_to_date(self, date_str):
        """日付に曜日を追加（例: 10/20 → 10/20(月)）"""
        try:
            # 現在の年を取得
            current_year = datetime.now().year

            # date_strをパース（例: 10/20）
            month, day = date_str.split('/')
            date_obj = datetime(current_year, int(month), int(day))

            # 曜日を取得
            weekdays = ['月', '火', '水', '木', '金', '土', '日']
            weekday = weekdays[date_obj.weekday()]

            return f"{date_str}({weekday})"
        except:
            # パースに失敗した場合はそのまま返す
            return date_str

    def get_watched_channels(self):
        """監視対象チャンネルのみ取得"""
        watched = os.getenv("WATCHED_CHANNELS", "").split(",")
        watched = [c.strip() for c in watched if c.strip()]

        if not watched:
            # 未指定なら全チャンネル
            result = self.client.conversations_list(types="public_channel,private_channel")
            log(f"監視対象: 全チャンネル ({len(result['channels'])}チャンネル)")
            return result["channels"]

        channels = []
        all_channels = self.client.conversations_list(types="public_channel,private_channel")["channels"]

        for identifier in watched:
            if identifier.startswith("C"):  # Channel ID
                channels.append({"id": identifier, "name": identifier})
            else:  # Channel name
                for ch in all_channels:
                    if ch.get("name") == identifier:
                        channels.append(ch)
                        break

        log(f"監視対象: {len(channels)}チャンネル ({', '.join([c.get('name', c.get('id')) for c in channels])})")
        return channels

    def get_task_messages(self, channel_id=None, emoji="white_check_mark", lookback_hours=24):
        """
        タスク絵文字でリアクションされたメッセージを取得
        emoji: デフォルトは✅(white_check_mark)
        lookback_hours: 過去何時間分のメッセージを確認するか（オフライン対応）
        """
        tasks = []
        processed_ids = self.state.get("processed_task_ids", [])

        try:
            # チャンネル指定がない場合は監視対象チャンネルから検索
            if channel_id:
                channels = [{"id": channel_id}]
            else:
                channels = self.get_watched_channels()

            # 過去lookback_hours時間のタイムスタンプを計算
            oldest_time = time.time() - (lookback_hours * 3600)
            log(f"検索期間: 過去{lookback_hours}時間")

            total_messages = 0
            messages_with_reactions = 0
            matching_emoji_count = 0

            for channel in channels:
                ch_id = channel["id"]
                ch_name = channel.get("name", ch_id)

                # 過去lookback_hours時間分のメッセージを取得
                result = self.client.conversations_history(
                    channel=ch_id,
                    oldest=str(oldest_time)
                )

                messages = result.get("messages", [])
                total_messages += len(messages)

                for message in messages:
                    # リアクションをチェック
                    if "reactions" in message:
                        messages_with_reactions += 1
                        for reaction in message["reactions"]:
                            if reaction["name"] == emoji:
                                matching_emoji_count += 1
                                # タスクIDを生成（重複チェック用）
                                task_id = f"{ch_id}_{message.get('ts', '')}"

                                # 既に処理済みの場合はスキップ
                                if task_id in processed_ids:
                                    log(f"  スキップ (処理済み): {message.get('text', '')[:30]}...")
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
                                log(f"  新規タスク検出: {message_text[:30]}...")

            log(f"メッセージ統計: 合計={total_messages}, リアクション付き={messages_with_reactions}, {emoji}付き={matching_emoji_count}")

        except SlackApiError as e:
            log(f"Slack API エラー: {e.response['error']}")

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

        # 曜日を追加（10/20 → 10/20(月)）
        due_date_with_weekday = self.add_weekday_to_date(due_date)

        # タグは既にcleaned_textに含まれているので、追加しない
        # フォーマット（Slackリンクなし）
        return f"- [ ] {cleaned_text} 📅{due_date_with_weekday}"

    def append_to_task_master(self, tasks):
        """タグごとにセクション分けしてタスクを追加（期日順にソート）"""
        task_file = self.vault_path / "tasks.md"

        # タスクファイルが存在しない場合は作成
        if not task_file.exists():
            with open(task_file, 'w', encoding='utf-8') as f:
                f.write("# タスク管理\n\n")

        # ファイルを読み込み
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')

        # 新しいタスクを追加
        for task in tasks:
            task_text = task["text"]
            tags = self.extract_tags_from_message(task_text)

            # タグがない場合はデフォルトタグを使用
            if not tags:
                tags = self.default_tags if self.default_tags else ["タスク"]

            # 各タグに対してタスクを追加
            for tag in tags:
                tag_section = f"## #{tag}"
                tag_section_index = -1

                # タグセクションを探す
                for i, line in enumerate(lines):
                    if line.strip() == tag_section:
                        tag_section_index = i
                        break

                # タスク行を作成
                task_line = self.format_task_for_obsidian(task)

                if tag_section_index != -1:
                    # セクションが存在する場合、期日順に挿入
                    self._insert_task_sorted(lines, tag_section_index, task_line)
                else:
                    # 新しいタグセクションを作成
                    title_index = -1
                    for i, line in enumerate(lines):
                        if line.startswith("# "):
                            title_index = i
                            break

                    if title_index != -1:
                        # タイトルの直後に新しいセクションを挿入
                        insert_index = title_index + 1
                        while insert_index < len(lines) and lines[insert_index].strip() == "":
                            insert_index += 1

                        new_section = [tag_section, task_line, ""]
                        for item in reversed(new_section):
                            lines.insert(insert_index, item)
                    else:
                        lines.extend([tag_section, task_line, ""])

        # ファイルに書き込み
        with open(task_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        return task_file

    def _insert_task_sorted(self, lines, section_index, new_task_line):
        """タスクを期日順にソートして挿入"""
        import re

        # 新しいタスクの期日を抽出
        new_date = self._extract_date_from_task_line(new_task_line)

        # セクション内のタスクを探す
        insert_index = section_index + 1
        while insert_index < len(lines) and lines[insert_index].strip() == "":
            insert_index += 1

        # 期日順に挿入位置を探す
        while insert_index < len(lines):
            line = lines[insert_index]

            # 次のセクションまたは空行に到達したら終了
            if line.startswith("##") or (line.strip() == "" and insert_index + 1 < len(lines) and lines[insert_index + 1].startswith("##")):
                break

            # タスク行の場合、期日を比較
            if line.strip().startswith("- [ ]"):
                existing_date = self._extract_date_from_task_line(line)

                # 新しいタスクの方が早い期日なら、この位置に挿入
                if new_date and existing_date and new_date < existing_date:
                    lines.insert(insert_index, new_task_line)
                    return
                elif not new_date and existing_date:
                    # 新しいタスクに期日がない場合は後ろに
                    insert_index += 1
                    continue

            insert_index += 1

        # 最後に挿入
        lines.insert(insert_index, new_task_line)

    def _extract_date_from_task_line(self, task_line):
        """タスク行から期日を抽出してdatetimeオブジェクトに変換"""
        import re

        # 📅10/20(月) のようなパターンを抽出
        match = re.search(r'📅(\d{1,2})/(\d{1,2})', task_line)
        if match:
            month = int(match.group(1))
            day = int(match.group(2))
            current_year = datetime.now().year
            try:
                return datetime(current_year, month, day)
            except:
                return None
        return None

    def sync(self, channel_id=None, emoji="white_check_mark"):
        """タスクを同期"""
        log("Slackからタスクを取得中...")
        log(f"検索対象: チャンネル={channel_id or '全チャンネル'}, 絵文字={emoji}")
        log(f"処理済みタスク数: {len(self.state.get('processed_task_ids', []))}")

        tasks = self.get_task_messages(channel_id, emoji)

        if tasks:
            log(f"{len(tasks)}件の新しいタスクを見つけました")
            for i, task in enumerate(tasks):
                log(f"  タスク{i+1}: {task['text'][:50]}...")
            task_file = self.append_to_task_master(tasks)
            log(f"タスクを {task_file} に追加しました")
        else:
            log("新しいタスクはありません")

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
