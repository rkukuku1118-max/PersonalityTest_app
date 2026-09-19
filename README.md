# HEXACO 性格テスト PoC

HEXACO-PI-R の60問版・100問版にブラウザーで回答し、因子・下位尺度のスコアを確認するための試作アプリです。

> このアプリは自己理解や研究用途の参考表示を目的としています。心理・医療上の診断を行うものではありません。

## 最短の起動手順（Windows）

### 1. Node.js をインストールする

[Node.js 公式サイト](https://nodejs.org/)から **Node.js 22 LTS** をインストールしてください。

インストール後は、開いている PowerShell をいったん閉じ、新しい PowerShell を開きます。次のコマンドでバージョンが表示されれば準備完了です。

```powershell
node --version
npm --version
```

`node は認識されません` と表示される場合は、Node.js が未導入か、インストール後に PowerShell を開き直していません。

### 2. pnpm をインストールする

新しい PowerShell で次を実行します。

```powershell
npm install --global pnpm@10.11.1
pnpm --version
```

最後にバージョンが表示されれば成功です。

### 3. プロジェクトのフォルダーへ移動する

PowerShell で、この README があるフォルダーへ移動します。

```powershell
cd "C:\Users\ryuus\OneDrive\ドキュメント\gaikou_test"
```

別の場所へプロジェクトを移動した場合は、その場所に読み替えてください。

### 4. 必要なパッケージを準備する

初回だけ実行します。

```powershell
pnpm install
```

### 5. アプリを起動する

```powershell
pnpm run dev
```

次のような表示が出たら起動成功です。

```text
Local: http://127.0.0.1:5173/
```

ブラウザーで [http://127.0.0.1:5173/](http://127.0.0.1:5173/) を開いてください。

PowerShell は起動中のままにしておきます。アプリを終了するときは、その PowerShell で `Ctrl+C` を押します。

## 2回目以降の起動

通常は次の2行だけで起動できます。

```powershell
cd "C:\Users\ryuus\OneDrive\ドキュメント\gaikou_test"
pnpm run dev
```

パッケージ構成が変更された場合は、先に `pnpm install` をもう一度実行してください。

## 動作確認とビルド

質問データに不整合がないか確認します。

```powershell
pnpm run validate:data
```

配布用ファイルを `dist` フォルダーへ作成します。

```powershell
pnpm run build
```

ビルド済みのアプリを確認する場合は、ビルド後に次を実行します。

```powershell
pnpm run serve:dist
```

その後、ブラウザーで [http://127.0.0.1:5173/](http://127.0.0.1:5173/) を開きます。終了方法は同じく `Ctrl+C` です。

## うまく起動しない場合

### `node` または `npm` が認識されない

Node.js 22 LTS をインストールし、PowerShellを開き直してください。それでも解消しなければ、Windowsを再起動してから確認します。

```powershell
node --version
npm --version
```

### `pnpm` が認識されない

新しい PowerShell で pnpm を再インストールします。

```powershell
npm install --global pnpm@10.11.1
pnpm --version
```

### `EADDRINUSE` または「port 5173 is already in use」と表示される

すでにアプリが起動している可能性があります。まず [http://127.0.0.1:5173/](http://127.0.0.1:5173/) をブラウザーで開いて確認してください。

以前起動した PowerShell が残っている場合は、その画面で `Ctrl+C` を押してから再実行します。

### 画面が古い、または表示が崩れる

ブラウザーで `Ctrl+F5` を押して強制再読み込みしてください。改善しない場合は、サーバーを停止して次を順番に実行します。

```powershell
pnpm install
pnpm run build
pnpm run dev
```

### PowerShell の実行ポリシーに関するエラーが出る

`pnpm.ps1` を実行できないという内容であれば、同じコマンドの `pnpm` を `pnpm.cmd` に置き換えて実行できます。

```powershell
pnpm.cmd install
pnpm.cmd run dev
```

## アプリでできること

- 60問版と100問版を切り替える
- 5件法で質問に回答する
- 回答済み数と進捗を確認する
- 未回答の質問へ移動する
- 全問回答後に診断結果画面へ移動する
- 因子スコアと下位尺度スコアを確認する
- 5つのテーマから、診断結果を含むAI向けプロンプトを作成・コピーする
- 「あなたの取扱説明書」では、共有用画像を生成するためのプロンプトを作成する
- 結果から診断画面へ戻って回答を見直す

表示する主な尺度は、誠実さ・謙虚さ、情動性、外向性、協調性、勤勉性、開放性です。100問版では利他性も表示します。

## データと採点

実行時に Word や PDF を直接読み込むことはありません。質問文、採点キー、基準値は `src/data/test-definitions.json` を使用します。`ref` フォルダー内のファイルは元資料です。

回答は1～5の数値として扱い、逆転項目は `6 - 回答値` で採点します。下位尺度は対象項目の平均、因子スコアはその因子に含まれる項目の平均です。

データ形式の詳細は [docs/data-format.md](docs/data-format.md)、画面仕様は [docs/app-spec.md](docs/app-spec.md)、ソース構成は [docs/architecture.md](docs/architecture.md) を参照してください。

## 主なファイル

- `src/App.tsx`: 画面コンポーネントの組み立て
- `src/features/assessment/useAssessment.ts`: 回答状態と画面遷移
- `src/features/assessment/scoring.ts`: 採点と評価の純粋関数
- `src/features/assessment/components/`: 診断・結果画面の表示
- `src/styles/`: 基盤、各画面、レスポンシブのスタイル
- `src/data/test-definitions.json`: 質問、採点キー、基準値
- `src/data/tests.ts`: データ型と読み込み処理
- `scripts/validate-test-data.mjs`: 質問データの整合性チェック
- `scripts/serve-dist.mjs`: ビルド済みファイルのローカル配信
- `docs/app-spec.md`: 画面仕様
- `docs/data-format.md`: データ形式
- `docs/architecture.md`: ソース構成と依存関係
