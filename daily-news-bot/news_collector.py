#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily News Collector for Slack
毎日有益な記事を収集してSlackに投稿するスクリプト
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict
import hashlib

# 環境変数から取得
SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN')
SLACK_CHANNEL = 'news'
SLACK_USER_ID = 'U05A1BUDW02'
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPOSITORY')

# 記事データの型定義
class Article:
    def __init__(self, title: str, url: str, summary: str, tags: List[str], source: str, lang: str):
        self.title = title
        self.url = url
        self.summary = summary
        self.tags = tags
        self.source = source
        self.lang = lang
        self.hash = hashlib.md5(url.encode()).hexdigest()

    def to_dict(self):
        return {
            'title': self.title,
            'url': self.url,
            'summary': self.summary,
            'tags': self.tags,
            'source': self.source,
            'lang': self.lang,
            'hash': self.hash
        }


def load_sent_articles() -> set:
    """既に送信済みの記事ハッシュを取得"""
    try:
        # GitHub APIから既読リストを取得
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/daily-news-bot/sent_articles.json'
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            content = response.json()['content']
            import base64
            decoded = base64.b64decode(content).decode('utf-8')
            data = json.loads(decoded)
            return set(data.get('hashes', []))
        else:
            return set()
    except Exception as e:
        print(f"Error loading sent articles: {e}")
        return set()


def save_sent_articles(article_hashes: List[str]):
    """送信済み記事ハッシュを保存"""
    try:
        sent_articles = load_sent_articles()
        sent_articles.update(article_hashes)

        # 最新1000件のみ保持（メモリ節約）
        if len(sent_articles) > 1000:
            sent_articles = set(list(sent_articles)[-1000:])

        data = {
            'hashes': list(sent_articles),
            'last_updated': datetime.now().isoformat()
        }

        # GitHub APIで保存
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/daily-news-bot/sent_articles.json'

        # 既存ファイルのSHAを取得
        response = requests.get(url, headers=headers)
        sha = response.json()['sha'] if response.status_code == 200 else None

        import base64
        content = base64.b64encode(json.dumps(data, ensure_ascii=False, indent=2).encode()).decode()

        payload = {
            'message': f'Update sent articles {datetime.now().strftime("%Y-%m-%d")}',
            'content': content,
        }
        if sha:
            payload['sha'] = sha

        requests.put(url, headers=headers, json=payload)
        print(f"Saved {len(article_hashes)} new article hashes")

    except Exception as e:
        print(f"Error saving sent articles: {e}")


def search_nikkei_xtrend(keywords: List[str], days: int = 2) -> List[Article]:
    """日経クロストレンドから記事を検索（ダミー実装）"""
    # 注: 実際のスクレイピングはRobot.txtとAPIを確認する必要があります
    # ここでは構造のみ提供
    articles = []
    print("日経クロストレンドからの記事取得は手動実装が必要です")
    return articles


def search_web_articles(keywords: List[str], days: int = 2, max_results: int = 20) -> List[Article]:
    """Web検索APIを使って記事を検索"""
    articles = []

    # Google Custom Search API、Bing News API、またはNews APIを使用
    # ここではNews API（https://newsapi.org/）を例に実装
    NEWS_API_KEY = os.environ.get('NEWS_API_KEY')

    if not NEWS_API_KEY:
        print("Warning: NEWS_API_KEY not set")
        return articles

    try:
        from_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        # 日本語記事を優先的に取得
        for keyword in keywords:
            # 日本語での検索
            url = 'https://newsapi.org/v2/everything'
            params = {
                'q': keyword,
                'language': 'ja',
                'from': from_date,
                'sortBy': 'relevancy',
                'pageSize': 5,
                'apiKey': NEWS_API_KEY
            }

            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('articles', []):
                    article = Article(
                        title=item.get('title', ''),
                        url=item.get('url', ''),
                        summary=item.get('description', '')[:200] + '...',
                        tags=[keyword],
                        source=item.get('source', {}).get('name', 'Unknown'),
                        lang='ja'
                    )
                    articles.append(article)

        # 英語記事も少し取得
        for keyword in keywords[:2]:  # 主要キーワードのみ
            params['language'] = 'en'
            params['pageSize'] = 2

            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('articles', []):
                    article = Article(
                        title=item.get('title', ''),
                        url=item.get('url', ''),
                        summary=item.get('description', '')[:200] + '...',
                        tags=[keyword],
                        source=item.get('source', {}).get('name', 'Unknown'),
                        lang='en'
                    )
                    articles.append(article)

    except Exception as e:
        print(f"Error searching web articles: {e}")

    return articles


