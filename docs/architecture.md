# アーキテクチャ

## 方針

画面、状態、採点計算を分離し、一つの変更が無関係なファイルへ波及しない構成にします。

- `App.tsx` は画面の組み立てだけを担当する
- 回答状態と画面遷移は `useAssessment` に集約する
- 診断履歴とテーマ別の生成レポートは `historyStorage` を介してブラウザーの `localStorage` に保存する
- 採点は React に依存しない純粋関数として実装する
- 文章生成はブラウザーからPages Functionを介し、APIトークンをクライアントへ置かない
- UI は役割単位の小さな関数コンポーネントに分ける
- スタイルは基盤、診断、結果、レスポンシブに分ける

React のコンポーネントにクラス継承は使用しません。状態と処理をカスタムフックと純粋関数へ分離することで、継承関係ではなくデータの流れで構造を追えるようにします。

## ディレクトリ構成

```text
src/
├─ App.tsx
├─ main.tsx
├─ data/
│  ├─ test-definitions.json
│  └─ tests.ts
├─ features/
│  └─ assessment/
│     ├─ types.ts
│     ├─ scoring.ts
│     ├─ aiGeneration.ts
│     ├─ useAssessment.ts
│     └─ components/
│        ├─ AppHeader.tsx
│        ├─ DiagnosisScreen.tsx
│        ├─ ResultsScreen.tsx
│        └─ ScoreCards.tsx
└─ styles/
   ├─ index.css
   ├─ base.css
   ├─ layout.css
   ├─ diagnosis.css
   ├─ results.css
   └─ responsive.css
functions/
└─ api/
   └─ generate.ts
wrangler.jsonc
```

## 依存方向

```text
data
  ↓
types → scoring
  ↓       ↓
useAssessment
  ↓
components
  ↓
App
```

下位層から画面コンポーネントを参照しないことが原則です。特に `scoring.ts` は DOM や React の状態へ依存させません。

## 変更時の目安

- 採点規則を変える: `scoring.ts`
- 回答や画面遷移を変える: `useAssessment.ts`
- 履歴の保存形式や件数上限を変える: `historyStorage.ts`
- 診断画面を変える: `DiagnosisScreen.tsx` と `diagnosis.css`
- 結果表示を変える: `ResultsScreen.tsx`、`ScoreCards.tsx`、`results.css`
- 文章生成の通信を変える: `aiGeneration.ts` と `functions/api/generate.ts`
- 質問や基準値を変える: `data/test-definitions.json`
- 全画面共通の見た目を変える: `base.css` または `layout.css`

新しい処理は、まず React に依存しない純粋関数にできないか検討します。複数画面で共有しない小さな表示部品は、無理に共通化せず利用する機能の近くへ置きます。
