"""
TGS2025 UGC分析スクリプト
Phase 3: 成功要因の定性・定量分析
"""

import pandas as pd
import numpy as np
from collections import Counter
import sys
import io
import re

# Windows console用のUTF-8出力設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 80)
print("TGS2025 UGC分析 - Phase 3: 成功要因の定性・定量分析")
print("=" * 80)

# データ読み込み
df_ugc = pd.read_csv('tgs2025_ugc_only.csv', encoding='utf-8-sig')
booth_stats = pd.read_csv('tgs2025_booth_stats.csv', encoding='utf-8-sig', index_col=0)

# 投稿数10以上のブースに絞る
booth_stats = booth_stats[booth_stats['投稿数'] >= 10]

print(f"\n分析対象: {len(booth_stats)}ブース（投稿数10以上）")

# 1. 成功ブースの特定
print("\n" + "=" * 80)
print("1. 成功ブースの特定（複合指標）")
print("=" * 80)

# 成功指標の定義
# - 主要指標: 投稿数（UGC創出量）
# - 副次指標: エンゲージメント効率

# 投稿数とエンゲージメント率でスコアリング
booth_stats['投稿数スコア'] = (booth_stats['投稿数'] - booth_stats['投稿数'].min()) / (booth_stats['投稿数'].max() - booth_stats['投稿数'].min())

# エンゲージメント率の計算（いいね+再投稿+リプライの合計/投稿数）
booth_stats['エンゲージメント率'] = (
    booth_stats['いいね総数'].fillna(0) +
    booth_stats['再投稿総数'].fillna(0) +
    booth_stats['リプライ総数'].fillna(0)
) / booth_stats['投稿数']

booth_stats['エンゲージメント率スコア'] = (
    (booth_stats['エンゲージメント率'] - booth_stats['エンゲージメント率'].min()) /
    (booth_stats['エンゲージメント率'].max() - booth_stats['エンゲージメント率'].min())
)

# 総合スコア（投稿数80%、エンゲージメント率20%）
booth_stats['総合スコア'] = booth_stats['投稿数スコア'] * 0.8 + booth_stats['エンゲージメント率スコア'] * 0.2
booth_stats_sorted = booth_stats.sort_values('総合スコア', ascending=False)

print(f"\n【総合ランキング Top 20】")
print("\n" + "-" * 140)
print(f"{'順位':<4} {'ブース名':<30} {'投稿数':>8} {'エンゲージメント率':>16} {'総合スコア':>12} {'分類':<20}")
print("-" * 140)

for i, (booth, row) in enumerate(booth_stats_sorted.head(20).iterrows(), 1):
    booth_name = f"#{booth}"[:30]
    category = "🏆成功" if i <= 10 else "✅良好"
    print(f"{i:<4} {booth_name:<30} {int(row['投稿数']):>8,} {row['エンゲージメント率']:>16.1f} "
          f"{row['総合スコア']:>12.3f} {category:<20}")

# 成功ブースと低パフォーマンスブースの定義
top_booths = booth_stats_sorted.head(10).index.tolist()
bottom_booths = booth_stats_sorted.tail(10).index.tolist()

print(f"\n✅ 成功ブース（Top 10）: {len(top_booths)}ブース")
print(f"❌ 低パフォーマンスブース（Bottom 10）: {len(bottom_booths)}ブース")

# 2. コンテンツ要素の分析
print("\n" + "=" * 80)
print("2. 成功要因の分析: コンテンツ要素")
print("=" * 80)

# ブースごとの投稿を抽出
df_ugc['primary_booth'] = df_ugc['primary_booth'].fillna('不明')
df_top = df_ugc[df_ugc['primary_booth'].isin(top_booths)].copy()
df_bottom = df_ugc[df_ugc['primary_booth'].isin(bottom_booths)].copy()

print(f"\n成功ブースの投稿数: {len(df_top)}")
print(f"低パフォーマンスブースの投稿数: {len(df_bottom)}")

