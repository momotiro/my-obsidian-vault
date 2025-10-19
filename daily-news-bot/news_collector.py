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
    """日経クロストレンドのRSSフィードから記事を取得"""
    articles = []

    try:
        import feedparser
        from datetime import datetime, timedelta

        # 日経クロストレンドのRSSフィード
        rss_urls = [
            'https://xtrend.nikkei.com/rss/atcl/new.rdf',  # 新着記事
            'https://xtrend.nikkei.com/rss/atcl/feature.rdf',  # 特集
        ]

        cutoff_date = datetime.now() - timedelta(days=days)

        for rss_url in rss_urls:
            try:
                feed = feedparser.parse(rss_url)

                for entry in feed.entries[:20]:  # 最新20件
                    # 公開日をチェック
                    published = entry.get('published_parsed')
                    if published:
                        pub_date = datetime(*published[:6])
                        if pub_date < cutoff_date:
                            continue

                    title = entry.get('title', '')
                    url = entry.get('link', '')
                    summary = entry.get('summary', '')

                    # HTMLタグを除去
                    import re
                    summary = re.sub(r'<[^>]+>', '', summary)

                    # 日経クロストレンドの記事は全て取得（フィルタリングは後で行う）
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
                print(f"Error fetching RSS {rss_url}: {e}")
                continue

        print(f"Found {len(articles)} articles from Nikkei X-Trend RSS")

    except Exception as e:
        print(f"Error in search_nikkei_xtrend: {e}")

    return articles


def search_web_articles(keywords: List[str], days: int = 2, max_results: int = 20) -> List[Article]:
    """Web検索APIを使って記事を検索"""
    articles = []

    NEWS_API_KEY = os.environ.get('NEWS_API_KEY')

    if not NEWS_API_KEY:
        print("Warning: NEWS_API_KEY not set")
        return articles

    try:
        from_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        url = 'https://newsapi.org/v2/everything'

        # 日本語ドメインを優先的に検索
        ja_keywords = [
            'マーケティング AND (コミュニティ OR SNS OR インフルエンサー OR AI)',
            'デジタルマーケティング',
            'コミュニティ 戦略'
        ]

        ja_domains = 'markezine.jp OR itmedia.co.jp OR business.nikkei.com OR xtrend.nikkei.com'

        for keyword in ja_keywords:
            params = {
                'q': f'{keyword} AND ({ja_domains})',
                'from': from_date,
                'sortBy': 'publishedAt',
                'pageSize': 15,
                'apiKey': NEWS_API_KEY
            }

            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('articles', []):
                    title = item.get('title', '')
                    description = item.get('description', '')

                    # 日本語が含まれているか判定
                    is_japanese = any('\u3040' <= char <= '\u30ff' or '\u4e00' <= char <= '\u9faf'
                                     for char in (title + description))

                    if is_japanese:  # 日本語記事のみ追加
                        article = Article(
                            title=title,
                            url=item.get('url', ''),
                            summary=(description or '')[:200] + ('...' if description and len(description) > 200 else ''),
                            tags=[keyword.split(' AND ')[0]],  # 最初のキーワードのみ
                            source=item.get('source', {}).get('name', 'Unknown'),
                            lang='ja'
                        )
                        articles.append(article)

        # 英語キーワードでも検索（少量）
        en_keywords = ['community marketing', 'influencer marketing', 'AI marketing']

        for keyword in en_keywords[:2]:
            params = {
                'q': keyword,
                'language': 'en',
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
                        summary=(item.get('description', '') or '')[:200] + '...',
                        tags=[keyword],
                        source=item.get('source', {}).get('name', 'Unknown'),
                        lang='en'
                    )
                    articles.append(article)

    except Exception as e:
        print(f"Error searching web articles: {e}")

    return articles


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
            import base64
            decoded = base64.b64decode(content).decode('utf-8')
            return json.loads(decoded)
        else:
            return {"preferences": {"liked_sources": {}, "liked_tags": {}, "liked_articles": []}}
    except Exception as e:
        print(f"Error loading learning data: {e}")
        return {"preferences": {"liked_sources": {}, "liked_tags": {}, "liked_articles": []}}


