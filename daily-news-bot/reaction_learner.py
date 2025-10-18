#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Slack Reaction Learner
Slackのリアクションから記事の好みを学習する
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List
import base64

# 環境変数から取得
SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN')
SLACK_CHANNEL = 'news'
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPOSITORY')

# 好みを表すリアクション
POSITIVE_REACTIONS = ['thumbsup', '+1', 'heart', 'fire', 'star-struck', 'eyes', '100']
NEGATIVE_REACTIONS = ['thumbsdown', '-1', 'disappointed']


def get_recent_messages(days: int = 7) -> List[Dict]:
    """最近のメッセージを取得"""
    url = 'https://slack.com/api/conversations.history'
    headers = {
        'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type': 'application/json'
    }

    oldest = (datetime.now() - timedelta(days=days)).timestamp()

    params = {
        'channel': SLACK_CHANNEL,
        'oldest': oldest,
        'limit': 100
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200 and response.json().get('ok'):
        return response.json().get('messages', [])
    else:
        print(f"Failed to get messages: {response.text}")
        return []


def get_message_reactions(channel: str, timestamp: str) -> List[Dict]:
    """メッセージのリアクションを取得"""
    url = 'https://slack.com/api/reactions.get'
    headers = {
        'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type': 'application/json'
    }

    params = {
        'channel': channel,
        'timestamp': timestamp
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200 and response.json().get('ok'):
        message = response.json().get('message', {})
        return message.get('reactions', [])
    else:
        return []


def load_learning_data() -> Dict:
    """学習データを読み込む"""
    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/daily-news-bot/learning_data.json'
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            content = response.json()['content']
            decoded = base64.b64decode(content).decode('utf-8')
            return json.loads(decoded)
        else:
            return {"preferences": {"liked_sources": {}, "liked_tags": {}, "liked_articles": []}}
    except Exception as e:
        print(f"Error loading learning data: {e}")
        return {"preferences": {"liked_sources": {}, "liked_tags": {}, "liked_articles": []}}


def save_learning_data(data: Dict):
    """学習データを保存"""
    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/daily-news-bot/learning_data.json'

        # 既存ファイルのSHAを取得
        response = requests.get(url, headers=headers)
        sha = response.json()['sha'] if response.status_code == 200 else None

        content = base64.b64encode(json.dumps(data, ensure_ascii=False, indent=2).encode()).decode()

        payload = {
            'message': f'Update learning data {datetime.now().strftime("%Y-%m-%d")}',
            'content': content,
        }
        if sha:
            payload['sha'] = sha

        response = requests.put(url, headers=headers, json=payload)
        if response.status_code in [200, 201]:
            print("✅ Learning data saved")
        else:
            print(f"❌ Failed to save learning data: {response.text}")

    except Exception as e:
        print(f"Error saving learning data: {e}")


def update_preferences_from_article(article: Dict, reactions: List[Dict], learning_data: Dict):
    """個別記事のリアクションを元に好みを更新"""
    prefs = learning_data.get('preferences', {})
    liked_sources = prefs.get('liked_sources', {})
    liked_tags = prefs.get('liked_tags', {})
    liked_articles = prefs.get('liked_articles', [])

    source = article.get('source', '')
    tags = article.get('tags', [])
    url = article.get('url', '')

    for reaction in reactions:
        reaction_name = reaction.get('name', '')
        count = reaction.get('count', 0)

        # ポジティブリアクション
        if reaction_name in POSITIVE_REACTIONS:
            # ソースのスコアを増やす
            if source:
                liked_sources[source] = liked_sources.get(source, 0) + count

            # タグのスコアを増やす
            for tag in tags:
                liked_tags[tag] = liked_tags.get(tag, 0) + count

            # 記事URLを記録
            if url and url not in liked_articles:
                liked_articles.append(url)

        # ネガティブリアクション
        elif reaction_name in NEGATIVE_REACTIONS:
            # スコアを減らす
            if source:
                liked_sources[source] = liked_sources.get(source, 0) - count

            for tag in tags:
                liked_tags[tag] = liked_tags.get(tag, 0) - count

    # 更新
    prefs['liked_sources'] = liked_sources
    prefs['liked_tags'] = liked_tags
    prefs['liked_articles'] = liked_articles[-100:]  # 最新100件のみ保持

    learning_data['preferences'] = prefs
    learning_data['last_updated'] = datetime.now().isoformat()


def main():
    """メイン処理"""
    print("=== Reaction Learner Started ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 学習データを読み込む
    learning_data = load_learning_data()
    print(f"Loaded learning data: {len(learning_data.get('preferences', {}).get('liked_articles', []))} liked articles")

    # 最近のメッセージを取得
    messages = get_recent_messages(days=7)
    print(f"Found {len(messages)} recent messages")

    updated = False

    for message in messages:
        # メタデータから記事情報を取得
        metadata = message.get('metadata', {})

        # 個別記事メッセージの場合
        if metadata.get('event_type') == 'daily_news_article':
            article = metadata.get('event_payload', {}).get('article')

            if article:
                # リアクションを取得
                reactions = message.get('reactions', [])

                if reactions:
                    print(f"Processing article: {article.get('title', '')[:50]}... with {len(reactions)} reactions")
                    update_preferences_from_article(article, reactions, learning_data)
                    updated = True

    if updated:
        save_learning_data(learning_data)
        print("✅ Preferences updated based on reactions")
    else:
        print("ℹ️ No new reactions to learn from")

    # 現在の好みを表示
    prefs = learning_data.get('preferences', {})
    print("\n=== Current Preferences ===")
    print("Liked sources:", prefs.get('liked_sources', {}))
    print("Liked tags:", prefs.get('liked_tags', {}))

    print("=== Reaction Learner Finished ===")


if __name__ == '__main__':
    main()