# 2-1. メディアタイプ分析
def has_media(row):
    """画像・動画の有無"""
    if pd.notna(row['画像']):
        url = str(row['画像']).lower()
        if 'video' in url or '.mp4' in url:
            return 'video'
        elif 'photo' in url or '.jpg' in url or '.png' in url:
            return 'image'
    return 'text_only'

df_ugc['media_type'] = df_ugc.apply(has_media, axis=1)
df_top['media_type'] = df_top.apply(has_media, axis=1)
df_bottom['media_type'] = df_bottom.apply(has_media, axis=1)

print(f"\n【メディアタイプ比較】")
print(f"\n成功ブース:")
print(df_top['media_type'].value_counts(normalize=True) * 100)
print(f"\n低パフォーマンスブース:")
print(df_bottom['media_type'].value_counts(normalize=True) * 100)

# 2-2. ハッシュタグ戦略
def count_hashtags(hashtags_str):
    """ハッシュタグ数をカウント"""
    if pd.isna(hashtags_str):
        return 0
    return len([tag for tag in str(hashtags_str).split(';') if tag.strip()])

df_top['hashtag_count'] = df_top['ハッシュタグ'].apply(count_hashtags)
df_bottom['hashtag_count'] = df_bottom['ハッシュタグ'].apply(count_hashtags)

print(f"\n【ハッシュタグ数比較】")
print(f"成功ブース - 平均: {df_top['hashtag_count'].mean():.1f}個, 中央値: {df_top['hashtag_count'].median():.0f}個")
print(f"低パフォーマンスブース - 平均: {df_bottom['hashtag_count'].mean():.1f}個, 中央値: {df_bottom['hashtag_count'].median():.0f}個")

# 2-3. センチメント分析
print(f"\n【センチメント比較】")
print(f"\n成功ブース:")
print(df_top['センチメント'].value_counts(normalize=True) * 100)
print(f"\n低パフォーマンスブース:")
print(df_bottom['センチメント'].value_counts(normalize=True) * 100)

# 2-4. 投稿タイプ分析
print(f"\n【投稿タイプ比較】")
print(f"\n成功ブース:")
print(df_top['Content Type'].value_counts(normalize=True) * 100)
print(f"\n低パフォーマンスブース:")
print(df_bottom['Content Type'].value_counts(normalize=True) * 100)

# 3. 施策パターンの分析
print("\n" + "=" * 80)
print("3. 施策パターンの分析")
print("=" * 80)

# キーワードベースで施策タイプを推定
def classify_campaign_type(row):
    """投稿内容から施策タイプを分類"""
    title = str(row['タイトル']).lower() if pd.notna(row['タイトル']) else ''
    text = str(row['該当文章']).lower() if pd.notna(row['該当文章']) else ''
    content = title + ' ' + text

    campaign_types = []

    # キャンペーン系
    if any(word in content for word in ['プレゼント', 'ギフト', 'リポスト', 'フォロー', '抽選', '当選', 'キャンペーン']):
        campaign_types.append('キャンペーン')

    # 体験・試遊系
    if any(word in content for word in ['試遊', 'プレイ', '体験', '遊んだ', 'やってみた']):
        campaign_types.append('体験型')

    # ステージ・イベント系
    if any(word in content for word in ['ステージ', 'トークショー', 'ライブ', 'イベント', '登壇', '出演']):
        campaign_types.append('ステージ')

    # コスプレ・フォトスポット系
    if any(word in content for word in ['コスプレ', 'レイヤー', 'フォトスポット', '撮影', 'ブース', 'コス']):
        campaign_types.append('フォトスポット')

    # グッズ・ノベルティ系
    if any(word in content for word in ['グッズ', 'ノベルティ', 'ガチャ', '物販', 'グッズ販売']):
        campaign_types.append('グッズ')

    return campaign_types if campaign_types else ['その他']