def filter_and_rank_articles(articles: List[Article], sent_hashes: set, target_count: int = 5) -> List[Article]:
    """記事をフィルタリング・ランキングして上位を返す"""
    # 既読を除外
    filtered = [a for a in articles if a.hash not in sent_hashes]

    # 重複URL除外
    seen_urls = set()
    unique_articles = []
    for article in filtered:
        if article.url not in seen_urls:
            seen_urls.add(article.url)
            unique_articles.append(article)

    # 日本語記事を優先的にソート
    unique_articles.sort(key=lambda x: (x.lang != 'ja', x.source != '日経クロストレンド'))

    return unique_articles[:target_count]


def format_slack_message(articles: List[Article]) -> str:
    """Slack投稿用のメッセージを整形"""
    today = datetime.now().strftime('%Y-%m-%d')

    message = f"📰 *今日のおすすめ記事* ({today})\n<@{SLACK_USER_ID}>\n\n"

    emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

    for idx, article in enumerate(articles):
        emoji = emojis[idx] if idx < len(emojis) else f"{idx+1}."
        lang_flag = '🇯🇵' if article.lang == 'ja' else '🇺🇸'

        message += f"{emoji} *{article.title}* {lang_flag}\n"
        message += f"🔗 {article.url}\n"
        message += f"📝 {article.summary}\n"
        message += f"🏷️ {' '.join(['#' + tag for tag in article.tags])} | 📰 {article.source}\n\n"

    return message


def post_to_slack(message: str):
    """Slackにメッセージを投稿"""
    url = 'https://slack.com/api/chat.postMessage'
    headers = {
        'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type': 'application/json'
    }

    payload = {
        'channel': SLACK_CHANNEL,
        'text': message,
        'unfurl_links': False,
        'unfurl_media': False
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200 and response.json().get('ok'):
        print("✅ Successfully posted to Slack")
    else:
        print(f"❌ Failed to post to Slack: {response.text}")


def main():
    """メイン処理"""
    print("=== Daily News Collector Started ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # キーワード定義
    keywords = [
        'コミュニティマーケティング',
        'SNSマーケティング',
        'インフルエンサーマーケティング',
        'AI',
        'マーケティング',
        'community marketing',
        'influencer marketing'
    ]

    # 既読記事の読み込み
    sent_hashes = load_sent_articles()
    print(f"Loaded {len(sent_hashes)} sent article hashes")

    # 記事収集
    all_articles = []

    # Web検索
    web_articles = search_web_articles(keywords, days=2, max_results=30)
    all_articles.extend(web_articles)
    print(f"Found {len(web_articles)} articles from web search")

    # 日経クロストレンド（手動実装が必要）
    # nikkei_articles = search_nikkei_xtrend(keywords, days=2)
    # all_articles.extend(nikkei_articles)

    # フィルタリング・ランキング
    selected_articles = filter_and_rank_articles(all_articles, sent_hashes, target_count=5)
    print(f"Selected {len(selected_articles)} articles to send")

    if len(selected_articles) == 0:
        print("⚠️ No new articles found")
        # 記事がない場合もSlackに通知
        message = f"📰 *今日のおすすめ記事* ({datetime.now().strftime('%Y-%m-%d')})\n"
        message += f"<@{SLACK_USER_ID}>\n\n"
        message += "今日は新しい記事が見つかりませんでした。"
        post_to_slack(message)
        return

    # Slackに投稿
    message = format_slack_message(selected_articles)
    post_to_slack(message)

    # 既読リストに保存
    article_hashes = [a.hash for a in selected_articles]
    save_sent_articles(article_hashes)

    print("=== Daily News Collector Finished ===")


if __name__ == '__main__':
    main()
