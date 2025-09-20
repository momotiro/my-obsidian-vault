#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VALORANTスキン一覧データの同一スキン表記分析ツール
"""

import re
from collections import defaultdict, Counter
import unicodedata

class VALORANTSkinClassifier:
    def __init__(self):
        self.skin_data = []
        self.grouped_skins = defaultdict(list)
        self.skin_variations = defaultdict(set)

        # スキン名の正規化ルール
        self.normalization_rules = {
            # Champions系の統一
            r'[Cc]hampions?\s*2021': 'Champions2021',
            r'[Cc]hampions?\s*2022': 'Champions2022',
            r'[Cc]hampions?\s*2023': 'Champions2023',
            r'[Cc]hampions?\s*2024': 'Champions2024',
            r'[Cc]hampions?\s*2025': 'Champions2025',
            r'チャンピオンズ?\s*2021': 'Champions2021',
            r'チャンピオンズ?\s*2022': 'Champions2022',
            r'チャンピオンズ?\s*2023': 'Champions2023',
            r'チャンピオンズ?\s*2024': 'Champions2024',
            r'チャンピオンズ?\s*2025': 'Champions2025',

            # プレリュード・トゥ・カオス系の統一
            r'プレリュード[・\s]*トゥ[ー\s]*カオス': 'プレリュード・トゥ・カオス',
            r'[Pp]relude\s*to\s*[Cc]haos': 'プレリュード・トゥ・カオス',
            r'プレデュード[・\s]*カオス': 'プレリュード・トゥ・カオス',
            r'プリリュード[・\s]*カオス': 'プレリュード・トゥ・カオス',
            r'プレリュードカオス': 'プレリュード・トゥ・カオス',

            # プライモーディアム系の統一
            r'プライム?オ?ー?ディアム?': 'プライモーディアム',
            r'プライマーディアム': 'プライモーディアム',

            # ガイアズ・ヴェンジェンス系
            r'ガイアズ?[・\s]*ヴェンジェンス': 'ガイアズ・ヴェンジェンス',
            r'ガイアス[・\s]*ヴェンジェンス': 'ガイアズ・ヴェンジェンス',

            # エヴォリ・ドリームウィングス系
            r'エヴォリ[・\s]*ドリームウィングス?': 'エヴォリ・ドリームウィングス',
            r'エヴォリドリームウィングス?': 'エヴォリ・ドリームウィングス',

            # RGX系
            r'RGX\s*11Z?\s*PRO': 'RGX 11Z PRO',
            r'RGX11ZPRO': 'RGX 11Z PRO',

            # シンギュラリティ系
            r'シンギュラリティ[ー]*': 'シンギュラリティ',

            # その他の統一
            r'ARCANE': 'アーケイン',
            r'Arcane': 'アーケイン',
            r'オニ\s*': 'オニ',
            r'鬼\s*': 'オニ',
            r'バブルガム\s*デスウィッシュ': 'バブルガム デスウィッシュ',
            r'ソヴリン': 'ソブリン',
            r'フォーセイクン': 'フォーセイクン',
            r'CHAOS': 'カオス',
            r'EX\.?O': 'EX.O',
            r'EXO': 'EX.O',
            r'K/?TAC': 'K/TAC',
            r'KTAC': 'K/TAC',
            r'VALORANT\s*GO!?': 'VALORANT GO',
            r'プロトコル\s*781\-A': 'プロトコル 781-A',
            r'レディアント[・\s]*エンターテ[イ]?インメント[・\s]*システム': 'レディアント・エンターテインメント・システム',
            r'グラビテーショナル[・\s]*ウラニウム[・\s]*ニューロブラスター': 'グラビテーショナル・ウラニウム・ニューロブラスター',
            r'センチネル[・\s]*オブ[・\s]*ライト': 'センチネル・オブ・ライト',
            r'ワンダー[ズ]?スタリオン': 'ワンダースタリオン',
            r'リーヴァ[ー]?': 'リーヴァー',
            r'ヌンカ[・\s]*オルヴィダドス': 'ヌンカ・オルヴィダドス',
        }

        # 武器名のパターン
        self.weapon_patterns = [
            r'ヴァンダル', r'ファントム', r'オペレーター', r'シェリフ', r'ゴースト',
            r'オーディン', r'スペクター', r'ブルドッグ', r'ガーディアン', r'マーシャル',
            r'フレンジー', r'クラシック', r'ショーティー', r'ジャッジ', r'バッキー',
            r'ヴァンダル', r'ダガー', r'ナイフ', r'ハンマー', r'ブレイド',
            r'vandal', r'phantom', r'operator', r'sheriff', r'ghost'
        ]

    def load_data(self, file_path):
        """スキンデータを読み込む"""
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for line in lines:
            line = line.strip()
            if '→|' in line and line != '→|':
                # 行番号とスキン名を分離
                parts = line.split('→|', 1)
                if len(parts) == 2:
                    skin_name = parts[1].strip()
                    if skin_name and skin_name != '' and skin_name != '-'*60:
                        self.skin_data.append(skin_name)

    def normalize_skin_name(self, skin_name):
        """スキン名を正規化する"""
        # 基本的なクリーニング
        normalized = skin_name.strip()
        normalized = re.sub(r'\s+', ' ', normalized)  # 複数スペースを1つに
        normalized = re.sub(r'[！!]+', '!', normalized)  # 複数感嘆符を1つに
        normalized = re.sub(r'[？?]+', '?', normalized)  # 複数疑問符を1つに

        # 正規化ルールを適用
        for pattern, replacement in self.normalization_rules.items():
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

        return normalized

    def extract_base_skin_name(self, skin_name):
        """ベーススキン名を抽出（武器名、バージョン番号を除去）"""
        base_name = skin_name

        # 武器名を除去
        for weapon in self.weapon_patterns:
            base_name = re.sub(weapon, '', base_name, flags=re.IGNORECASE)

        # バージョン番号を除去
        base_name = re.sub(r'\d+\.\d+', '', base_name)
        base_name = re.sub(r'[12]\.\d+', '', base_name)

        # 色の指定を除去
        base_name = re.sub(r'[（(][^）)]*[）)]', '', base_name)
        base_name = re.sub(r'の[青緑赤黄白黒紫]+', '', base_name)

        # 余分なスペースを除去
        base_name = re.sub(r'\s+', ' ', base_name).strip()

        return base_name

    def classify_skins(self):
        """スキンを分類する"""
        skin_counter = Counter()

        for skin_name in self.skin_data:
            # 無効なエントリをスキップ
            if not skin_name or skin_name in ['特になし', '特にない', 'デフォルト', '初期スキン', 'た', 'かわいいやつ', '猫のやつ!']:
                continue

            # 複数スキンが含まれている場合は分割
            if '、' in skin_name or ',' in skin_name:
                sub_skins = re.split(r'[、,]', skin_name)
                for sub_skin in sub_skins:
                    sub_skin = sub_skin.strip()
                    if sub_skin:
                        normalized = self.normalize_skin_name(sub_skin)
                        base_name = self.extract_base_skin_name(normalized)
                        if base_name:
                            skin_counter[base_name] += 1
                            self.skin_variations[base_name].add(normalized)
            else:
                normalized = self.normalize_skin_name(skin_name)
                base_name = self.extract_base_skin_name(normalized)
                if base_name:
                    skin_counter[base_name] += 1
                    self.skin_variations[base_name].add(normalized)

        return skin_counter

    def get_analysis_report(self):
        """分析レポートを生成する"""
        skin_counter = self.classify_skins()

        # 出現回数でソート
        sorted_skins = sorted(skin_counter.items(), key=lambda x: x[1], reverse=True)

        report = []
        report.append("# VALORANTスキン表記統一分析レポート\n")
        report.append(f"## 総分析データ数: {len(self.skin_data)}件")
        report.append(f"## 識別されたユニークスキン数: {len(sorted_skins)}種類\n")

        report.append("## 上位人気スキン（出現回数順）\n")
        for i, (base_name, count) in enumerate(sorted_skins[:30], 1):
            variations = list(self.skin_variations[base_name])
            report.append(f"### {i}. {base_name}")
            report.append(f"**出現回数:** {count}回")
            report.append(f"**表記パターン数:** {len(variations)}種類")

            if len(variations) > 1:
                report.append("**表記バリエーション:**")
                for var in sorted(variations):
                    report.append(f"- {var}")
            else:
                report.append(f"**統一表記:** {variations[0]}")

            report.append("")

        # 表記揺れが多いスキン
        report.append("\n## 表記揺れが多いスキン（要統一）\n")
        variation_issues = [(base, variations) for base, variations in self.skin_variations.items()
                           if len(variations) > 3]
        variation_issues.sort(key=lambda x: len(x[1]), reverse=True)

        for base_name, variations in variation_issues[:15]:
            count = skin_counter[base_name]
            report.append(f"### {base_name}")
            report.append(f"**出現回数:** {count}回 | **表記パターン数:** {len(variations)}種類")
            report.append("**統一が必要な表記:**")
            for var in sorted(variations):
                report.append(f"- {var}")
            report.append("")

        # Champions系スキンの分析
        report.append("\n## Champions系スキンの分析\n")
        champions_skins = {base: count for base, count in sorted_skins
                          if 'Champions' in base or 'チャンピオン' in base}

        for base_name, count in sorted(champions_skins.items(), key=lambda x: x[1], reverse=True):
            variations = list(self.skin_variations[base_name])
            report.append(f"### {base_name}")
            report.append(f"**出現回数:** {count}回")
            report.append("**表記パターン:**")
            for var in sorted(variations):
                report.append(f"- {var}")
            report.append("")

        return "\n".join(report)

def main():
    classifier = VALORANTSkinClassifier()

    # データ読み込み
    file_path = r"C:\Users\80036\Documents\Obsidian Vault\work\Riot\VAL\スキン一覧.md"
    classifier.load_data(file_path)

    # 分析実行
    report = classifier.get_analysis_report()

    # 結果出力
    output_path = r"C:\Users\80036\Documents\Obsidian Vault\valorant_skin_analysis_report.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"分析完了: {output_path}")
    print(f"総データ数: {len(classifier.skin_data)}件")
    print(f"ユニークスキン数: {len(classifier.skin_variations)}種類")

if __name__ == "__main__":
    main()