df_top['campaign_types'] = df_top.apply(classify_campaign_type, axis=1)
df_bottom['campaign_types'] = df_bottom.apply(classify_campaign_type, axis=1)

# 施策タイプの集計
top_campaigns = []
for types in df_top['campaign_types']:
    top_campaigns.extend(types)

bottom_campaigns = []
for types in df_bottom['campaign_types']:
    bottom_campaigns.extend(types)

print(f"\n【施策タイプ比較】")
print(f"\n成功ブース:")
top_campaign_counts = Counter(top_campaigns)
for campaign, count in top_campaign_counts.most_common():
    print(f"  {campaign}: {count}回 ({count/len(df_top)*100:.1f}%)")

print(f"\n低パフォーマンスブース:")
bottom_campaign_counts = Counter(bottom_campaigns)
for campaign, count in bottom_campaign_counts.most_common():
    print(f"  {campaign}: {count}回 ({count/len(df_bottom)*100:.1f}%)")

# 4. タイミング分析
print("\n" + "=" * 80)
print("4. タイミング分析（開催日別）")
print("=" * 80)

df_top['日付'] = pd.to_datetime(df_top['日付'], format='%Y-%m-%d', errors='coerce')
df_bottom['日付'] = pd.to_datetime(df_bottom['日付'], format='%Y-%m-%d', errors='coerce')

print(f"\n【投稿タイミング比較】")
print(f"\n成功ブース - 日別投稿数:")
print(df_top['日付'].value_counts().sort_index().head(10))

print(f"\n低パフォーマンスブース - 日別投稿数:")
print(df_bottom['日付'].value_counts().sort_index().head(10))

# 5. ケーススタディ（成功事例）
print("\n" + "=" * 80)
print("5. 成功事例ケーススタディ（Top 5）")
print("=" * 80)

for i, booth in enumerate(top_booths[:5], 1):
    booth_df = df_ugc[df_ugc['primary_booth'] == booth].copy()
    booth_row = booth_stats.loc[booth]

    print(f"\n【第{i}位: #{booth}】")
    print(f"  - 投稿数: {int(booth_row['投稿数']):,}")
    print(f"  - エンゲージメント率: {booth_row['エンゲージメント率']:.1f}")
    print(f"  - いいね平均: {booth_row['いいね平均']:.1f}")
    print(f"  - リーチ総数: {int(booth_row['リーチ総数']):,}")

    # メディアタイプ
    booth_df['media_type_tmp'] = booth_df.apply(has_media, axis=1)
    media_dist = booth_df['media_type_tmp'].value_counts()
    print(f"  - メディア: {media_dist.to_dict()}")

    # 主な施策タイプ
    booth_df['campaign_types_tmp'] = booth_df.apply(classify_campaign_type, axis=1)
    campaigns = []
    for types in booth_df['campaign_types_tmp']:
        campaigns.extend(types)
    campaign_counts = Counter(campaigns)
    print(f"  - 施策: {dict(campaign_counts.most_common(3))}")

    # センチメント
    sentiment_dist = booth_df['センチメント'].value_counts()
    print(f"  - センチメント: {sentiment_dist.to_dict()}")

# 6. 分析結果の保存
print("\n" + "=" * 80)
print("6. 分析結果の保存")
print("=" * 80)

# 拡張統計の保存
booth_stats_extended = booth_stats_sorted.copy()
booth_stats_extended.to_csv('tgs2025_booth_stats_extended.csv', encoding='utf-8-sig')
print("✅ 拡張統計保存: tgs2025_booth_stats_extended.csv")

print("\n" + "=" * 80)
print("Phase 3 完了")
print("=" * 80)
print(f"""
【サマリー】
- 成功ブース（Top 10）特定完了
- コンテンツ要素の比較完了
- 施策パターンの抽出完了

【次のステップ】
→ Phase 4-5: 失敗パターン特定と方程式策定
""")
