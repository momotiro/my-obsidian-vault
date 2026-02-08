"""
TGS2025 UGC分析スクリプト - 改善版（世界標準手法）
Phase 0-5: 包括的分析フレームワーク
"""

import pandas as pd
import numpy as np
from collections import Counter
import sys
import io
import re
from datetime import datetime

# Windows console用のUTF-8出力設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 100)
print("TGS2025 UGC分析 - 改善版（世界標準手法適用）")
print("=" * 100)

# ファイル名
filename = 'newTGS2025_OR_TGS_2025_OR_東京ゲームショウ2025_OR_東京ゲームショウ_20 - Feb 8, 2026 - 3 33 58 PM.csv'

# データ読み込み（複数エンコーディング試行）
print("\n" + "=" * 100)
print("Phase 0: データ読み込みと前処理")
print("=" * 100)

encodings = ['utf-16', 'utf-16-le', 'utf-8-sig', 'utf-8', 'cp932', 'shift-jis']
df = None

for enc in encodings:
    try:
        print(f"\nエンコーディング {enc} で試行中...")
        df = pd.read_csv(filename, encoding=enc, sep='\t')  # タブ区切りの可能性
        print(f"✅ {enc} で読み込み成功！")
        break
    except Exception as e:
        print(f"❌ {enc} で失敗: {str(e)[:100]}")
        # カンマ区切りでも試行
        try:
            df = pd.read_csv(filename, encoding=enc, sep=',')
            print(f"✅ {enc} (カンマ区切り) で読み込み成功！")
            break
        except:
            continue

if df is None:
    print("\n❌ すべてのエンコーディングで読み込み失敗")
    sys.exit(1)

print(f"\n総レコード数: {len(df):,}")
print(f"カラム数: {len(df.columns)}")
print(f"\nカラム一覧:")
for i, col in enumerate(df.columns[:20], 1):
    print(f"{i:2d}. {col}")

# 基本統計
print(f"\n【Content Type分布】")
if 'Content Type' in df.columns:
    print(df['Content Type'].value_counts())
else:
    print("'Content Type'カラムが見つかりません")

# データの一部を確認
print(f"\n【データサンプル（最初の3件）】")
print(df.head(3).to_string())

# UGC定義（Repost除外）
if 'Content Type' in df.columns:
    df_ugc = df[df['Content Type'] != 'Repost'].copy()
    print(f"\n✅ UGC投稿数（Repost除外）: {len(df_ugc):,}")
    print(f"   - Social Post: {len(df_ugc[df_ugc['Content Type'] == 'Social Post']):,}")
    print(f"   - Reply: {len(df_ugc[df_ugc['Content Type'] == 'Reply']):,}")
    print(f"   - Quote: {len(df_ugc[df_ugc['Content Type'] == 'Quote']):,}")
else:
    df_ugc = df.copy()
    print(f"⚠️ 'Content Type'がないため、全データをUGCとして扱います: {len(df_ugc):,}")

# ===========================
# Phase 0: データ拡充
# ===========================
print("\n" + "=" * 100)
print("Phase 0: データ拡充（投稿者属性、時系列詳細）")
print("=" * 100)

# 0-1. 投稿者影響力の推定
print("\n【0-1. 投稿者影響力の推定】")

# リーチとエンゲージメントからフォロワー数を推定
if 'リーチ' in df_ugc.columns and 'いいね数' in df_ugc.columns:
    df_ugc['estimated_followers'] = df_ugc['リーチ'] / (df_ugc['いいね数'].fillna(1) + 1)

    def classify_influence(followers):
        """インフルエンサー階層分類"""
        if pd.isna(followers) or followers < 1000:
            return 'nano'  # < 1K
        elif followers < 10000:
            return 'micro'  # 1K-10K
        elif followers < 100000:
            return 'mid'  # 10K-100K
        elif followers < 1000000:
            return 'macro'  # 100K-1M
        else:
            return 'mega'  # > 1M

    df_ugc['influencer_tier'] = df_ugc['estimated_followers'].apply(classify_influence)

    print("\n【インフルエンサー階層分布】")
    print(df_ugc['influencer_tier'].value_counts())

    print("\n【階層別の平均リーチ】")
    tier_reach = df_ugc.groupby('influencer_tier')['リーチ'].mean().sort_values(ascending=False)
    for tier, reach in tier_reach.items():
        print(f"  {tier}: {reach:,.0f}")
else:
    print("⚠️ リーチ・いいね数カラムがないため、影響力推定をスキップ")

# 0-2. 時系列データの整備
print("\n【0-2. 時系列データの整備】")

