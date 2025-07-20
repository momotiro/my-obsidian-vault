import os
import requests
from datetime import datetime, timedelta

# --- 設定 ---
API_KEY = os.getenv('YOUTUBE_API_KEY', 'YOUR_API_KEY_HERE')  # ←APIキーをここに記載 or 環境変数で指定
CHANNEL_ID = 'UCn2lQGnoTQq5pT4cQpG4h0w'  # ZETA DIVISION公式YouTubeチャンネルID
START_DATE = '2024-09-26T00:00:00Z'
END_DATE = '2024-09-29T23:59:59Z'
MAX_RESULTS = 50  # 1回のAPI呼び出しで取得する動画数

# --- YouTube APIエンドポイント ---
SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'


def get_video_ids():
    video_ids = []
    next_page_token = ''
    while True:
        params = {
            'key': API_KEY,
            'channelId': CHANNEL_ID,
            'part': 'id',
            'order': 'date',
            'publishedAfter': START_DATE,
            'publishedBefore': END_DATE,
            'maxResults': MAX_RESULTS,
            'type': 'video',
            'pageToken': next_page_token
        }
        resp = requests.get(SEARCH_URL, params=params)
        data = resp.json()
        for item in data.get('items', []):
            video_ids.append(item['id']['videoId'])
        next_page_token = data.get('nextPageToken', '')
        if not next_page_token:
            break
    return video_ids


def get_video_details(video_ids):
    results = []
    for i in range(0, len(video_ids), 50):
        ids = ','.join(video_ids[i:i+50])
        params = {
            'key': API_KEY,
            'id': ids,
            'part': 'snippet,liveStreamingDetails,statistics,contentDetails'
        }
        resp = requests.get(VIDEOS_URL, params=params)
        data = resp.json()
        for item in data.get('items', []):
            title = item['snippet']['title']
            published_at = item['snippet']['publishedAt'][:10]
            url = f"https://www.youtube.com/watch?v={item['id']}"
            view_count = item.get('statistics', {}).get('viewCount', 'N/A')
            duration = item.get('contentDetails', {}).get('duration', 'N/A')
            # ISO 8601 duration → hh:mm:ss 変換
            duration_str = iso8601_duration_to_str(duration)
            results.append({
                'title': title,
                'date': published_at,
                'url': url,
                'views': view_count,
                'duration': duration_str
            })
    return results


def iso8601_duration_to_str(duration):
    # 例: PT2H15M30S → 02:15:30
    if not duration or not duration.startswith('PT'):
        return duration
    h, m, s = 0, 0, 0
    duration = duration[2:]
    if 'H' in duration:
        h, duration = duration.split('H')
        h = int(h)
    if 'M' in duration:
        m, duration = duration.split('M')
        m = int(m)
    if 'S' in duration:
        s = int(duration.replace('S', ''))
        s = int(s)
    return f"{h:02}:{m:02}:{s:02}"


def main():
    print(f"# TGS2024期間中 ZETA DIVISION配信アーカイブ一覧\n")
    video_ids = get_video_ids()
    if not video_ids:
        print('該当期間の動画が見つかりませんでした。')
        return
    details = get_video_details(video_ids)
    for v in details:
        print(f"- タイトル: {v['title']}")
        print(f"  - 日付: {v['date']}")
        print(f"  - URL: {v['url']}")
        print(f"  - 視聴数: {v['views']}回")
        print(f"  - 配信時間: {v['duration']}")
        print()

if __name__ == '__main__':
    main() 