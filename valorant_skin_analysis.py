import pandas as pd
import re
from collections import defaultdict

# Read the Excel file
file_path = r'C:\Users\80036\Documents\Obsidian Vault\VALORANT意識調査 in TGS2025（回答）.xlsx'
df = pd.read_excel(file_path, sheet_name=0)

# Get G column data (favorite skins)
g_column = df.iloc[:, 6].dropna()
responses = g_column.value_counts()

# Dictionary to group similar skin names
skin_groups = defaultdict(list)

# Define standardization rules
def standardize_skin_name(name):
    name = str(name).strip()

    # Champions standardization
    if re.search(r'champions?[ ]*2021', name, re.IGNORECASE):
        return 'Champions 2021'
    elif re.search(r'champions?[ ]*2022', name, re.IGNORECASE):
        return 'Champions 2022'
    elif re.search(r'champions?[ ]*2023', name, re.IGNORECASE):
        return 'Champions 2023'
    elif re.search(r'champions?[ ]*2024', name, re.IGNORECASE):
        return 'Champions 2024'
    elif re.search(r'champions?[ ]*2025', name, re.IGNORECASE):
        return 'Champions 2025'

    # Prime standardization
    if re.search(r'プライム', name) or re.search(r'prime', name, re.IGNORECASE):
        if '2.0' in name:
            return 'Prime 2.0'
        else:
            return 'Prime'

    # Prelude to Chaos standardization
    if re.search(r'プリリュード.*カオス', name) or re.search(r'prelude.*chaos', name, re.IGNORECASE):
        return 'Prelude to Chaos'

    # Chaos standardization
    if name == 'カオス' or name.lower() == 'chaos':
        return 'Chaos'

    # Glitchpop standardization
    if re.search(r'グリッチポップ', name) or re.search(r'glitchpop', name, re.IGNORECASE):
        return 'Glitchpop'

    # Reaver standardization
    if re.search(r'リーバー', name) or re.search(r'reaver', name, re.IGNORECASE):
        return 'Reaver'

    # Phantom variants
    if name in ['ファントム', 'Phantom']:
        return 'Phantom'

    # RGX standardization
    if re.search(r'RGX', name, re.IGNORECASE):
        if '2.0' in name:
            return 'RGX 2.0'
        elif '1.0' in name:
            return 'RGX 1.0'
        else:
            return 'RGX'

    # Gaia's Vengeance standardization
    if re.search(r'ガイアズ.*ヴェンジェンス', name) or re.search(r'gaia.*vengeance', name, re.IGNORECASE):
        return "Gaia's Vengeance"
    elif re.search(r'ガイアズ', name) or re.search(r'gaia', name, re.IGNORECASE):
        return "Gaia's Vengeance"

    # Protocol standardization
    if re.search(r'プロトコル', name) or re.search(r'protocol', name, re.IGNORECASE):
        return 'Protocol 781-A'

    # Singularity standardization
    if re.search(r'シンギュラリティ', name) or re.search(r'singularity', name, re.IGNORECASE):
        if '2.0' in name:
            return 'Singularity 2.0'
        else:
            return 'Singularity'

    # Oni standardization
    if re.search(r'オニ', name) or re.search(r'oni', name, re.IGNORECASE):
        if '2.0' in name:
            return 'Oni 2.0'
        elif '1.0' in name:
            return 'Oni 1.0'
        else:
            return 'Oni'

    # Ion standardization
    if re.search(r'イオン', name) or re.search(r'ion', name, re.IGNORECASE):
        if '2.0' in name:
            return 'Ion 2.0'
        else:
            return 'Ion'

    # Elderflame standardization
    if re.search(r'エルダーフレイム', name) or re.search(r'elderflame', name, re.IGNORECASE):
        return 'Elderflame'

    # Sovereign standardization
    if re.search(r'ソブリン', name) or re.search(r'sovereign', name, re.IGNORECASE):
        return 'Sovereign'

    # Forsaken standardization
    if re.search(r'フォーセイクン', name) or re.search(r'forsaken', name, re.IGNORECASE):
        return 'Forsaken'

    # Evolve/Dragon Wing standardization
    if re.search(r'エヴォルヴ.*ドラゴン.*ウィング', name):
        return 'Evolve Dragon Wings'

    # Minima standardization
    if re.search(r'ミニマ', name) or re.search(r'minima', name, re.IGNORECASE):
        if '2.0' in name:
            return 'Minima 2.0'
        else:
            return 'Minima'

    # Spectrum standardization
    if re.search(r'スペクトラム', name) or re.search(r'spectrum', name, re.IGNORECASE):
        return 'Spectrum'

    # Neo Frontier standardization
    if re.search(r'ネオフロンティア', name) or re.search(r'neo.*frontier', name, re.IGNORECASE):
        return 'Neo Frontier'

    # Araxys standardization
    if re.search(r'アラクシス', name) or re.search(r'araxys', name, re.IGNORECASE):
        return 'Araxys'

    # Sakura standardization
    if re.search(r'サクラ', name) or re.search(r'sakura', name, re.IGNORECASE):
        return 'Sakura'

    # Kuronami standardization
    if re.search(r'クロナミ', name) or re.search(r'kuronami', name, re.IGNORECASE):
        return 'Kuronami'

    # Mist Bloom standardization
    if re.search(r'ミストブルーム', name) or re.search(r'mist.*bloom', name, re.IGNORECASE):
        return 'Mist Bloom'

    # Ruination standardization
    if re.search(r'ルイネーション', name) or re.search(r'ruination', name, re.IGNORECASE):
        return 'Ruination'

    # Arcane standardization
    if re.search(r'アーケイン', name) or re.search(r'arcane', name, re.IGNORECASE):
        return 'Arcane'

    # BlastX standardization
    if re.search(r'ブラストX', name) or re.search(r'blast.*x', name, re.IGNORECASE):
        return 'BlastX'

    # Xenohunter standardization
    if re.search(r'ゼノハンター', name) or re.search(r'xenohunter', name, re.IGNORECASE):
        return 'Xenohunter'

    # Winterwunderland standardization
    if re.search(r'ウィンターワンダーランド', name) or re.search(r'winter.*wunderland', name, re.IGNORECASE):
        return 'Winterwunderland'

    # Cryostasis standardization
    if re.search(r'クライオステイシス', name) or re.search(r'cryostasis', name, re.IGNORECASE):
        return 'Cryostasis'

    # Black Market standardization
    if re.search(r'ブラックマーケット', name) or re.search(r'black.*market', name, re.IGNORECASE):
        return 'Black Market'

    # Return original name if no standardization applies
    return name

# Group responses by standardized names
standardized_counts = defaultdict(int)
grouping_details = defaultdict(list)

for original_name, count in responses.items():
    standardized = standardize_skin_name(original_name)
    standardized_counts[standardized] += count
    grouping_details[standardized].append((original_name, count))

# Sort by count
final_ranking = sorted(standardized_counts.items(), key=lambda x: x[1], reverse=True)

print("=== VALORANT スキン人気ランキング (完全版) ===")
print()

for rank, (skin_name, total_count) in enumerate(final_ranking, 1):
    print(f"{rank}位: {skin_name} ({total_count}票)")

    # Show grouped responses if more than one
    if len(grouping_details[skin_name]) > 1:
        print("   グループ化した回答:")
        for original, count in sorted(grouping_details[skin_name], key=lambda x: x[1], reverse=True):
            print(f"     - {original} ({count}票)")
    print()

print(f"総回答数: {sum(standardized_counts.values())}票")
print(f"ユニークスキン数: {len(final_ranking)}種類")