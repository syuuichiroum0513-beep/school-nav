# 学内ナビゲーションWebアプリ プロトタイプ

## ファイル構成

- `index.html` : 画面の骨格
- `css/style.css` : 学校公式ツール向けの落ち着いたUI
- `js/pathfinding.js` : ダイクストラ法による最短経路計算
- `js/qr.js` : QRスキャン結果からノードIDを取り出す処理、html5-qrcode の開始・停止処理
- `js/app.js` : 画面制御、`data.json` の読み込み、案内表示、URLからの現在地設定
- `config.js` : QRに埋め込む公開URL（`APP_BASE_URL`）の設定
- `scripts/generate-qrcodes.js` : `config.js` を参照してURL形式QRを一括生成
- `data.json` : ノード・経路・目的地データ（非エンジニア向け編集箇所）
- `CONTRIBUTING.md` : ノード・エッジ追加時のルールとダミーデータ例
- `package.json` : QR生成・データ整合性チェック用コマンド
- `TESTING.md` : Android Chrome / iPhone Safari を含む実機テスト手順

## 動かし方

`data.json` を `fetch()` で読むため、HTMLファイルを直接ダブルクリックするのではなく、ローカルHTTPサーバーで開いてください。

例（Python がある場合）:

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000/` を開きます。

QRコードには `config.js` の `APP_BASE_URL` を基準にしたURLを入れます。例えば `main-entrance` なら次の形式です。

```text
https://example.github.io/school-nav/?node=main-entrance
```

QRコード自体は `node` パラメータを使って現在地を設定します。アプリは従来のノードIDだけを直接読み取るQRにも後方互換で対応しています。

## 公開URL（config.js）の設定

`config.js` の `APP_BASE_URL` が、QRコードに埋め込むURLの基準になります。GitHub Pages の公開URLが決まったら、ここだけ変更します。

```js
const APP_BASE_URL = 'https://YOUR-NAME.github.io/school-nav/';
```

リポジトリ名やユーザー名が異なる場合は、実際に表示されたGitHub PagesのURLに置き換えてください。末尾の `/` は残してください。

変更後はQRコードを再生成します。

```bash
npm install
npm run generate-qr
```

## data.json の編集イメージ

地点を増やすときは `nodes` に追加し、移動区間を `edges` に追加します。
`cost` は小さいほど優先されるので、「近い・移動しやすい」を 1 とするなど、学校側でルールを決めてください。

目的地として選べる場所は `destinations` に追加します。

## 今後の拡張候補

- 校舎・階数をまたぐ経路データの実地整備
- 管理者向けの `data.json` 編集補助UI
- QRコード発行用ページ
- 通行止め・工事区間などを考慮した一時的な経路無効化
- オフライン時のデータキャッシュ

## GitHub Pagesへのデプロイ

このプロジェクトは静的ファイルだけで構成されているため、GitHub Pages の `main` ブランチ / `/(root)` を公開元にする構成を想定しています。GitHub公式手順でも、Settings → Pages の **Build and deployment** で **Source: Deploy from a branch** を選び、公開ブランチとフォルダを指定できます。

### ① リポジトリを作成してpush

GitHubで空のリポジトリ（例: `school-nav`）を作成し、プロジェクトフォルダで次を実行します。

```bash
git init
git add .
git commit -m "Initial school navigation prototype"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/school-nav.git
git push -u origin main
```

`YOUR-NAME` は自分のGitHubユーザー名に置き換えてください。

### ② GitHub Pagesを有効化し、公開URLを確認

1. GitHubで対象リポジトリを開く。
2. リポジトリ上部の **Settings** を開く。
3. 左側サイドバーの **Code, planning, and automation → Pages** を開く。
4. **Build and deployment → Source** で **Deploy from a branch** を選ぶ。
5. **Branch** を `main`、フォルダを `/(root)` にして **Save**。

公開処理後、同じ **Settings → Pages** のページにある **GitHub Pages** セクションで **Visit site** を押すと公開サイトを開けます。GitHub公式ドキュメントでは、このページから公開サイトを確認する手順が案内されています。

公開URLは通常、プロジェクトサイトなら次の形式です。

```text
https://YOUR-NAME.github.io/school-nav/
```

GitHub Pages は変更の公開に時間がかかる場合があり、公式ドキュメントではpush後の反映に最大10分程度かかることがあるとされています。

### ③ `config.js` の `APP_BASE_URL` を公開URLへ書き換える

②で確認したURLを、そのまま `config.js` の `APP_BASE_URL` に設定します。

```js
const APP_BASE_URL = 'https://YOUR-NAME.github.io/school-nav/';
```

例えば公開URLが `https://abc123.github.io/school-nav/` なら、次のようにします。

```js
const APP_BASE_URL = 'https://abc123.github.io/school-nav/';
```

末尾の `/` も残してください。

変更したらpushします。

```bash
git add config.js
git commit -m "Set GitHub Pages base URL"
git push
```

### ④ `npm run generate-qr` を実行し、本番URL入りのQRを再生成

`generate-qrcodes.js` は `config.js` の `APP_BASE_URL` を参照するため、③の設定後に実行すれば本番URLを埋め込んだQRが生成されます。

初回だけ依存パッケージをインストールします。

```bash
npm install
```

その後、QRを生成します。

```bash
npm run generate-qr
```

### ⑤ `qrcodes/` 内のPNGを確認する

生成されたファイルを確認します。

```bash
find qrcodes -maxdepth 1 -type f -name '*.png' | sort
```

ファイル名はノードIDです。例えば、

```text
qrcodes/main-entrance.png
qrcodes/room-201.png
```

のようになります。

QRを生成しただけではGitHub Pagesへ公開されないため、`qrcodes/` をリポジトリへ追加してpushする場合は、次を実行します。

```bash
git add qrcodes/
git commit -m "Generate production QR codes"
git push
```

### `data.json` を更新したとき

地点・経路を変更した場合は、公開前に整合性チェックを実行してください。

```bash
npm run check-data
```

問題がなければ変更をpushします。

```bash
git add data.json
git commit -m "Update campus navigation data"
git push
```

GitHub Pages は公開元ブランチにpushされた内容を再公開します。

その後、`TESTING.md` の実機テストを行い、公開URLから最新の `data.json` が読み込まれていることを確認してください。

## 改善後のエッジケース確認メモ

以下はブラウザ上で手動確認する項目です。

1. **カメラ権限拒否**：QRスキャンを押してカメラ権限を拒否すると、「カメラの使用が許可されていません」と表示され、現在地の手動選択が開くことを確認。
2. **カメラ非対応環境**：カメラを使えない端末・HTTP以外の条件などでスキャン開始に失敗しても、手動選択ボタンが常に画面上に残っていることを確認。
3. **未知QR**：nodes に存在しない文字列をQRから読み取った場合、「認識できないコードです」と表示され、再スキャンまたは手動選択へ進めることを確認。
4. **検索0件**：目的地検索に存在しない文字列（例：`zzzz`）を入力し、「見つかりません」と表示されることを確認。
5. **ひらがな・カタカナ検索**：`たなか` と `タナカ` の両方で田中先生の部屋が検索結果に出ることを確認。
6. **同一ノード**：現在地と目的地を同じノードに設定し、「到着済みです」と表示されることを確認。
7. **経路なし**：一時的に `data.json` の対象ノードをグラフから切り離して起動し、「現在地から目的地までの経路がありません」と表示され、画面操作が継続できることを確認。確認後は `data.json` を元に戻す。

※ 実機のカメラ権限まではこの作業環境から直接操作できないため、実機確認は `TESTING.md` に沿って行ってください。
