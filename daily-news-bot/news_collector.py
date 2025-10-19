#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily News Collector for Slack
毎日有益な記事を収集してSlackに投稿するスクリプト
"""

import os
import json
import requests
import feedparser
import re
import time
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# 環境変数
SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN')
SLACK_CHANNEL = 'news'
SLACK_USER_ID = 'U05A1BUDW02'
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPOSITORY')
NEWS_API_KEY = os.environ.get('NEWS_API_KEY')


class Article:
    """記事データクラス"""
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


def github_get_file(file_path: str) -> Optional[Dict]:
    """GitHubからファイルを取得"""
    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}'
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            import base64
            content = response.json()['content']
            decoded = base64.b64decode(content).decode('utf-8')
            return {
                'data': json.loads(decoded),
                'sha': response.json()['sha']
            }
        return None
    except Exception as e:
        print(f"Error getting file from GitHub: {e}")
        return None


def github_save_file(file_path: str, data: Dict, sha: Optional[str] = None):
    """GitHubにファイルを保存"""
    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}'

        import base64
        content = base64.b64encode(json.dumps(data, ensure_ascii=False, indent=2).encode()).decode()

        payload = {
            'message': f'Update {file_path} - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
            'content': content,
        }
        if sha:
            payload['sha'] = sha

        response = requests.put(url, headers=headers, json=payload, timeout=10)
        if response.status_code in [200, 201]:
            print(f"✅ Saved {file_path}")
            return True
        else:
            print(f"❌ Failed to save {file_path}: {response.text}")
            return False
    except Exception as e:
        print(f"Error saving file to GitHub: {e}")
        return False


def load_sent_articles() -> set:
    """既読記事を読み込み"""
    file_data = github_get_file('daily-news-bot/sent_articles.json')
    if file_data:
        return set(file_data['data'].get('hashes', []))
    return set()


def save_sent_articles(article_hashes: List[str]):
    """既読記事を保存"""
    try:
        file_data = github_get_file('daily-news-bot/sent_articles.json')
        existing_hashes = set(file_data['data'].get('hashes', [])) if file_data else set()
        existing_hashes.update(article_hashes)

        # 最新1000件のみ保持
        if len(existing_hashes) > 1000:
            existing_hashes = set(list(existing_hashes)[-1000:])

        data = {
            'hashes': list(existing_hashes),
            'last_updated': datetime.now().isoformat()
        }

        sha = file_data['sha'] if file_data else None
        github_save_file('daily-news-bot/sent_articles.json', data, sha)
    except Exception as e:
        print(f"Error saving sent articles: {e}")


def load_learning_data() -> Dict:
    """学習データを読み込み"""
    file_data = github_get_file('daily-news-bot/learning_data.json')
    if file_data:
        return file_data['data']
    return {"preferences": {"liked_sources": {}, "liked_tags": {}, "liked_articles": []}}


def search_nikkei_xtrend(days: int = 3) -> List[Article]:
    """日経クロストレンドRSSから記事取得"""
    articles = []

    rss_urls = [
        'https://xtrend.nikkei.com/rss/atcl/new.rdf',
        'https://xtrend.nikkei.com/rss/atcl/feature.rdf',
    ]

    cutoff_date = datetime.now() - timedelta(days=days)

    for rss_url in rss_urls:
        try:
            feed = feedparser.parse(rss_url)
            for entry in feed.entries[:15]:
                published = entry.get('published_parsed')
                if published:
                    pub_date = datetime(*published[:6])
                    if pub_date < cutoff_date:
                        continue

                title = entry.get('title', '')
                url = entry.get('link', '')
                summary = entry.get('summary', '')
                summary = re.sub(r'<[^>]+>', '', summary)

                article = Article(
                    title=title,
                    url=url,
                    summary=summary[:200] + ('...' if len(summary) > 200 else ''),
                    tags=['マーケティング'],
                    source='日経クロストレンド',
                    lang='ja'
                )
                articles.append(article)
        except Exception as e:
            print(f"Error fetching Nikkei RSS: {e}")
            continue

    print(f"Found {len(articles)} articles from Nikkei X-Trend")
    return articles


def search_web_articles(days: int = 2) -> List[Article]:
    """News APIで記事検索"""
    articles = []

    if not NEWS_API_KEY:
        print("Warning: NEWS_API_KEY not set")
        return articles

    try:
        from_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        url = 'https://newsapi.org/v2/everything'

        # 日本語記事を検索
        ja_queries = [
            'マーケティング (コミュニティ OR SNS OR インフルエンサー)',
            'デジタルマーケティング AI',
        ]

        for query in ja_queries:
            params = {
                'q': query,
                'from': from_date,
                'language': 'ja',
                'sortBy': 'publishedAt',
                'pageSize': 20,
                'apiKey': NEWS_API_KEY
            }

            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('articles', []):
                    title = item.get('title', '')
                    description = item.get('description', '') or ''

                    # 日本語チェック
                    is_japanese = any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9faf'
                                     for c in (title + description))

                    if is_japanese:
                        article = Article(
                            title=title,
                            url=item.get('url', ''),
                            summary=description[:200] + ('...' if len(description) > 200 else ''),
                            tags=['マーケティング'],
                            source=item.get('source', {}).get('name', 'Unknown'),
                            lang='ja'
                        )
                        articles.append(article)

        # 英語記事も少量取得
        en_queries = ['community marketing', 'influencer marketing strategy']

        for query in en_queries[:1]:
            params = {
                'q': query,
                'from': from_date,
                'language': 'en',
                'sortBy': 'relevancy',
                'pageSize': 10,
                'apiKey': NEWS_API_KEY
            }

            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('articles', [])[:5]:
                    article = Article(
                        title=item.get('title', ''),
                        url=item.get('url', ''),
                        summary=(item.get('description', '') or '')[:200] + '...',
                        tags=['marketing'],
                        source=item.get('source', {}).get('name', 'Unknown'),
                        lang='en'
                    )
                    articles.append(article)

    except Exception as e:
        print(f"Error searching web articles: {e}")

    print(f"Found {len(articles)} articles from News API")
    return articles


def is_valuable_article(article: Article) -> bool:
    """有益な記事かチェック"""
    title_lower = article.title.lower()
    summary_lower = (article.summary or '').lower()
    url_lower = article.url.lower()

    # 除外キーワード
    exclude_keywords = [
        'プレスリリース', 'ニュースリリース', 'press release',
        '開催のお知らせ', 'イベント開催', '講演会', '募集開始', '応募受付',
        '有料会員', '有料記事', '会員限定', 'subscription required',
        '/release/', '/pr/', 'prtimes.jp', 'atpress.ne.jp'
    ]

    for keyword in exclude_keywords:
        if keyword in title_lower or keyword in summary_lower or keyword in url_lower:
            return False

    # 日経クロストレンドは常にOK
    if article.source == '日経クロストレンド':
        return True

    # 有益キーワード
    valuable_keywords = [
        '分析', 'データ', '調査', '戦略', '事例', 'インタビュー', '解説', 'ノウハウ',
        'analysis', 'data', 'strategy', 'case study', 'interview'
    ]

    has_valuable = any(k in title_lower or k in summary_lower for k in valuable_keywords)
    return has_valuable or len(article.title) > 20


def calculate_article_score(article: Article, learning_data: Dict) -> float:
    """記事のスコアを計算"""
    score = 0.0
    prefs = learning_data.get('preferences', {})

    liked_sources = prefs.get('liked_sources', {})
    if article.source in liked_sources:
        score += liked_sources[article.source] * 2.0

    liked_tags = prefs.get('liked_tags', {})
    for tag in article.tags:
        if tag in liked_tags:
            score += liked_tags[tag] * 1.5

    return score


def filter_and_rank_articles(articles: List[Article], sent_hashes: set, learning_data: Dict) -> List[Article]:
    """記事をフィルタリング・ランキング"""
    # 既読・除外チェック
    filtered = [a for a in articles if a.hash not in sent_hashes and is_valuable_article(a)]

    # 重複URL除外
    seen_urls = set()
    unique = []
    for a in filtered:
        if a.url not in seen_urls:
            seen_urls.add(a.url)
            unique.append(a)

    # 日本語・英語に分類
    ja_articles = [a for a in unique if a.lang == 'ja']
    en_articles = [a for a in unique if a.lang == 'en']

    # スコアでソート
    ja_articles.sort(key=lambda x: (
        x.source != '日経クロストレンド',
        -calculate_article_score(x, learning_data)
    ))
    en_articles.sort(key=lambda x: -calculate_article_score(x, learning_data))

    # 日本語3件以上、英語2件以下
    ja_count = min(max(3, 5 - len(en_articles)), len(ja_articles))
    en_count = min(5 - ja_count, len(en_articles))

    selected = ja_articles[:ja_count] + en_articles[:en_count]

    # 不足分を補完
    if len(selected) < 5:
        remaining = [a for a in unique if a not in selected]
        remaining.sort(key=lambda x: -calculate_article_score(x, learning_data))
        selected.extend(remaining[:5 - len(selected)])

    return selected[:5]


def post_to_slack(message: str, article: Optional[Article] = None) -> str:
    """Slackに投稿"""
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

    if article:
        payload['metadata'] = {
            'event_type': 'daily_news_article',
            'event_payload': {'article': article.to_dict()}
        }

    response = requests.post(url, headers=headers, json=payload, timeout=10)

    if response.status_code == 200 and response.json().get('ok'):
        return response.json().get('ts', '')
    else:
        print(f"❌ Failed to post: {response.text}")
        return ''


def add_reaction(timestamp: str, emoji: str):
    """リアクション追加"""
    url = 'https://slack.com/api/reactions.add'
    headers = {
        'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type': 'application/json'
    }

    payload = {
        'channel': SLACK_CHANNEL,
        'timestamp': timestamp,
        'name': emoji
    }

    requests.post(url, headers=headers, json=payload, timeout=10)


def main():
    """メイン処理"""
    print("=== Daily News Collector Started ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # データ読み込み
    sent_hashes = load_sent_articles()
    learning_data = load_learning_data()
    print(f"Loaded {len(sent_hashes)} sent articles")

    # 記事収集
    all_articles = []
    all_articles.extend(search_nikkei_xtrend(days=3))
    all_articles.extend(search_web_articles(days=2))

    # フィルタリング
    selected = filter_and_rank_articles(all_articles, sent_hashes, learning_data)
    print(f"Selected {len(selected)} articles")

    if len(selected) == 0:
        msg = f"📰 *今日のおすすめ記事* ({datetime.now().strftime('%Y-%m-%d')})\n"
        msg += f"<@{SLACK_USER_ID}>\n\n今日は新しい記事が見つかりませんでした。"
        post_to_slack(msg)
        return

    # ヘッダー投稿
    header = f"📰 *今日のおすすめ記事* ({datetime.now().strftime('%Y-%m-%d')})\n"
    header += f"<@{SLACK_USER_ID}>\n\n良かった記事には👍リアクションをつけてください！"
    post_to_slack(header)
    print("✅ Posted header")

    time.sleep(1)

    # 個別記事投稿
    emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    for idx, article in enumerate(selected):
        emoji = emojis[idx]
        lang_flag = '🇯🇵' if article.lang == 'ja' else '🇺🇸'

        msg = f"{emoji} *{article.title}* {lang_flag}\n"
        msg += f"🔗 {article.url}\n"
        msg += f"📝 {article.summary}\n"
        msg += f"🏷️ {' '.join(['#' + t for t in article.tags])} | 📰 {article.source}"

        ts = post_to_slack(msg, article)

        if ts:
            print(f"✅ Posted article {idx+1}")
            time.sleep(0.3)
            add_reaction(ts, 'thumbsup')
            time.sleep(0.2)
            add_reaction(ts, 'thumbsdown')

        time.sleep(0.5)

    # 既読保存
    save_sent_articles([a.hash for a in selected])

    print("=== Finished ===")


if __name__ == '__main__':
    main()
