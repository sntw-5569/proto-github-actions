# GitHub Actionsの実験場

このリポジトリはGitHub Actionsのワークフローを実験するためのものです。

## ワークフロー

このリポジトリには以下の2つのワークフローが含まれています：

### CI (Continuous Integration)

`ci.yml`ファイルで定義されています。このワークフローは以下のタイミングで実行されます：
- mainブランチへのプッシュ
- mainブランチへのプルリクエスト
- 手動実行（workflow_dispatch）

このワークフローは以下のステップを実行します：
1. リポジトリのチェックアウト
2. Node.jsのセットアップ
3. 依存関係のインストール
4. テストの実行
5. ビルド

### デプロイ

`deploy.yml`ファイルで定義されています。このワークフローは以下のタイミングで実行されます：
- mainブランチへのプッシュ
- 手動実行（workflow_dispatch）

このワークフローは以下のステップを実行します：
1. リポジトリのチェックアウト
2. Node.jsのセットアップ
3. 依存関係のインストール
4. ビルド
5. GitHub Pagesへのデプロイ

## 使い方

1. このリポジトリをクローンします
2. 必要に応じてワークフローファイル（`.github/workflows/`内）を編集します
3. 変更をコミットしてプッシュします
4. GitHub上でワークフローの実行状況を確認します

## 注意事項

- デプロイワークフローを使用するには、リポジトリの設定でGitHub Pagesを有効にする必要があります
- 実際のプロジェクトに合わせて、ワークフローファイルを適宜カスタマイズしてください 