if '日付' in df_ugc.columns and '時間' in df_ugc.columns:
    # 日時の結合
    df_ugc['datetime'] = pd.to_datetime(df_ugc['日付'] + ' ' + df_ugc['時間'], errors='coerce')
    df_ugc['date'] = pd.to_datetime(df_ugc['日付'], errors='coerce')
    df_ugc['hour'] = pd.to_datetime(df_ugc['時間'], format='%H:%M', errors='coerce').dt.hour
    df_ugc['day_of_week'] = df_ugc['date'].dt.day_name()

    # TGSイベント期間（2025/9/26-29と仮定）
    event_start = pd.to_datetime('2025-09-26')
    df_ugc['days_from_start'] = (df_ugc['date'] - event_start).dt.days

    print(f"\n【日付範囲】")
    print(f"  最早: {df_ugc['date'].min()}")
    print(f"  最遅: {df_ugc['date'].max()}")

    print(f"\n【曜日別投稿数】")
    print(df_ugc['day_of_week'].value_counts())

    print(f"\n【時間帯別投稿数（Top 10）】")
    print(df_ugc['hour'].value_counts().head(10))
else:
    print("⚠️ 日付・時間カラムがないため、時系列整備をスキップ")

# 0-3. ブース名・タイトル名の抽出
print("\n【0-3. ブース/タイトル名の特定】")

exclude_tags = {
    'tgs2025', 'tgs', 'tgsコスプレ', 'tgs2025コスプレ', '東京ゲームショウ2025', '東京ゲームショウ',
    '東京ゲームショー2025', '東京ゲームショー', 'tokyogameshow', 'tokyogameshow2025',
    'pr', 'amazonギフト券', 'プレゼント', 'プレゼントキャンペーン', 'ゲーム', 'game', 'gaming'
}

def extract_booth_tags(hashtags_str):
    """ハッシュタグからブース固有タグを抽出"""
    if pd.isna(hashtags_str):
        return []

    tags = str(hashtags_str).split(';')
    tags = [tag.strip().lower().replace('#', '') for tag in tags if tag.strip()]

    # 汎用タグを除外
    specific_tags = [tag for tag in tags if tag not in exclude_tags]

    return specific_tags

if 'ハッシュタグ' in df_ugc.columns:
    df_ugc['booth_tags'] = df_ugc['ハッシュタグ'].apply(extract_booth_tags)

    # 全ブースタグの集計
    all_booth_tags = []
    for tags in df_ugc['booth_tags']:
        all_booth_tags.extend(tags)

    booth_tag_counts = Counter(all_booth_tags)

    print(f"\n検出されたブース固有タグ数: {len(booth_tag_counts)}")
    print(f"\n【Top 30 ブース固有ハッシュタグ】")
    for i, (tag, count) in enumerate(booth_tag_counts.most_common(30), 1):
        print(f"{i:2d}. #{tag}: {count:,}回")

    # 主要ブースタグの割り当て
    def assign_primary_booth(tags):
        """投稿に主要ブースタグを割り当て"""
        if not tags:
            return None

        # タグの出現頻度が高い順に優先
        tag_scores = [(tag, booth_tag_counts.get(tag, 0)) for tag in tags]
        tag_scores.sort(key=lambda x: x[1], reverse=True)

        return tag_scores[0][0] if tag_scores else None

    df_ugc['primary_booth'] = df_ugc['booth_tags'].apply(assign_primary_booth)

    booth_post_counts = df_ugc['primary_booth'].value_counts()
    print(f"\n✅ ブースが特定できた投稿: {booth_post_counts.sum():,}")
    print(f"❌ ブース不明の投稿: {df_ugc['primary_booth'].isna().sum():,}")
else:
    print("⚠️ ハッシュタグカラムがないため、ブース抽出をスキップ")

# データ保存
print("\n【Phase 0 完了 - データ保存】")
output_file = 'tgs2025_ugc_enriched.csv'
df_ugc.to_csv(output_file, index=False, encoding='utf-8-sig')
print(f"✅ 拡充データ保存: {output_file}")

print("\n" + "=" * 100)
print("Phase 0 完了")
print("=" * 100)
print(f"""
【データ拡充サマリー】
- 総UGC投稿数: {len(df_ugc):,}
- インフルエンサー階層分類: {'✅ 完了' if 'influencer_tier' in df_ugc.columns else '❌ スキップ'}
- 時系列データ整備: {'✅ 完了' if 'datetime' in df_ugc.columns else '❌ スキップ'}
- ブース名特定: {'✅ 完了' if 'primary_booth' in df_ugc.columns else '❌ スキップ'}

【次のステップ】
→ tgs2025_phase1_descriptive.py で Phase 1（記述統計）を実行
""")
