#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily News Bot - Article Collector and Slack Poster
Collects Japanese articles from RSS feeds and posts to Slack
"""

import json
import hashlib
import re
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
import feedparser


class Article:
    """記事データクラス"""
    def __init__(self, title: str, url: str, summary: str, source: str, published: Optional[datetime] = None):
        self.title = title
        self.url = url
        self.summary = summary
        self.source = source
        self.published = published
        self.tags = self._extract_tags()
        self.score = 0.0

    def _extract_tags(self) -> List[str]:
        """記事からタグを抽出"""
        tags = []
        text = (self.title + " " + self.summary).lower()

        tag_keywords = {
            "AI": ["ai", "人工知能", "機械学習", "生成ai", "chatgpt"],
            "マーケティング": ["マーケティング", "広告", "プロモーション"],
            "SNS": ["sns", "twitter", "instagram", "tiktok", "facebook", "x"],
            "コミュニティ": ["コミュニティ", "ユーザー", "ファン"],
            "データ分析": ["データ", "分析", "調査", "統計"],
            "戦略": ["戦略", "施策", "手法"],
            "事例": ["事例", "ケーススタディ", "インタビュー"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in text for kw in keywords):
                tags.append(tag)

        return tags if tags else ["その他"]

    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "title": self.title,
            "url": self.url,
            "summary": self.summary,
            "source": self.source,
            "tags": self.tags,
            "published": self.published.isoformat() if self.published else None
        }


class NewsCollector:
    """ニュース収集クラス"""

    RSS_FEEDS = {
        "日経クロストレンド": [
            "https://xtrend.nikkei.com/rss/atcl/new.rdf",
            "https://xtrend.nikkei.com/rss/atcl/feature.rdf"
        ],
        "MarkeZine": [
            "https://markezine.jp/rss/new/20/index.xml"
        ],
        "ITmedia マーケティング": [
            "https://marketing.itmedia.co.jp/mm/rss/news.xml"
        ],
        "日経ビジネス": [
            "https://business.nikkei.com/rss/nb.rdf"
        ],
        "CNET Japan": [
            "https://japan.cnet.com/rss/index.rdf"
        ]
    }

    EXCLUDE_KEYWORDS = [
        "有料会員", "会員限定", "有料記事", "プレスリリース", "ニュースリリース",
        "開催のお知らせ", "イベント開催", "講演会", "参加者募集", "発売開始", "新発売"
    ]

    EXCLUDE_DOMAINS = ["prtimes.jp", "atpress.ne.jp", "pr-today.net"]

    PRIORITY_KEYWORDS = [
        "分析", "データ", "調査", "研究", "トレンド",
        "戦略", "事例", "ケーススタディ", "インタビュー",
        "解説", "ノウハウ", "手法", "最新動向"
    ]

    def __init__(self):
        self.sent_articles: set = set()
        self.learning_data: Dict = {}
        self.load_data()

    def load_data(self):
        """既読記事と学習データを読み込み"""
        try:
            with open('sent_articles.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.sent_articles = set(data.get('articles', []))
        except FileNotFoundError:
            self.sent_articles = set()

        try:
            with open('learning_data.json', 'r', encoding='utf-8') as f:
                self.learning_data = json.load(f)
        except FileNotFoundError:
            self.learning_data = {"preferences": {"liked_sources": {}, "liked_tags": {}}}

    def save_sent_articles(self):
        """既読記事を保存（最新1000件）"""
        articles_list = list(self.sent_articles)[-1000:]
        with open('sent_articles.json', 'w', encoding='utf-8') as f:
            json.dump({"articles": articles_list, "last_updated": datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)

    @staticmethod
    def clean_html(text: str) -> str:
        """HTMLタグを除去"""
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @staticmethod
    def url_hash(url: str) -> str:
        """URLをMD5ハッシュ化"""
        return hashlib.md5(url.encode()).hexdigest()

    def fetch_rss_feed(self, url: str, source: str) -> List[Article]:
        """RSSフィードから記事を取得"""
        articles = []
        cutoff_date = datetime.now() - timedelta(days=3)

        try:
            print(f"  Fetching from {source}: {url}")
            feed = feedparser.parse(url)

            if not feed.entries:
                print(f"  Warning: No entries found in {source}")
                return articles

            for entry in feed.entries:
                try:
                    title = entry.get('title', '').strip()
                    link = entry.get('link', '').strip()
                    summary = entry.get('summary', '') or entry.get('description', '')
                    summary = self.clean_html(summary)

                    if not title or not link:
                        continue

                    # 日付フィルタリング
                    published = None
                    pub_parsed = entry.get('published_parsed') or entry.get('updated_parsed')
                    if pub_parsed:
                        try:
                            published = datetime(*pub_parsed[:6])
                            if published < cutoff_date:
                                continue
                        except (TypeError, ValueError):
                            pass

                    # 重複チェック
                    if self.url_hash(link) in self.sent_articles:
                        continue

                    # 除外キーワードチェック
                    text = (title + " " + summary).lower()
                    if any(kw in text for kw in self.EXCLUDE_KEYWORDS):
                        continue

                    # 除外ドメインチェック
                    if any(domain in link for domain in self.EXCLUDE_DOMAINS):
                        continue

                    # 要約を200文字以内に制限
                    if len(summary) > 200:
                        summary = summary[:197] + "..."

                    article = Article(title, link, summary, source, published)
                    articles.append(article)

                except Exception as e:
                    print(f"  Error processing entry: {e}")
                    continue

            print(f"  Found {len(articles)} valid articles from {source}")

        except Exception as e:
            print(f"  Error fetching {source}: {e}")

        return articles

    def collect_articles(self) -> List[Article]:
        """全RSSフィードから記事を収集"""
        all_articles = []

        print("Collecting articles from RSS feeds...")
        for source, feed_urls in self.RSS_FEEDS.items():
            for feed_url in feed_urls:
                articles = self.fetch_rss_feed(feed_url, source)
                all_articles.extend(articles)
                time.sleep(0.5)  # レート制限対策

        # URL重複除去
        seen_urls = set()
        unique_articles = []
        for article in all_articles:
            if article.url not in seen_urls:
                seen_urls.add(article.url)
                unique_articles.append(article)

        print(f"Total unique articles collected: {len(unique_articles)}")
        return unique_articles

    def calculate_score(self, article: Article) -> float:
        """記事のスコアを計算"""
        score = 0.0

        # 日経クロストレンドを最優先
        if article.source == "日経クロストレンド":
            score += 100.0

        # 学習データによる加点
        prefs = self.learning_data.get('preferences', {})
        liked_sources = prefs.get('liked_sources', {})
        if article.source in liked_sources:
            score += liked_sources[article.source] * 2.0

        liked_tags = prefs.get('liked_tags', {})
        for tag in article.tags:
            if tag in liked_tags:
                score += liked_tags[tag] * 1.5

        # 優先キーワードによる加点
        text = (article.title + " " + article.summary).lower()
        for keyword in self.PRIORITY_KEYWORDS:
            if keyword in text:
                score += 5.0

        return score

    def select_top_articles(self, articles: List[Article], count: int = 5) -> List[Article]:
        """上位記事を選定"""
        for article in articles:
            article.score = self.calculate_score(article)

        sorted_articles = sorted(articles, key=lambda x: x.score, reverse=True)
        return sorted_articles[:count]


class SlackPoster:
    """Slack投稿クラス"""

    NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]

    def __init__(self, bot_token: str, channel: str = "news"):
        self.bot_token = bot_token
        self.channel = channel
        self.base_url = "https://slack.com/api"

    def post_message(self, text: str, metadata: Optional[Dict] = None) -> Optional[str]:
        """Slackにメッセージを投稿"""
        url = f"{self.base_url}/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "channel": self.channel,
            "text": text,
            "unfurl_links": False,
            "unfurl_media": False

        }

        if metadata:
            payload["metadata"] = metadata

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('ok'):
                return data.get('ts')
            else:
                print(f"Slack API error: {data.get('error')}")
                return None

        except Exception as e:
            print(f"Error posting message: {e}")
            return None

    def add_reaction(self, timestamp: str, emoji: str):
        """リアクションを追加"""
        url = f"{self.base_url}/reactions.add"
        headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "channel": self.channel,
            "timestamp": timestamp,
            "name": emoji
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            time.sleep(0.3)  # レート制限対策
        except Exception as e:
            print(f"Error adding reaction: {e}")

    def post_daily_news(self, articles: List[Article]):
        """毎日のニュースを投稿"""
        today = datetime.now().strftime("%Y-%m-%d")

        # ヘッダー投稿（メンション付き）
        header = f"📰 今日のおすすめ記事 ({today}) <@U05A1BUDW02>\n良かった記事には👍リアクションをつけてください！"
        print(f"Posting header: {header}")
        self.post_message(header)
        time.sleep(1)

        # 各記事を投稿
        for i, article in enumerate(articles):
            emoji_num = self.NUMBER_EMOJIS[i]
            tags_str = " ".join([f"#{tag}" for tag in article.tags])

            message = (
                f"{emoji_num} {article.title}\n"
                f"🇯🇵 🔗 {article.url}\n"
                f"📝 {article.summary}\n"
                f"🏷️ {tags_str} | 📰 {article.source}"
            )

            metadata = {
                "event_type": "daily_news_article",
                "event_payload": {
                    "url": article.url,
                    "source": article.source,
                    "tags": article.tags
                }
            }

            print(f"Posting article {i+1}: {article.title[:50]}...")
            ts = self.post_message(message, metadata)

            if ts:
                self.add_reaction(ts, "thumbsup")
                self.add_reaction(ts, "thumbsdown")

            time.sleep(1)


def main():
    """メイン処理"""
    import os

    # 環境変数チェック
    slack_token = os.getenv('SLACK_BOT_TOKEN')
    if not slack_token:
        print("Error: SLACK_BOT_TOKEN not set")
        return

    print("=== Daily News Bot Started ===")
    print(f"Time: {datetime.now().isoformat()}")

    # 記事収集
    collector = NewsCollector()
    articles = collector.collect_articles()

    if not articles:
        print("No articles found. Exiting.")
        return

    # 上位5記事を選定
    top_articles = collector.select_top_articles(articles, count=5)

    print(f"\nSelected top {len(top_articles)} articles:")
    for i, article in enumerate(top_articles, 1):
        print(f"{i}. [{article.source}] {article.title} (score: {article.score:.2f})")

    # Slackに投稿
    poster = SlackPoster(slack_token)
    poster.post_daily_news(top_articles)

    # 既読記事を更新
    for article in top_articles:
        collector.sent_articles.add(collector.url_hash(article.url))

    collector.save_sent_articles()

    print("\n=== Daily News Bot Completed ===")


if __name__ == "__main__":
    main()
