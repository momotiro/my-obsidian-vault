#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Slack Reaction Learner
リアクションから記事の好みを学習
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List
import base64

# 環境変数
SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN')
SLACK_CHANNEL = 'news'
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPOSITORY')

# リアクション定義
POSITIVE_REACTIONS = ['thumbsup', '+1', 'heart', 'fire', 'star-struck', 'eyes', '100']
NEGATIVE_REACTIONS = ['thumbsdown', '-1', 'disappointed']


def github_get_file(file_path: str):
    """GitHubからファイル取得"""
    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}'
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            content = response.json()['content']
            decoded = base64.b64decode(content).decode('utf-8')
            return {
                'data': json.loads(decoded),
                'sha': response.json()['sha']
            }
        return None
    except Exception as e:
        print(f"Error getting file: {e}")
        return None


def github_save_file(file_path: str, data: Dict, sha: str = None):
    """GitHubにファイル保存"""
    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}'

        content = base64.b64encode(json.dumps(data, ensure_ascii=False, indent=2).encode()).decode()

        payload = {
            'message': f'Update {file_path} - {datetime.now().strftime("%Y-%m-%d")}',
            'content': content,
        }
        if sha:
            payload['sha'] = sha

        response = requests.put(url, headers=headers, json=payload, timeout=10)
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"Error saving file: {e}")
        return False


def get_recent_messages(days: int = 7) -> List[Dict]:
    """最近のメッセージ取得"""
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

    response = requests.get(url, headers=headers, params=params, timeout=10)

    if response.status_code == 200 and response.json().get('ok'):
        return response.json().get('messages', [])
    return []


def update_preferences(article: Dict, reactions: List[Dict], learning_data: Dict):
    """好みを更新"""
    prefs = learning_data.get('preferences', {})
    liked_sources = prefs.get('liked_sources', {})
    liked_tags = prefs.get('liked_tags', {})
    liked_articles = prefs.get('liked_articles', [])

    source = article.get('source', '')
    tags = article.get('tags', [])
    url = article.get('url', '')

    for reaction in reactions:
        name = reaction.get('name', '')
        count = reaction.get('count', 0)

        if name in POSITIVE_REACTIONS:
            if source:
                liked_sources[source] = liked_sources.get(source, 0) + count
            for tag in tags:
                liked_tags[tag] = liked_tags.get(tag, 0) + count
            if url and url not in liked_articles:
                liked_articles.append(url)

        elif name in NEGATIVE_REACTIONS:
            if source:
                liked_sources[source] = liked_sources.get(source, 0) - count
            for tag in tags:
                liked_tags[tag] = liked_tags.get(tag, 0) - count

    prefs['liked_sources'] = liked_sources
    prefs['liked_tags'] = liked_tags
    prefs['liked_articles'] = liked_articles[-100:]

    learning_data['preferences'] = prefs
    learning_data['last_updated'] = datetime.now().isoformat()


def main():
    """メイン処理"""
    print("=== Reaction Learner Started ===")

    # 学習データ読み込み
    file_data = github_get_file('daily-news-bot/learning_data.json')
    learning_data = file_data['data'] if file_data else {
        "preferences": {"liked_sources": {}, "liked_tags": {}, "liked_articles": []}
    }

    # メッセージ取得
    messages = get_recent_messages(days=7)
    print(f"Found {len(messages)} messages")

    updated = False

    for msg in messages:
        metadata = msg.get('metadata', {})
        if metadata.get('event_type') == 'daily_news_article':
            article = metadata.get('event_payload', {}).get('article')
            reactions = msg.get('reactions', [])

            if article and reactions:
                print(f"Processing: {article.get('title', '')[:50]}...")
                update_preferences(article, reactions, learning_data)
                updated = True

    if updated:
        sha = file_data['sha'] if file_data else None
        if github_save_file('daily-news-bot/learning_data.json', learning_data, sha):
            print("✅ Learning data updated")
    else:
        print("ℹ️ No new reactions")

    # 現在の好み表示
    prefs = learning_data.get('preferences', {})
    print("\n=== Current Preferences ===")
    print("Sources:", prefs.get('liked_sources', {}))
    print("Tags:", prefs.get('liked_tags', {}))

    print("=== Finished ===")


if __name__ == '__main__':
    main()
