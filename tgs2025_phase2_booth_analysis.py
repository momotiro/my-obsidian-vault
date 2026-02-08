"""
TGS2025 UGC分析スクリプト
Phase 2: UGC投稿の抽出とブース別パフォーマンス分析
"""

import pandas as pd
import numpy as np
from collections import Counter
import sys
import io

# Windows console用のUTF-8出力設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 80)
print("TGS2025 UGC分析 - Phase 2: UGC抽出とブース別パフォーマンス")
print("=" * 80)

# データ読み込み
df = pd.read_csv(
    'csv.TGS2025_OR_TGS_2025_OR_東京ゲームショウ2025_OR_東京ゲームショウ_20 - Feb 8, 2026 - 1 54 00 AM.csv',
    encoding='utf-8-sig'
)

# 1. UGC投稿の定義と抽出
print("\n" + "=" * 80)
print("1. UGC投稿の抽出（Repost除外）")
print("=" * 80)

print("\n【Content Type別の投稿数】")
print(df['Content Type'].value_counts())

# Repostを除外してUGCを定義
df_ugc = df[df['Content Type'] != 'Repost'].copy()

print(f"\n✅ UGC投稿数（Repost除外後）: {len(df_ugc):,}")
print(f"   - Social Post: {len(df_ugc[df_ugc['Content Type'] == 'Social Post']):,}")
print(f"   - Reply: {len(df_ugc[df_ugc['Content Type'] == 'Reply']):,}")
print(f"   - Quote: {len(df_ugc[df_ugc['Content Type'] == 'Quote']):,}")

# 2. ブース/タイトル名の特定
print("\n" + "=" * 80)
print("2. ブース/タイトル名の特定（ハッシュタグベース）")
print("=" * 80)

# TGS汎用タグを除外したブース固有タグを抽出
exclude_tags = {
    'tgs2025', 'tgs', 'tgsコスプレ', 'tgs2025コスプレ', '東京ゲームショウ2025', '東京ゲームショウ',
    '東京ゲームショー2025', '東京ゲームショー', 'tokyogameshow', 'pr', 'amazonギフト券',
    'プレゼント', 'プレゼントキャンペーン', 'ゲーム', 'game', 'gaming'
}

def extract_booth_tags(hashtags_str):
    """ハッシュタグからブース固有タグを抽出"""
    if pd.isna(hashtags_str):
        return []

    tags = hashtags_str.split(';')
    tags = [tag.strip().lower().replace('#', '') for tag in tags if tag.strip()]

    # 汎用タグを除外
    specific_tags = [tag for tag in tags if tag not in exclude_tags]

    return specific_tags

df_ugc['booth_tags'] = df_ugc['ハッシュタグ'].apply(extract_booth_tags)

# 全ブースタグの集計
all_booth_tags = []
for tags in df_ugc['booth_tags']:
    all_booth_tags.extend(tags)

booth_tag_counts = Counter(all_booth_tags)

print(f"\n検出されたブース固有タグ数: {len(booth_tag_counts)}")
print(f"\n【Top 50 ブース固有ハッシュタグ】")
for i, (tag, count) in enumerate(booth_tag_counts.most_common(50), 1):
    print(f"{i:2d}. #{tag}: {count:,}回")

# 3. ブース別の投稿数集計
print("\n" + "=" * 80)
print("3. ブース別UGC投稿数ランキング")
print("=" * 80)

# 各投稿に主要ブースタグを割り当て（最も多く使われているタグ）
def assign_primary_booth(tags):
    """投稿に主要ブースタグを割り当て"""
    if not tags:
        return None

    # タグの出現頻度が高い順に優先
    tag_scores = [(tag, booth_tag_counts.get(tag, 0)) for tag in tags]
    tag_scores.sort(key=lambda x: x[1], reverse=True)

    return tag_scores[0][0] if tag_scores else None

df_ugc['primary_booth'] = df_ugc['booth_tags'].apply(assign_primary_booth)

# ブース別投稿数
booth_post_counts = df_ugc['primary_booth'].value_counts()

print(f"\n✅ ブースが特定できた投稿: {booth_post_counts.sum():,}")
print(f"❌ ブース不明の投稿: {df_ugc['primary_booth'].isna().sum():,}")

print(f"\n【Top 50 ブース別UGC投稿数ランキング】")
for i, (booth, count) in enumerate(booth_post_counts.head(50).items(), 1):
    print(f"{i:2d}. #{booth}: {count:,}投稿")

