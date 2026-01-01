#!/bin/bash

GH="C:/Program Files/GitHub CLI/gh.exe"

echo "最後のIssuesを作成します（31-40）..."

"$GH" issue create --title "Dockerイメージのサイズ最適化" --body "## 概要
Dockerイメージのサイズとビルド時間を最適化する。

## タスク
- [ ] マルチステージビルドの最適化
- [ ] 不要なファイルの除外（.dockerignore）
- [ ] イメージサイズ削減（Alpine Linuxベース）
- [ ] ビルド時間短縮（キャッシュ活用）

## 受け入れ条件
- イメージサイズが500MB以下
- ビルド時間が5分以内

## ラベル: deployment, docker, Phase-8"

"$GH" issue create --title "Cloud Runへの初回デプロイ" --body "## 概要
Google Cloud Runへの初回デプロイを実施する。

## タスク
- [ ] Google Cloudプロジェクト設定確認
- [ ] Cloud Run APIの有効化
- [ ] シークレット管理（Secret Manager）
- [ ] make deploy でデプロイ実行
- [ ] デプロイURLの確認

## 受け入れ条件
- Cloud Runにデプロイされている
- アプリケーションが正常に動作する

## プロジェクトID: discord-management-482906

## ラベル: deployment, cloud-run, Phase-8"

"$GH" issue create --title "GitHub Actions CI/CDの動作確認" --body "## 概要
GitHub ActionsのCI/CDパイプラインを検証する。

## タスク
- [ ] PRでのテスト自動実行を確認
- [ ] mainブランチへのpushで自動デプロイを確認
- [ ] デプロイ失敗時のロールバック確認
- [ ] ログ監視とアラート設定

## 受け入れ条件
- CI/CDが正常に動作する
- デプロイが自動化されている

## ラベル: deployment, ci-cd, Phase-8"

"$GH" issue create --title "本番環境のDBマイグレーション手順確立" --body "## 概要
本番環境のデータベースマイグレーション手順を確立する。

## タスク
- [ ] マイグレーション実行手順のドキュメント化
- [ ] Cloud Run Jobsでのマイグレーション実行
- [ ] ロールバック手順の確立
- [ ] バックアップ戦略

## 受け入れ条件
- マイグレーション手順が文書化されている
- 安全にマイグレーションが実行できる

## ラベル: deployment, database, Phase-8"

"$GH" issue create --title "Cloud Runのモニタリングとログ設定" --body "## 概要
Cloud Runのモニタリングとログ設定を行う。

## タスク
- [ ] Cloud Loggingの設定
- [ ] エラーログのアラート設定
- [ ] パフォーマンスメトリクスの監視
- [ ] アクセスログの分析

## 受け入れ条件
- ログが適切に収集されている
- エラー時にアラートが通知される

## ラベル: deployment, monitoring, Phase-8"

"$GH" issue create --title "プロジェクトREADME.mdの作成" --body "## 概要
プロジェクトREADMEを作成する。

## タスク
- [ ] プロジェクト概要
- [ ] セットアップ手順
- [ ] 開発コマンド一覧
- [ ] デプロイ手順
- [ ] トラブルシューティング

## 受け入れ条件
- 新規開発者がREADMEを読んで環境構築できる

## ラベル: documentation, Phase-9"

"$GH" issue create --title "OpenAPI仕様からAPI仕様書を自動生成" --body "## 概要
OpenAPI仕様を定義し、API仕様書を自動生成する。

## タスク
- [ ] OpenAPI仕様ファイル作成（YAML/JSON）
- [ ] Swagger UIの統合
- [ ] API仕様書の自動生成設定

## 受け入れ条件
- OpenAPI仕様が定義されている
- Swagger UIでAPIが確認できる

## ラベル: documentation, api, Phase-9"

"$GH" issue create --title "パフォーマンスチューニング" --body "## 概要
アプリケーションのパフォーマンスを最適化する。

## タスク
- [ ] データベースクエリの最適化（N+1問題）
- [ ] ページロード時間の短縮
- [ ] 画像最適化
- [ ] キャッシュ戦略の実装

## 受け入れ条件
- ページロード時間が2秒以内
- Lighthouse スコア90以上

## ラベル: enhancement, performance, Phase-9"

"$GH" issue create --title "セキュリティベストプラクティスの適用" --body "## 概要
セキュリティベストプラクティスを適用する。

## タスク
- [ ] SQLインジェクション対策確認
- [ ] XSS対策確認
- [ ] CSRF対策確認
- [ ] 依存関係の脆弱性スキャン（npm audit）
- [ ] セキュリティヘッダーの設定

## 受け入れ条件
- セキュリティテストが全て通る
- 脆弱性が0件

## ラベル: security, Phase-9"

"$GH" issue create --title "WCAG 2.1 AAレベルのアクセシビリティ対応" --body "## 概要
WCAG 2.1 AAレベルのアクセシビリティに対応する。

## タスク
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応（ARIA属性）
- [ ] カラーコントラスト比の確認
- [ ] フォーカス管理

## 受け入れ条件
- axe DevToolsで問題が0件
- キーボードのみで操作可能

## ラベル: enhancement, a11y, Phase-9"

echo ""
echo "✅ 全40個のIssueを作成完了しました！"
echo ""
echo "GitHub Issues: https://github.com/momotiro/my-obsidian-vault/issues"
