# 実機テスト手順書

GitHub Pagesに公開し、`config.js` の `APP_BASE_URL` を本番URLへ変更してQRコードを再生成した後に実施します。

## 事前確認

- [ ] `Settings → Pages` の **GitHub Pages** セクションから **Visit site** で公開URLを開ける
- [ ] `config.js` の `APP_BASE_URL` が上記の公開URLと一致している
- [ ] `npm run check-data` がエラー0で終了している
- [ ] `npm run generate-qr` が完了し、`qrcodes/` にPNGが生成されている

## QR → URL → 現在地設定

### 1. 標準カメラでQRを読み取る

- [ ] `qrcodes/` からQR画像を1枚選ぶ
- [ ] Androidの標準カメラで読み取る
- [ ] iPhoneの標準カメラで読み取る
- [ ] 表示されるリンクが `https://<公開URL>/?node=xxx` の形式になっている
- [ ] `xxx` がQR画像のファイル名（拡張子を除くノードID）と一致している

メモ：

```text
QRファイル名:
表示されたURL:
確認日:
```

### 2. URLをタップしてアプリを開く

- [ ] Android ChromeでURLを開く
- [ ] アプリが起動する
- [ ] 「現在地：〇〇」が自動表示される
- [ ] iPhone Safariで同じURLを開く
- [ ] アプリが起動する
- [ ] 「現在地：〇〇」が自動表示される

Android Chrome記録：

```text
端末:
URL:
現在地表示:
結果: □ OK / □ NG
確認者:
確認日:
```

iPhone Safari記録：

```text
端末:
URL:
現在地表示:
結果: □ OK / □ NG
確認者:
確認日:
```

### 3. アプリ内QRスキャン

同じQR画像をアプリ内のQRスキャナーでも読み取ります。

- [ ] Android ChromeでQRを読み取る
- [ ] QRを読み取った後、同じノードが現在地として設定される
- [ ] iPhone SafariでQRを読み取る
- [ ] QRを読み取った後、同じノードが現在地として設定される

結果：

```text
Android Chrome: □ OK / □ NG
iPhone Safari:   □ OK / □ NG
```

### 4. 未知のノードID

QRではなく、アプリで旧形式のノードIDを想定した入力確認を行います。`data.json` に存在しない例として `unknown-node-test` を使います。

- [ ] `unknown-node-test` を入力値としてアプリ内のQR処理へ渡したとき、「認識できないコードです」が表示される
- [ ] 再スキャンまたは手動選択へ進める
- [ ] アプリが停止・フリーズしない

結果：

```text
Android Chrome: □ OK / □ NG
iPhone Safari:   □ OK / □ NG
```

## 端末別総合記録

| テスト項目 | Android Chrome | iPhone Safari |
|---|---|---|
| 標準カメラ → URL確認 | □ OK / □ NG | □ OK / □ NG |
| URLを開く → 現在地自動設定 | □ OK / □ NG | □ OK / □ NG |
| アプリ内QRスキャン → 現在地設定 | □ OK / □ NG | □ OK / □ NG |
| 未知ノードID → エラー表示 | □ OK / □ NG | □ OK / □ NG |

## 不具合メモ

```text
発生端末:
ブラウザ:
発生した操作:
表示されたメッセージ:
再現条件:
備考:
```