# 4. ブース別エンゲージメント分析
print("\n" + "=" * 80)
print("4. ブース別エンゲージメント分析")
print("=" * 80)

# ブースが特定できた投稿のみを対象
df_booth = df_ugc[df_ugc['primary_booth'].notna()].copy()

# エンゲージメント指標の集計
booth_stats = df_booth.groupby('primary_booth').agg({
    'ドキュメントID': 'count',  # 投稿数
    'いいね数': ['sum', 'mean', 'median'],
    'リプライ': ['sum', 'mean'],
    '再投稿': ['sum', 'mean'],
    'リーチ': ['sum', 'mean', 'median']
}).round(2)

booth_stats.columns = [
    '投稿数',
    'いいね総数', 'いいね平均', 'いいね中央値',
    'リプライ総数', 'リプライ平均',
    '再投稿総数', '再投稿平均',
    'リーチ総数', 'リーチ平均', 'リーチ中央値'
]

# 投稿数でソート
booth_stats = booth_stats.sort_values('投稿数', ascending=False)

print(f"\n【Top 30 ブース別パフォーマンス（投稿数順）】")
print("\n" + "-" * 120)
print(f"{'順位':<4} {'ブース名':<30} {'投稿数':>8} {'いいね総数':>10} {'いいね平均':>10} {'リーチ総数':>12} {'リーチ平均':>10}")
print("-" * 120)

for i, (booth, row) in enumerate(booth_stats.head(30).iterrows(), 1):
    booth_name = f"#{booth}"[:30]
    print(f"{i:<4} {booth_name:<30} {int(row['投稿数']):>8,} {int(row['いいね総数']):>10,} "
          f"{row['いいね平均']:>10.1f} {int(row['リーチ総数']):>12,} {row['リーチ平均']:>10.1f}")

# 5. エンゲージメント率ランキング（投稿数10以上）
print("\n" + "=" * 80)
print("5. エンゲージメント効率ランキング（投稿数10以上）")
print("=" * 80)

# 投稿数10以上のブースに絞る
booth_stats_min10 = booth_stats[booth_stats['投稿数'] >= 10].copy()

# エンゲージメント率を計算
booth_stats_min10['エンゲージメント率'] = (
    (booth_stats_min10['いいね総数'] + booth_stats_min10['再投稿総数'] + booth_stats_min10['リプライ総数'])
    / booth_stats_min10['投稿数']
).round(2)

# エンゲージメント率でソート
booth_stats_sorted_eng = booth_stats_min10.sort_values('エンゲージメント率', ascending=False)

print(f"\n【Top 30 エンゲージメント効率ランキング（投稿数10以上）】")
print("\n" + "-" * 120)
print(f"{'順位':<4} {'ブース名':<30} {'投稿数':>8} {'エンゲージメント率':>16} {'いいね平均':>10} {'再投稿平均':>10}")
print("-" * 120)

for i, (booth, row) in enumerate(booth_stats_sorted_eng.head(30).iterrows(), 1):
    booth_name = f"#{booth}"[:30]
    print(f"{i:<4} {booth_name:<30} {int(row['投稿数']):>8,} {row['エンゲージメント率']:>16.1f} "
          f"{row['いいね平均']:>10.1f} {row['再投稿平均']:>10.1f}")

# 6. データ保存
print("\n" + "=" * 80)
print("6. 分析結果の保存")
print("=" * 80)

# UGCデータ保存
df_ugc.to_csv('tgs2025_ugc_only.csv', index=False, encoding='utf-8-sig')
print("✅ UGCデータ保存: tgs2025_ugc_only.csv")

# ブース別統計保存
booth_stats_min10_sorted = booth_stats_min10.sort_values('投稿数', ascending=False)
booth_stats_min10_sorted.to_csv('tgs2025_booth_stats.csv', encoding='utf-8-sig')
print("✅ ブース別統計保存: tgs2025_booth_stats.csv")

print("\n" + "=" * 80)
print("Phase 2 完了")
print("=" * 80)
print(f"""
【サマリー】
- 総UGC投稿数（Repost除外）: {len(df_ugc):,}
- ブース特定済み投稿: {len(df_booth):,}
- 分析対象ブース数（投稿10以上）: {len(booth_stats_min10)}

【次のステップ】
→ Phase 3: 成功要因の定性・定量分析
""")
