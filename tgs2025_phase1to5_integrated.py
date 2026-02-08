"""
TGS2025 UGC分析スクリプト - Phase 1-5 統合版
世界標準の分析手法を適用
"""

import pandas as pd
import numpy as np
from collections import Counter
import sys
import io

# Windows console用のUTF-8出力設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 100)
print("TGS2025 UGC分析 - Phase 1-5 統合分析")
print("=" * 100)

# 拡充済みデータの読み込み
print("\n拡充済みデータを読み込み中...")
df_ugc = pd.read_csv('tgs2025_ugc_enriched.csv', encoding='utf-8-sig')
print(f"総UGC投稿数: {len(df_ugc):,}")

# ===========================
# Phase 1: 記述統計
# ===========================
print("\n" + "=" * 100)
print("Phase 1: 記述統計（Descriptive Analytics）")
print("=" * 100)

# 1-1. ブース別基本統計
print("\n【1-1. ブース別基本統計】")

df_booth = df_ugc[df_ugc['primary_booth'].notna()].copy()
print(f"ブース特定済み投稿: {len(df_booth):,}")

booth_stats = df_booth.groupby('primary_booth').agg({
    'ドキュメントID': 'count',
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

# 投稿数10以上のブースに絞る
booth_stats_min10 = booth_stats[booth_stats['投稿数'] >= 10].copy()

print(f"\n分析対象ブース数（投稿10以上）: {len(booth_stats_min10)}")

print(f"\n【Top 20 ブース別パフォーマンス（投稿数順）】")
print("\n" + "-" * 120)
print(f"{'順位':<4} {'ブース名':<30} {'投稿数':>8} {'いいね総数':>10} {'いいね平均':>10} {'リーチ総数':>12}")
print("-" * 120)

for i, (booth, row) in enumerate(booth_stats.head(20).iterrows(), 1):
    booth_name = f"#{booth}"[:30]
    print(f"{i:<4} {booth_name:<30} {int(row['投稿数']):>8,} {int(row['いいね総数']):>10,} "
          f"{row['いいね平均']:>10.1f} {int(row['リーチ総数']):>12,}")

# 1-2. インフルエンサー階層別分析
print("\n【1-2. インフルエンサー階層別分析】")

if 'influencer_tier' in df_ugc.columns:
    tier_stats = df_ugc.groupby('influencer_tier').agg({
        'ドキュメントID': 'count',
        'リーチ': 'mean',
        'いいね数': 'mean'
    }).round(0)

    tier_stats.columns = ['投稿数', '平均リーチ', '平均いいね数']
    tier_stats = tier_stats.sort_values('平均リーチ', ascending=False)

    print(tier_stats)

# 1-3. 時間帯別分析
print("\n【1-3. 時間帯別投稿パターン】")

if 'hour' in df_ugc.columns:
    hourly_posts = df_ugc['hour'].value_counts().sort_index()
    print(f"\n時間帯別投稿数:")
    for hour, count in hourly_posts.items():
        bar = '■' * int(count / 100)
        print(f"{hour:2d}時: {count:5,}件 {bar}")

# ===========================
# Phase 2: 探索的分析
# ===========================
print("\n" + "=" * 100)
print("Phase 2: 探索的分析（Exploratory Analytics）")
print("=" * 100)

# 2-1. ブース別インフルエンサーミックス
print("\n【2-1. ブース別インフルエンサーミックス（Top 10ブース）】")

if 'influencer_tier' in df_booth.columns:
    top10_booths = booth_stats.head(10).index.tolist()

    for booth in top10_booths[:5]:  # Top 5のみ表示
        booth_data = df_booth[df_booth['primary_booth'] == booth]
        tier_dist = booth_data['influencer_tier'].value_counts()

        print(f"\n#{booth}:")
        for tier, count in tier_dist.items():
            pct = count / len(booth_data) * 100
            print(f"  {tier:8s}: {count:4d}件 ({pct:5.1f}%)")

# 2-2. コンテンツタイプ分析
print("\n【2-2. ブース別コンテンツタイプ（Top 10ブース）】")

if 'Content Type' in df_booth.columns:
    for booth in top10_booths[:5]:
        booth_data = df_booth[df_booth['primary_booth'] == booth]
        type_dist = booth_data['Content Type'].value_counts()

        print(f"\n#{booth}:")
        for ctype, count in type_dist.items():
            pct = count / len(booth_data) * 100
            print(f"  {ctype:15s}: {count:4d}件 ({pct:5.1f}%)")

# ===========================
# Phase 3: 因果推論（簡易版）
# ===========================
print("\n" + "=" * 100)
print("Phase 3: 因果推論（Marketing Mix Modeling 簡易版）")
print("=" * 100)

# 3-1. 施策タイプの分類
print("\n【3-1. 施策タイプ分析】")

def classify_campaign_type(row):
    """投稿内容から施策タイプを分類"""
    title = str(row['タイトル']).lower() if pd.notna(row['タイトル']) else ''
    text = str(row['該当文章']).lower() if pd.notna(row['該当文章']) else ''
    keyword = str(row['キーワード']).lower() if pd.notna(row['キーワード']) else ''
    content = title + ' ' + text + ' ' + keyword

    campaign_types = []

    # キャンペーン系
    if any(word in content for word in ['プレゼント', 'ギフト', 'リポスト', 'フォロー', '抽選', '当選', 'キャンペーン']):
        campaign_types.append('キャンペーン')

    # 体験・試遊系
    if any(word in content for word in ['試遊', 'プレイ', '体験', '遊んだ', 'やってみた', 'プレイアブル']):
        campaign_types.append('体験型')

    # ステージ・イベント系
    if any(word in content for word in ['ステージ', 'トークショー', 'ライブ', 'イベント', '登壇', '出演']):
        campaign_types.append('ステージ')

    # コスプレ・フォトスポット系
    if any(word in content for word in ['コスプレ', 'レイヤー', 'フォトスポット', '撮影', 'ブース', 'コス']):
        campaign_types.append('フォトスポット')

    # グッズ・ノベルティ系
    if any(word in content for word in ['グッズ', 'ノベルティ', 'ガチャ', '物販', 'グッズ販売', 'もらった', 'ゲット']):
        campaign_types.append('グッズ')

    return campaign_types if campaign_types else ['その他']

print("施策タイプ分類中...")
df_booth['campaign_types'] = df_booth.apply(classify_campaign_type, axis=1)

# ブース別施策ミックス
print("\n【ブース別施策ミックス（Top 10ブース）】")

for booth in top10_booths[:10]:
    booth_data = df_booth[df_booth['primary_booth'] == booth]

    all_campaigns = []
    for types in booth_data['campaign_types']:
        all_campaigns.extend(types)

    campaign_counts = Counter(all_campaigns)
    total = len(booth_data)

    print(f"\n#{booth} ({total}投稿):")
    for campaign, count in campaign_counts.most_common(5):
        pct = count / total * 100
        print(f"  {campaign:15s}: {count:4d}回 ({pct:5.1f}%)")

# 3-2. 施策とパフォーマンスの相関
print("\n【3-2. 施策別の平均パフォーマンス】")

# 各施策タイプの平均投稿数・エンゲージメント
campaign_performance = {}

for campaign_type in ['キャンペーン', '体験型', 'ステージ', 'フォトスポット', 'グッズ']:
    # その施策を実施しているブース
    booths_with_campaign = []

    for booth in booth_stats_min10.index:
        booth_data = df_booth[df_booth['primary_booth'] == booth]
        all_campaigns = []
        for types in booth_data['campaign_types']:
            all_campaigns.extend(types)

        if campaign_type in all_campaigns:
            booths_with_campaign.append(booth)

    if booths_with_campaign:
        avg_posts = booth_stats_min10.loc[booths_with_campaign, '投稿数'].mean()
        avg_likes = booth_stats_min10.loc[booths_with_campaign, 'いいね平均'].mean()

        campaign_performance[campaign_type] = {
            'ブース数': len(booths_with_campaign),
            '平均投稿数': avg_posts,
            '平均いいね数': avg_likes
        }

print(f"\n{'施策タイプ':<15} {'ブース数':>8} {'平均投稿数':>12} {'平均いいね数':>14}")
print("-" * 55)
for campaign, perf in sorted(campaign_performance.items(), key=lambda x: x[1]['平均投稿数'], reverse=True):
    print(f"{campaign:<15} {perf['ブース数']:>8} {perf['平均投稿数']:>12.0f} {perf['平均いいね数']:>14.1f}")

# ===========================
# Phase 4: 予測モデル（簡易版）
# ===========================
print("\n" + "=" * 100)
print("Phase 4: 予測分析（相関分析ベース）")
print("=" * 100)

# 4-1. 特徴量エンジニアリング
print("\n【4-1. ブース別特徴量の作成】")

# 各ブースの施策割合を計算
for booth in booth_stats_min10.index:
    booth_data = df_booth[df_booth['primary_booth'] == booth]
    total_posts = len(booth_data)

    all_campaigns = []
    for types in booth_data['campaign_types']:
        all_campaigns.extend(types)

    campaign_counts = Counter(all_campaigns)

    booth_stats_min10.loc[booth, 'キャンペーン割合'] = campaign_counts.get('キャンペーン', 0) / total_posts
    booth_stats_min10.loc[booth, '体験型割合'] = campaign_counts.get('体験型', 0) / total_posts
    booth_stats_min10.loc[booth, 'ステージ割合'] = campaign_counts.get('ステージ', 0) / total_posts
    booth_stats_min10.loc[booth, 'フォトスポット割合'] = campaign_counts.get('フォトスポット', 0) / total_posts
    booth_stats_min10.loc[booth, 'グッズ割合'] = campaign_counts.get('グッズ', 0) / total_posts

# 4-2. 相関分析
print("\n【4-2. 施策割合と投稿数の相関】")

features = ['キャンペーン割合', '体験型割合', 'ステージ割合', 'フォトスポット割合', 'グッズ割合']
correlations = {}

for feature in features:
    corr = booth_stats_min10[[feature, '投稿数']].corr().iloc[0, 1]
    correlations[feature] = corr

print(f"\n{'施策':<20} {'投稿数との相関':>15}")
print("-" * 40)
for feature, corr in sorted(correlations.items(), key=lambda x: abs(x[1]), reverse=True):
    direction = "正の相関" if corr > 0 else "負の相関"
    print(f"{feature:<20} {corr:>15.3f} ({direction})")

# ===========================
# Phase 5: 最適化・シミュレーション
# ===========================
print("\n" + "=" * 100)
print("Phase 5: TGS2026への施策提言")
print("=" * 100)

# 5-1. 成功ブースの特定
booth_stats_min10['エンゲージメント率'] = (
    booth_stats_min10['いいね総数'].fillna(0) +
    booth_stats_min10['再投稿総数'].fillna(0) +
    booth_stats_min10['リプライ総数'].fillna(0)
) / booth_stats_min10['投稿数']

booth_stats_min10['投稿数スコア'] = (
    (booth_stats_min10['投稿数'] - booth_stats_min10['投稿数'].min()) /
    (booth_stats_min10['投稿数'].max() - booth_stats_min10['投稿数'].min())
)

booth_stats_min10['エンゲージメント率スコア'] = (
    (booth_stats_min10['エンゲージメント率'] - booth_stats_min10['エンゲージメント率'].min()) /
    (booth_stats_min10['エンゲージメント率'].max() - booth_stats_min10['エンゲージメント率'].min())
)

booth_stats_min10['総合スコア'] = booth_stats_min10['投稿数スコア'] * 0.8 + booth_stats_min10['エンゲージメント率スコア'] * 0.2

booth_stats_sorted = booth_stats_min10.sort_values('総合スコア', ascending=False)

print("\n【総合ランキング Top 20】")
print("\n" + "-" * 120)
print(f"{'順位':<4} {'ブース名':<30} {'投稿数':>8} {'エンゲージメント率':>16} {'総合スコア':>12}")
print("-" * 120)

for i, (booth, row) in enumerate(booth_stats_sorted.head(20).iterrows(), 1):
    booth_name = f"#{booth}"[:30]
    print(f"{i:<4} {booth_name:<30} {int(row['投稿数']):>8,} {row['エンゲージメント率']:>16.1f} {row['総合スコア']:>12.3f}")

# 5-2. 成功の方程式
top10 = booth_stats_sorted.head(10)

print("\n" + "=" * 100)
print("【TGS2026への成功の方程式】")
print("=" * 100)

print(f"""
✅ 投稿数目標: {top10['投稿数'].mean():.0f}投稿以上
✅ エンゲージメント率目標: {top10['エンゲージメント率'].mean():.1f}以上
✅ 推奨施策ミックス:
   - キャンペーン: {top10['キャンペーン割合'].mean()*100:.0f}%
   - 体験型: {top10['体験型割合'].mean()*100:.0f}%
   - グッズ: {top10['グッズ割合'].mean()*100:.0f}%
   - フォトスポット: {top10['フォトスポット割合'].mean()*100:.0f}%
   - ステージ: {top10['ステージ割合'].mean()*100:.0f}%
""")

# データ保存
print("\n【最終レポート保存】")
booth_stats_sorted.to_csv('tgs2025_final_analysis_report.csv', encoding='utf-8-sig')
print("✅ 最終分析レポート保存: tgs2025_final_analysis_report.csv")

print("\n" + "=" * 100)
print("全分析完了！")
print("=" * 100)
