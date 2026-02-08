"""
TGS2025 UGC分析スクリプト
Phase 1: データ理解・前処理
"""

import pandas as pd
import numpy as np
import re
from collections import Counter
import json
import sys
import io

# Windows console用のUTF-8出力設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ファイル読み込み
print("=" * 80)
print("TGS2025 UGC分析 - Phase 1: データ理解・前処理")
print("=" * 80)

df = pd.read_csv(
    'csv.TGS2025_OR_TGS_2025_OR_東京ゲームショウ2025_OR_東京ゲームショウ_20 - Feb 8, 2026 - 1 54 00 AM.csv',
    encoding='utf-8-sig'
)

print(f"\n総レコード数: {len(df):,}")
print(f"カラム数: {len(df.columns)}")

# 1. 投稿タイプの分類
print("\n" + "=" * 80)
print("1. 投稿タイプの分類")
print("=" * 80)

# Content Typeの分布
print("\n【Content Type分布】")
print(df['Content Type'].value_counts())

# RTの識別
df['is_retweet'] = df['タイトル'].fillna('').str.startswith('RT @')
print(f"\nリツイート数: {df['is_retweet'].sum():,}")
print(f"オリジナル投稿数: {(~df['is_retweet']).sum():,}")

# UGCの定義（オリジナル投稿のみ）
df_ugc = df[~df['is_retweet']].copy()
print(f"\n✅ UGC対象投稿数: {len(df_ugc):,}")

# 2. ブース名・企業名の抽出
print("\n" + "=" * 80)
print("2. ブース名・企業名の抽出")
print("=" * 80)

def extract_booth_info(row):
    """ハッシュタグ、メンション、本文からブース/企業名を抽出"""
    booth_candidates = []

    # ハッシュタグから抽出
    hashtags = str(row['ハッシュタグ']).split(';') if pd.notna(row['ハッシュタグ']) else []
    hashtags = [tag.strip().lower().replace('#', '') for tag in hashtags if tag.strip()]

    # TGS関連の汎用タグを除外
    exclude_tags = {
        'tgs2025', 'tgs', 'tgsコスプレ', '東京ゲームショウ2025', '東京ゲームショウ',
        '東京ゲームショー2025', '東京ゲームショー', 'tokyogameshow'
    }

    specific_tags = [tag for tag in hashtags if tag not in exclude_tags]
    booth_candidates.extend(specific_tags)

    # メンション（@ユーザー名）から抽出
    title = str(row['タイトル']) if pd.notna(row['タイトル']) else ''
    mentions = re.findall(r'@(\w+)', title)
    booth_candidates.extend([m.lower() for m in mentions])

    # ソース名（公式アカウント）
    source_name = str(row['筆者ハンドルネーム']).replace('@', '').lower() if pd.notna(row['筆者ハンドルネーム']) else ''
    if source_name:
        booth_candidates.append(source_name)

    return {
        'booth_tags': list(set(specific_tags)),
        'mentions': list(set(mentions)),
        'all_candidates': list(set(booth_candidates))
    }

print("ブース情報を抽出中...")
df_ugc['booth_info'] = df_ugc.apply(extract_booth_info, axis=1)
df_ugc['booth_tags'] = df_ugc['booth_info'].apply(lambda x: x['booth_tags'])
df_ugc['mentions'] = df_ugc['booth_info'].apply(lambda x: x['mentions'])

# 主要ブース候補の抽出（ハッシュタグベース）
all_booth_tags = []
for tags in df_ugc['booth_tags']:
    all_booth_tags.extend(tags)

booth_tag_counter = Counter(all_booth_tags)
print(f"\n【主要ブース候補（ハッシュタグベース）Top 30】")
for tag, count in booth_tag_counter.most_common(30):
    print(f"  #{tag}: {count:,}回")

# メンション（企業公式アカウント）の抽出
all_mentions = []
for mentions in df_ugc['mentions']:
    all_mentions.extend(mentions)

mention_counter = Counter(all_mentions)
print(f"\n【主要メンション（企業アカウント）Top 30】")
for mention, count in mention_counter.most_common(30):
    print(f"  @{mention}: {count:,}回")

# 3. データ品質チェック
print("\n" + "=" * 80)
print("3. データ品質チェック")
print("=" * 80)

# 欠損値確認
key_columns = ['いいね数', 'リプライ', '再投稿', 'リーチ', 'センチメント', 'ハッシュタグ']
print("\n【主要カラムの欠損率】")
for col in key_columns:
    missing_rate = df_ugc[col].isna().sum() / len(df_ugc) * 100
    print(f"  {col}: {missing_rate:.2f}%")

# エンゲージメント指標の分布
print("\n【エンゲージメント指標の統計】")
engagement_cols = ['いいね数', 'リプライ', '再投稿', 'リーチ']
print(df_ugc[engagement_cols].describe())

# 4. UGCデータの保存
print("\n" + "=" * 80)
print("4. クレンジング済みデータの保存")
print("=" * 80)

# booth_info列（dict型）は保存前に文字列化
df_ugc['booth_tags_str'] = df_ugc['booth_tags'].apply(lambda x: ';'.join(x) if x else '')
df_ugc['mentions_str'] = df_ugc['mentions'].apply(lambda x: ';'.join(x) if x else '')

# 保存
output_file = 'tgs2025_ugc_cleaned.csv'
df_ugc.to_csv(output_file, index=False, encoding='utf-8-sig')
print(f"✅ クレンジング済みデータを保存: {output_file}")

# 5. サマリー統計
print("\n" + "=" * 80)
print("5. Phase 1 サマリー")
print("=" * 80)

print(f"""
✅ Phase 1 完了

【データ概要】
- 総投稿数: {len(df):,}
- UGC投稿数（RT除外）: {len(df_ugc):,}
- RT数: {df['is_retweet'].sum():,}

【ブース候補数】
- ハッシュタグベース: {len(booth_tag_counter)}種類
- メンションベース: {len(mention_counter)}種類

【次のステップ】
→ Phase 2: ブース別パフォーマンス分析
""")