def calculate_article_score(article: Article, learning_data: Dict) -> float:
    """学習データを元に記事のスコアを計算"""
    score = 0.0
    prefs = learning_data.get('preferences', {})

    # ソースの好みスコア
    liked_sources = prefs.get('liked_sources', {})
    if article.source in liked_sources:
        score += liked_sources[article.source] * 2.0

    # タグの好みスコア
    liked_tags = prefs.get('liked_tags', {})
    for tag in article.tags:
        if tag in liked_tags:
            score += liked_tags[tag] * 1.5

    return score


def is_valuable_article(article: Article) -> bool:
    """有益な記事かどうかを判定（ニュースリリース・イベント告知を除外）"""
    title_lower = article.title.lower()
    summary_lower = (article.summary or '').lower()
    url_lower = article.url.lower()

    # 除外キーワード
    exclude_keywords = [
        'プレスリリース', 'ニュースリリース', 'press release',
        '開催のお知らせ', '開催決定', 'イベント開催', '講演会',
        '募集開始', '応募受付', '参加者募集', '受講生募集',
        '発売開始', '新発売', '販売開始',
        '有料会員', '有料記事', '会員限定', '有料プラン',
        'subscription required', 'premium content', 'members only',
        '/release/', '/pr/', '/press/',
        'prtimes.jp', 'atpress.ne.jp', 'dreamnews.jp', 'jiji.com/jc/article'
    ]

    # タイトル・要約・URLに除外キーワードが含まれているかチェック
    for keyword in exclude_keywords:
        if keyword in title_lower or keyword in summary_lower or keyword in url_lower:
            return False

    # 有益な記事の特徴（これらが含まれていると加点）
    valuable_keywords = [
        '分析', 'データ', '調査', '研究', 'トレンド',
        '戦略', '事例', 'ケーススタディ', 'インタビュー',
        '解説', 'ノウハウ', '手法', '最新動向', 'ポイント',
        'analysis', 'data', 'research', 'strategy', 'case study', 'interview'
    ]

    has_valuable = any(keyword in title_lower or keyword in summary_lower
                       for keyword in valuable_keywords)

    # 日経クロストレンドは常に有益
    if article.source == '日経クロストレンド':
        return True

    # 除外キーワードがなく、有益なキーワードが含まれている場合はOK
    return has_valuable or len(title_lower) > 20  # 短すぎるタイトルは除外


def filter_and_rank_articles(articles: List[Article], sent_hashes: set, target_count: int = 5) -> List[Article]:
    """記事をフィルタリング・ランキングして上位を返す"""
    # 既読を除外
    filtered = [a for a in articles if a.hash not in sent_hashes]

    # ニュースリリース・イベント告知を除外
    filtered = [a for a in filtered if is_valuable_article(a)]

    # 重複URL除外
    seen_urls = set()
    unique_articles = []
    for article in filtered:
        if article.url not in seen_urls:
            seen_urls.add(article.url)
            unique_articles.append(article)

    # 学習データを読み込んでスコア計算
    learning_data = load_learning_data()

    # 日本語と英語に分ける
    ja_articles = [a for a in unique_articles if a.lang == 'ja']
    en_articles = [a for a in unique_articles if a.lang == 'en']

    # スコアでソート（日経クロストレンド優先 + 学習スコア）
    ja_articles.sort(key=lambda x: (
        x.source != '日経クロストレンド',
        -calculate_article_score(x, learning_data)
    ))

    en_articles.sort(key=lambda x: -calculate_article_score(x, learning_data))

    # 日本語3記事 + 英語2記事を選定
    ja_count = min(max(3, target_count - 2), len(ja_articles))  # 最低3記事
    en_count = min(target_count - ja_count, len(en_articles))

    selected = ja_articles[:ja_count] + en_articles[:en_count]

    # 足りない場合は残りを追加
    if len(selected) < target_count:
        remaining = [a for a in unique_articles if a not in selected]
        remaining.sort(key=lambda x: -calculate_article_score(x, learning_data))
        selected.extend(remaining[:target_count - len(selected)])

    return selected[:target_count]


