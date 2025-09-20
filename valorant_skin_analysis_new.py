#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VALORANT スキンアンケート分析ツール
自由回答形式のスキンデータを分類分けして統計を取る
"""

import re
from collections import defaultdict, Counter
import json
import os

def load_skin_data(file_path):
    """スキンデータを読み込む"""
    responses = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if line and line.startswith('|') and line.endswith('|') and line != '|' and '---' not in line:
                # | 内容 | の形式から内容部分を抽出
                response = line.strip('|').strip()
                if response and response != '':  # 空でない回答のみ
                    responses.append({
                        'line_number': line_num,
                        'original': response,
                        'normalized': response.lower()
                    })
    return responses

def create_classification_rules():
    """分類ルールを定義する"""

    # ベースとなるスキン名の正規化マップ
    base_rules = {
        # Champions系
        'Champions2021': ['champions2021', 'champion2021', 'champions 2021', 'champion 2021', 'チャンピオンズ2021', 'チャンピオン2021', 'チャンピョンズ2021', 'champioms2021', 'valorant champions 2021', 'champions 224 phantom'],
        'Champions2022': ['champions2022', 'champion2022', 'champions 2022', 'champion 2022', 'チャンピオンズ2022', 'チャンピオン2022', 'チャンピョンズ2022', 'champions2022ファントム', 'champions 2022 ファントム'],
        'Champions2023': ['champions2023', 'champion2023', 'champions 2023', 'champion 2023', 'チャンピオンズ2023', 'チャンピオン2023', 'チャンピョンズ2023', 'チャンピオンヴァンダル2023', 'champions 2023 vandal', 'チャンピオンズ2023ヴァンダル'],
        'Champions2024': ['champions2024', 'champion2024', 'champions 2024', 'champion 2024', 'チャンピオンズ2024', 'チャンピオン2024', 'チャンピョンズ2024', 'チャンピオンズ2024ファントム', 'チャンピオン2024ファントム'],
        'Champions2025': ['champions2025', 'champion2025', 'champions 2025', 'champion 2025', 'チャンピオンズ2025', 'チャンピオン2025', 'チャンピョンズ2025', 'チャンピオンシップ2025', '2025チャンピオン'],

        # カオス系
        'カオス': ['カオス', 'chaos', 'カオス1.0', 'カオス2.0', 'カオスヴァンダル', 'カオスシリーズ', 'カオス　カオス2.0', 'カオス？'],
        'プレリュード・トゥ・カオス': [
            'プレリュード・トゥ・カオス', 'プレリュードトゥカオス', 'プレリュード・トュー・カオス',
            'プレリュードカオス', 'プレリュード・トゥー・カオス', 'プレリュード・トゥ・カオス1.0',
            'prelude to chaos', 'プレリュートカオス', 'プレデュードカオス', 'プリリュード・トゥ・カオ',
            'プレリュード・トウー・カオス', 'プレリュード･トゥー･カオス', 'プレリュード·トゥー·カオス',
            'プレリュードオブカオス', 'プレリュードテゥーカオス', 'プレドゥード•トゥー•カオス',
            'プレリュード•トゥー•カオス', 'プリュレードカオス', 'プレリュード・トゥー・カオスヴァンダル',
            'カオストゥプレリュード1.0', 'プレリュード・トゥ・カオスヴァンダル', 'プレデュードオブカオス',
            'プレリュード・トゥー・カオス 1.0（初期）', 'プレリュード・トゥー・カオスのヴァンダル',
            'プレリュード・トュー・カオス', 'プレリュード・トゥ・カオス（現状1.0）オニ',
            'プレリュード･トゥー･カオス', 'プレリュードテゥーカオス', 'プレリュード・トウー・カオス',
            'プレリュード·トゥー·カオス', 'プレリュードオブカオス', 'プレリュードトゥーカオス',
            'プレリュードトゥカオス', 'プレリュードトゥーカオス', 'プレリュードトゥカオス',
            'プレリュードカオス', 'プレドゥード•トゥー•カオス', 'カオスプレリュード', 'カオスプレデュード',
            'プレリュードトゥカオスヴァンダル', 'プレリュード・トゥー・カオスヴァンダル', 'プレリュードトゥーカオス',
            'プレリュード・トゥー・カオス  ヴァンダル', 'プリリュード・トゥ・カオ', 'プレリュード・トゥ・カオス1.0',
            'プレリュード・トゥ・カオス（現状1.0）', 'プレデュードカオス', 'プレリュードカオス'
        ],

        # プライム系
        'プライム': ['プライム', 'prime', 'プライム1.0', 'プライム2.0', 'プライムシリーズ！', 'プライムスキン(オレンジ)', 'プライムヴァンダル'],
        'プライモーディアム': [
            'プライモーディアム', 'プリーモーディアム', 'プライマーディアム', 'プライモーディア',
            'プライムモーディアム', 'プライモオーディアム', 'プライモーディアム1.0', 'プライモーディアム2.0',
            'プライムオーディアム', 'プライモーディア厶', 'プライモーディアムヴァンダル', 'プライモーディアムヴァンダル(青色)',
            'プライモーディアル', 'プライムオーディアム', 'プライムモーディアム', 'プライモオーディアム',
            'プライモーディアム！', 'プライモーディアム！プライムも好きネプチューンも', 'プライモーディアムです！',
            'プライモオーディアムヴァンダル', 'プライモーディアム(青)'
        ],

        # ガイアズ系
        'ガイアズ・ヴェンジェンス': [
            'ガイアズ・ヴェンジェンス', 'ガイアズヴェンジェンス', 'ガイアズベンジェンス', 'ガイアスヴェンジェンス',
            'ガイアズ・ヴェンジェンス1.0', 'ガイアズ・ヴェンジェンス2.0', 'ガイアスヴァンダル', 'ガイアズヴァンダル',
            'ガイアズ・ヴェンジェンス ヴァンダル', 'ガイアズ・ヴェンジェンス　ヴァンダル',
            'ガイアズ・ヴェンジェンスヴァンダル', 'ガイアズヴェンジェンス ヴァンダル',
            'ガイアズヴェンジェンスヴァンダル', 'ガイアズベンジェンスヴァンダル',
            'ガイアスヴェンジェンス', 'ガイアズヴェンジェンス？', 'ガイアズヴェンジェンス1.0',
            'ガイアズベンジェンスヴァンダル', 'ガイアズ・ヴェンジェンスヴァンダル'
        ],
        'ガイアズ': ['ガイアズ', 'ガイアス', 'ガイアズ1.0', 'ガイア', 'ガイアス1', 'ガイアズ1', 'ガイアズ（青）', 'ガイアズ1 (ヴァンダル)', 'ガイアズシリーズ'],

        # オニ系
        'オニ': ['オニ', '鬼', 'オニ1.0', 'オニ2.0', '鬼1.0', '鬼2.0', 'オニシリーズ', '鬼ファントム', '鬼ファントム、黒波ヴァンダル', 'オニ 2.0', 'オニファントムの緑', 'オニ、オニ2.0'],

        # ミニマ系
        'ミニマ': ['ミニマ', 'minima', 'ミニマ1.0', 'ミニマ2.0', 'ミニマシリーズ', 'すべてのミニマ', 'ミ ニ マ', '圧倒的にミニマ', 'ミニマ(2,0は含まず)', 'ミニマ、ミニマ2.0', 'ミニマです！！！！！', 'ミニマ(シェリフ)', 'ミニマシェリフ'],

        # クロナミ系
        'クロナミ': ['クロナミ', 'chronami', 'クロナミホワイト', 'クロナミヴァンダル', 'クロナミヴァンダルの紫', 'クロナミ(ヴァンダル)', 'クロナミ！！！！！！'],

        # エヴォリ系
        'エヴォリ・ドリームウィングス': [
            'エヴォリ・ドリームウィングス', 'エヴォリドリームウィングス', 'エヴォリ・ドリームウィング',
            'エヴォリドリームウィング', 'エヴォリー', 'エヴォリ', 'ドリームウィングス', 'エヴォリドリーム',
            'エヴォリ•ドリームウィングス', 'エヴォリシリーズ', 'エヴォリ・ドリームウイングス',
            'エヴォリドリームウィング', 'エヴォリ•ドリームウィングス', 'ドリームウィングスヴァンダル'
        ],

        # RGX系
        'RGX': ['rgx', 'rgx1.0', 'rgx2.0', 'rgx 11z pro', 'rgx11zpro', 'rgx 11z pro 3.0', 'rgxシリーズ'],

        # リコン系
        'リコン': ['リコン', 'recon', 'リコンシリーズ', 'リコンファントム'],

        # ネプチューン系
        'ネプチューン': ['ネプチューン', 'neptune', 'ネプチューンシリーズ', 'ネプチューンヴァンダル', 'ネプチューンシリーズ（初期も2.0も）'],

        # イオン系
        'イオン': ['イオン', 'ion', 'イオン2.0', 'イオンシェリフ', 'イオンの緑', 'イオン(初代、2.0共に)', 'イオン、イオン2.0'],

        # サクラ系
        'サクラ': ['サクラ', 'sakura', 'サクラシリーズ'],

        # ゼロファング系
        'ゼロファング': ['ゼロファング', 'zerofang', 'ゼロファングです！', 'ゼロファングが大好きです！'],

        # グリッチポップ系
        'グリッチポップ': ['グリッチポップ', 'glitchpop', 'グリッチポップ2.0', 'グリッチポップシリーズ', 'グリポ1.0', 'グリッジポップ', 'グリッチポップ2.0ヴァンダル'],

        # フォーセイクン系
        'フォーセイクン': ['フォーセイクン', 'forsaken', 'フォーセイクンヴァンダル', 'フォーセイクンヴァンダル（黒色）', 'フォーセイクンリチュアルブレイド'],

        # その他の人気スキン（データからより詳細に）
        'スペクトラム': ['スペクトラム', 'spectrum', 'スペクトラムシリーズ'],
        'アラクシス': ['アラクシス', 'araxys', 'アラクシス1.0', 'アラクシス2.0', 'アラクシス（紫）', 'アラクシス[1.0の方]', 'アラクシスヴァンダル'],
        'ネオフロンティア': ['ネオフロンティア', 'neo frontier', 'neofrontier', 'ネオフロンティア！！！！', 'ネオフロンティアシェリフ'],
        'ミストブルーム': ['ミストブルーム', 'mistbloom'],
        'シンギュラリティ': ['シンギュラリティ', 'シンギュラリティー', 'シンギュラリティ2.0', 'シンギュラリティー2.0', 'singularity', 'シンギュラリティー　ヴァンダル'],
        'ダイバージェンス': ['ダイバージェンス', 'divergence', 'ダイバージェンスヴァンダル', 'ダイバージェンス ヴァンダル'],
        'ノクターナム': ['ノクターナム', 'nocturnum', 'ノクターナムファントム'],
        'ヘリックス': ['ヘリックス', 'helix', 'ヘリックスファントム(紫)'],
        'ソヴリン': ['ソヴリン', 'ソブリン', 'sovereign', 'ソヴリン2.0', 'ソヴリン(全種類)'],
        'リーヴァー': ['リーヴァー', 'リーヴァ', 'reaver', 'リーヴァー1.0', 'リーヴァー2.0', 'リーヴァ1.0', 'リーヴァー、白基調'],
        'バブルガム': ['バブルガム', 'bubblegum', 'バブルガム デスウィッシュ', 'バブルガムデスウィッシュ', 'バブルガムスキン', 'バブルガム　デスウィッシュ'],
        'フェーズガード': ['フェーズガード', 'phaseguard', 'フェーズガードヴァンダル', 'フェーズガードゴースト'],
        'オリジン': ['オリジン', 'origin'],
        'ワンダースタリオン': ['ワンダースタリオン', 'wonder stallion', 'ワンダーズリオン', 'ワンダースタリオンハンマー', 'ワンダースタリオンヴァンダル'],
        'ブラストX': ['ブラストx', 'blast x', 'ブラストX…', 'ブラストXファントム'],
        'エルダーフレイム': ['エルダーフレイム', 'elderflame', 'エルダーフレイムダガー', 'エルダーフレイムオペレーター'],
        'プロトコル': ['プロトコル', 'protocol', 'プロトコル781-a', 'プロトコル 781-a', 'プロトコル781-A'],
        'アルティチュード': ['アルティチュード', 'altitude', 'アルティチュード シェリフ'],
        'ARCANE': ['arcane', 'アーケイン', 'アークレイン', 'アーケイン2.0', 'アーケイン', 'arcane シーズン2 コレクターズ'],
        'メイジパンク': ['メイジパンク', 'magepunk', 'メイジパンク2.0', 'メイジパンク3.0', 'メイジパンク、メイジパンク2.0', 'メイジパンク全般', 'メイジパンク、メイジパンク2.0、メイジパンク3.0'],
        'クライオステイシス': ['クライオステイシス', 'cryostasis', 'クライオステイシスヴァンダル'],
        'インペリウム': ['インペリウム', 'imperium', 'インぺリウム', 'インペリウムヴァンダル'],
        'クロノヴォイド': ['クロノヴォイド', 'chronovoid', 'クロノヴォイドヴァンダル', 'クロノヴォイド　レベル3'],
        'センチネルオブライト': ['センチネルオブライト', 'sentinels of light', 'センチネルオブライト2.0'],
        'レディアントエンターテインメントシステム': [
            'レディアントエンターテインメントシステム', 'レディアント・エンターテインメント・システム',
            'レディアントエンターシステム', 'radiant entertainment system', 'レディアント・エンターテイメント・システム'
        ],
        'オーバードライブ': ['オーバードライブ', 'overdrive'],
        'ヴァリアントヒーロー': ['ヴァリアントヒーロー', 'variant hero'],
        'コンバットクラフト': ['コンバットクラフト', 'combat craft'],
        'インファントリー': ['インファントリー', 'infantry'],
        'グラビテーショナルウラニウムニューロブラスター': [
            'グラビテーショナルウラニウムニューロブラスター', 'グラビテーショナル・ウラニウム・ニューロブラスター',
            'グラビテーショナル・ウラニウム・ニューロブラスター'
        ],
        'チタンメイル': ['チタンメイル', 'titanmail'],
        'サイラックス': ['サイラックス', 'cyrax', 'サイラックスシリーズ'],
        'エゴ': ['エゴ', 'ego', 'エゴヴァンダル'],
        'EX.O': ['ex.o', 'ex-o', 'exo', 'ex.0', 'ex0', 'exe'],
        'イグナイト': ['イグナイト', 'ignite', 'イグナイトフィン', 'イグナイトフィン(紫)'],
        'アパーチャー': ['アパーチャー', 'aperture'],
        'アルティザン': ['アルティザン', 'artisan'],
        'テザードレルム': ['テザードレルム', 'tethered realm'],
        'ルイネーション': ['ルイネーション', 'ruination'],
        'K/TAC': ['k/tac', 'ktac'],
        'スプライン': ['スプライン', 'spline', 'スプラインファントム'],
        'ドゥームブリンガー': ['ドゥームブリンガー', 'ドューイムブリンガー', 'ドゥームブリンガーのオーディンの青', 'ドュームブリンガー'],
        'スマイト': ['スマイト', 'smite', 'スマイト2.0', 'スマイト、スマイト2.0'],
        'プリズム': ['プリズム', 'prism', 'プリズムii'],
        'オブシディアナ': ['オブシディアナ', 'obsidiana'],
        'エイモンディア': ['エイモンディア', 'aimondia', 'エイモンディアヴァンダル'],
        'VALORANT GO': ['valorant go', 'valorant.go', 'valorant go!', 'valorant.go 3.0'],
        'レディアントクライシス': ['レディアントクライシス', 'レディアントクライシス001', 'radiant crisis'],
        'アビサル': ['アビサル', 'abyssal'],
        'ラッシュ': ['ラッシュ', 'rush'],
        'ボルト': ['ボルト', 'volt', 'ボルトファントム'],
        'ホライズン': ['ホライズン', 'horizon'],
        'X.O': ['x.o', 'xo'],
        'ルナ': ['ルナ', 'luna'],
        'トランジション': ['トランジション', 'transition'],
        'ソウルストライフ': ['ソウルストライフ', 'soulstrife'],
        'イリディアンソーン': ['イリディアンソーン', 'iridian thorn'],
        'ライカンズベイン': ['ライカンズベイン', 'lycans bane'],
        'エンデヴァー': ['エンデヴァー', 'endeavor'],
        'ヌンカ・オルヴィダドス': ['ヌンカ・オルヴィダドス', 'nunca olvidados'],
        'ウェイストランド': ['ウェイストランド', 'wasteland'],
        'ゼノハンター': ['ゼノハンター', 'xenohunter'],
        'アリストクラット': ['アリストクラット', 'aristocrat'],
        'ミスメイカー': ['ミスメイカー', 'miss maker'],
        'スターリットオデッセイ': ['スターリットオデッセイ', 'starlit odyssey'],
        'ブラックマーケット': ['ブラックマーケット', 'black market'],
        'コウハクマツバ': ['コウハクマツバ', 'kouhaku matsuba'],
        'ファイアー／アームクラシック': ['ファイアー／アームクラシック', 'fire/arm classic'],
        'センセーション': ['センセーション', 'sensation'],
        'シルヴァヌス': ['シルヴァヌス', 'silvanus'],
        'スノーフォール': ['スノーフォール', 'snowfall'],
        'スプラッシュX': ['スプラッシュx', 'splash x'],
        'クロシオ': ['クロシオ', 'kurosio'],
        'キルジョイシャーティー': ['キルジョイシャーティー'],
        'アルティザン': ['アルティザン', 'artisan', 'アルティザン'],
        '黒波': ['黒波']
    }

    # 特殊な処理が必要なキーワード
    special_rules = {
        'デフォルト': ['デフォルト', '初期スキン', '初期', '初期以外。'],
        '特になし': ['特になし', '特にない', 'た', '猫のやつ！', 'かわいいやつ'],
        'ZETAスキン': ['zetaスキン！'],
        'Champions全般': ['champions', 'champion', 'チャンピオン', 'チャンピオンズ', 'チャンピオンシリーズ', 'チャンピオンズスキン', 'チャンピオンスキン', 'champions', 'チャンピオンシップ', 'チャンピオン全般'],
        'ガイアズその他': ['ガイアズ？', 'ガイアスヴェンジェンス', 'ガイアズヴェンジェンス？'],
        '複数選択': ['カオス、バブルガム、見た目だけならシンギュラリティ', 'カオス、ミストブルーム', 'プライモーディアム！プライムも好きネプチューンも']
    }

    return base_rules, special_rules

def normalize_response(response, base_rules, special_rules):
    """回答を正規化して分類する"""
    response_lower = response.lower()

    # 特殊ルールを先にチェック
    for canonical, variants in special_rules.items():
        for variant in variants:
            if variant.lower() in response_lower:
                return canonical, variant

    # ベースルールでチェック（より長いマッチを優先）
    best_match = None
    best_variant = None
    best_length = 0

    for canonical, variants in base_rules.items():
        for variant in variants:
            if variant.lower() in response_lower:
                if len(variant) > best_length:  # より長いマッチを優先
                    best_match = canonical
                    best_variant = variant
                    best_length = len(variant)

    if best_match:
        return best_match, best_variant

    # どのルールにも該当しない場合は元の回答をそのまま
    return response, response

def analyze_skin_data(file_path):
    """スキンデータを分析する"""

    print("スキンデータを読み込み中...")
    responses = load_skin_data(file_path)
    print(f"総回答数: {len(responses)}")

    print("分類ルールを作成中...")
    base_rules, special_rules = create_classification_rules()

    print("回答を分類中...")
    classified_data = []
    classification_log = defaultdict(list)

    for response_data in responses:
        original = response_data['original']
        canonical, matched_variant = normalize_response(original, base_rules, special_rules)

        classified_data.append({
            'line_number': response_data['line_number'],
            'original': original,
            'canonical': canonical,
            'matched_variant': matched_variant
        })

        # 分類ログに記録
        if canonical != original:
            classification_log[canonical].append({
                'original': original,
                'matched_variant': matched_variant,
                'line_number': response_data['line_number']
            })

    # 集計
    counter = Counter(item['canonical'] for item in classified_data)

    return classified_data, classification_log, counter

def generate_report(classified_data, classification_log, counter, output_file):
    """分析結果のレポートを生成する"""

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# VALORANT スキンアンケート分析結果\n\n")

        f.write("## 概要\n")
        f.write(f"- 総回答数: {len(classified_data)}\n")
        f.write(f"- ユニークなスキン種類数: {len(counter)}\n\n")

        f.write("## 人気スキンランキング (TOP 30)\n\n")
        for i, (skin, count) in enumerate(counter.most_common(30), 1):
            f.write(f"{i}. **{skin}**: {count}票\n")
        f.write("\n")

        f.write("## 分類統合ルール詳細\n\n")
        f.write("以下のルールに基づいて類似回答を統合しました：\n\n")

        for canonical, entries in sorted(classification_log.items(), key=lambda x: len(x[1]), reverse=True):
            if len(entries) > 0:  # 統合が発生したもののみ
                total_count = counter[canonical]
                f.write(f"### {canonical} ({total_count}票)\n\n")

                # 統合された回答のバリエーション
                variants = {}
                for entry in entries:
                    variant = entry['matched_variant']
                    if variant not in variants:
                        variants[variant] = []
                    variants[variant].append(entry)

                f.write("**統合されたバリエーション:**\n")
                for variant, variant_entries in sorted(variants.items(), key=lambda x: len(x[1]), reverse=True):
                    f.write(f"- `{variant}`: {len(variant_entries)}件 ")
                    line_numbers = [str(entry['line_number']) for entry in variant_entries[:5]]
                    if len(variant_entries) > 5:
                        line_numbers.append(f"他{len(variant_entries)-5}件")
                    f.write(f"(行: {', '.join(line_numbers)})\n")

                f.write("\n")

        f.write("## 全スキン集計結果\n\n")
        for skin, count in counter.most_common():
            f.write(f"- {skin}: {count}票\n")

        f.write("\n## 統合前の元データサンプル\n\n")
        f.write("参考として、統合前の生データの一部を表示：\n\n")
        for i, item in enumerate(classified_data[:20]):
            f.write(f"{item['line_number']}. {item['original']} → {item['canonical']}\n")
        if len(classified_data) > 20:
            f.write(f"... (他{len(classified_data)-20}件)\n")

def main():
    """メイン処理"""
    input_file = r"C:\Users\80036\Documents\Obsidian Vault\work\Riot\VAL\スキン一覧.md"
    output_file = r"C:\Users\80036\Documents\Obsidian Vault\スキン分析結果.md"

    try:
        classified_data, classification_log, counter = analyze_skin_data(input_file)
        generate_report(classified_data, classification_log, counter, output_file)

        print(f"\n分析完了！")
        print(f"結果は {output_file} に保存されました。")
        print(f"\n人気TOP5:")
        for i, (skin, count) in enumerate(counter.most_common(5), 1):
            print(f"{i}. {skin}: {count}票")

    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()