#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Slack Reaction Learner
リアクションから記事の好みを学習
"""

import json
import time
from datetime import datetime, timedelta
from typing import Dict, List
import requests


# リアクション定義
POSITIVE_REACTIONS = ['thumbsup', '+1', 'heart', 'fire', 'star-struck', 'eyes', '100']
NEGATIVE_REACTIONS = ['thumbsdown', '-1', 'disappointed']


class ReactionLearner:
    """リアクション学習クラス"""

    def __init__(self, slack_token: str, channel: str = "news"):
        self.slack_token = slack_token
        self.channel = channel
        self.base_url = "https://slack.com/api"
        self.learning_data = self.load_learning_data()

    def load_learning_data(self) -> Dict:
        """学習データを読み込み"""
        try:
            with open('learning_data.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                "preferences": {
                    "liked_sources": {},
                    "liked_tags": {},
                    "liked_articles": []
                }
            }

    def save_learning_data(self):
        """学習データを保存"""
        self.learning_data["last_updated"] = datetime.now().isoformat()
        with open('learning_data.json', 'w', encoding='utf-8') as f:
            json.dump(self.learning_data, f, ensure_ascii=False, indent=2)

    def get_channel_id(self) -> str:
        """チャンネル名からIDを取得"""
        url = f"{self.base_url}/conversations.list"
        headers = {
            "Authorization": f"Bearer {self.slack_token}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('ok'):
                for channel in data.get('channels', []):
                    if channel.get('name') == self.channel:
                        return channel.get('id')

        except Exception as e:
            print(f"Error getting channel ID: {e}")

        return self.channel

    def get_recent_messages(self, days: int = 7) -> List[Dict]:
        """過去N日間のメッセージを取得"""
        channel_id = self.get_channel_id()
        url = f"{self.base_url}/conversations.history"
        headers = {
            "Authorization": f"Bearer {self.slack_token}",
            "Content-Type": "application/json"
        }

        oldest = (datetime.now() - timedelta(days=days)).timestamp()

        params = {
            "channel": channel_id,
            "oldest": oldest,
            "limit": 100
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('ok'):
                return data.get('messages', [])

        except Exception as e:
            print(f"Error getting messages: {e}")

        return []

    def update_preferences(self, article_data: Dict, reactions: List[Dict]):
        """記事のリアクションから好みを更新"""
        prefs = self.learning_data.get('preferences', {})
        liked_sources = prefs.get('liked_sources', {})
        liked_tags = prefs.get('liked_tags', {})
        liked_articles = prefs.get('liked_articles', [])

        source = article_data.get('source', '')
        tags = article_data.get('tags', [])
        url = article_data.get('url', '')

        for reaction in reactions:
            name = reaction.get('name', '')
            count = reaction.get('count', 0)

            if name in POSITIVE_REACTIONS:
                # ポジティブリアクション
                if source:
                    liked_sources[source] = liked_sources.get(source, 0) + count * 2.0

                for tag in tags:
                    liked_tags[tag] = liked_tags.get(tag, 0) + count * 1.5

                if url and url not in liked_articles:
                    liked_articles.append(url)

            elif name in NEGATIVE_REACTIONS:
                # ネガティブリアクション
                if source:
                    liked_sources[source] = liked_sources.get(source, 0) - count

                for tag in tags:
                    liked_tags[tag] = liked_tags.get(tag, 0) - count

        # 最新100件のみ保持
        prefs['liked_sources'] = liked_sources
        prefs['liked_tags'] = liked_tags
        prefs['liked_articles'] = liked_articles[-100:]

        self.learning_data['preferences'] = prefs

    def learn_from_reactions(self):
        """Slackのリアクションから学習"""
        print("Fetching recent messages...")
        messages = self.get_recent_messages(days=7)
        print(f"Found {len(messages)} messages")

        updated = False

        for msg in messages:
            metadata = msg.get('metadata', {})

            # daily_news_articleタイプのメッセージのみ処理
            if metadata.get('event_type') == 'daily_news_article':
                event_payload = metadata.get('event_payload', {})
                reactions = msg.get('reactions', [])

                if reactions:
                    print(f"Processing article from {event_payload.get('source', 'Unknown')}")
                    self.update_preferences(event_payload, reactions)
                    updated = True
                    time.sleep(0.2)  # レート制限対策

        if updated:
            self.save_learning_data()
            print("✅ Learning data updated")
        else:
            print("ℹ️  No new reactions to learn from")

        # 現在の好みを表示
        prefs = self.learning_data.get('preferences', {})
        print("\n=== Current Preferences ===")
        print("Liked Sources:")
        for source, score in sorted(prefs.get('liked_sources', {}).items(), key=lambda x: x[1], reverse=True):
            print(f"  {source}: {score:.1f}")

        print("\nLiked Tags:")
        for tag, score in sorted(prefs.get('liked_tags', {}).items(), key=lambda x: x[1], reverse=True):
            print(f"  {tag}: {score:.1f}")


def main():
    """メイン処理"""
    import os

    slack_token = os.getenv('SLACK_BOT_TOKEN')
    if not slack_token:
        print("Error: SLACK_BOT_TOKEN not set")
        return

    print("=== Reaction Learner Started ===")
    print(f"Time: {datetime.now().isoformat()}")

    learner = ReactionLearner(slack_token)
    learner.learn_from_reactions()

    print("\n=== Reaction Learner Completed ===")


if __name__ == '__main__':
    main()