def format_header_message() -> str:
    """ヘッダーメッセージを生成"""
    today = datetime.now().strftime('%Y-%m-%d')
    return f"📰 *今日のおすすめ記事* ({today})\n<@{SLACK_USER_ID}>\n\n良かった記事には👍リアクションをつけてください！"


def format_article_message(article: Article, index: int) -> str:
    """個別記事のメッセージを整形"""
    emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    emoji = emojis[index] if index < len(emojis) else f"{index+1}."
    lang_flag = '🇯🇵' if article.lang == 'ja' else '🇺🇸'

    message = f"{emoji} *{article.title}* {lang_flag}\n"
    message += f"🔗 {article.url}\n"
    message += f"📝 {article.summary}\n"
    message += f"🏷️ {' '.join(['#' + tag for tag in article.tags])} | 📰 {article.source}"

    return message


def add_reaction(channel: str, timestamp: str, emoji: str) -> bool:
    """メッセージにリアクションを追加"""
    url = 'https://slack.com/api/reactions.add'
    headers = {
        'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type': 'application/json'
    }

    payload = {
        'channel': channel,
        'timestamp': timestamp,
        'name': emoji
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200 and response.json().get('ok'):
        return True
    else:
        # 既にリアクション済みの場合はエラーにならない
        error = response.json().get('error', '')
        if error != 'already_reacted':
            print(f"⚠️ Failed to add reaction {emoji}: {error}")
        return False


def post_to_slack(message: str, article: Article = None) -> str:
    """Slackにメッセージを投稿し、記事情報をメタデータとして保存"""
    url = 'https://slack.com/api/chat.postMessage'
    headers = {
        'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
        'Content-Type': 'application/json'
    }

    # 記事情報をメタデータとして保存
    metadata = None
    if article:
        metadata = {
            'event_type': 'daily_news_article',
            'event_payload': {
                'article': article.to_dict()
            }
        }

    payload = {
        'channel': SLACK_CHANNEL,
        'text': message,
        'unfurl_links': False,
        'unfurl_media': False
    }

    if metadata:
        payload['metadata'] = metadata

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200 and response.json().get('ok'):
        return response.json().get('ts', '')
    else:
        print(f"❌ Failed to post to Slack: {response.text}")
        return ''


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

    # 日経クロストレンド（最優先）
    nikkei_articles = search_nikkei_xtrend(keywords, days=3)
    all_articles.extend(nikkei_articles)

    # Web検索
    web_articles = search_web_articles(keywords, days=2, max_results=30)
    all_articles.extend(web_articles)
    print(f"Found {len(nikkei_articles)} from Nikkei X-Trend, {len(web_articles)} from web search")

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

    # Slackに個別投稿
    import time

    # ヘッダーメッセージ（メンション付き）
    header_message = format_header_message()
    post_to_slack(header_message)
    print("✅ Posted header message")

    time.sleep(1)  # レート制限対策

    # 各記事を個別に投稿
    for idx, article in enumerate(selected_articles):
        article_message = format_article_message(article, idx)
        message_ts = post_to_slack(article_message, article)

        if message_ts:
            print(f"✅ Posted article {idx+1}: {article.title[:50]}...")

            # デフォルトリアクションを追加
            time.sleep(0.3)
            add_reaction(SLACK_CHANNEL, message_ts, 'thumbsup')
            time.sleep(0.2)
            add_reaction(SLACK_CHANNEL, message_ts, 'thumbsdown')
        else:
            print(f"❌ Failed to post article {idx+1}")

        time.sleep(0.5)  # レート制限対策

    # 既読リストに保存
    article_hashes = [a.hash for a in selected_articles]
    save_sent_articles(article_hashes)

    print(f"Posted {len(selected_articles)} articles")
    print("=== Daily News Collector Finished ===")


if __name__ == '__main__':
    main()
