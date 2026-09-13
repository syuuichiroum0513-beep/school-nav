# 学内ナビゲーション データ投入ガイド

このファイルは、`data.json` に校内の地点（nodes）と移動区間（edges）を追加・修正するときのルールをまとめたものです。

## 1. node（地点）を追加する

`nodes` に次のようなオブジェクトを追加します。

```json
{
  "id": "main-201-room",
  "name": "201教室前",
  "building": "本館",
  "floor": 2,
  "type": "room"
}
```

### 必須項目

| 項目 | 内容 | 例 |
|---|---|---|
| `id` | 地点を一意に識別するID。QRコードにもそのまま使う | `main-201-room` |
| `name` | 画面に表示する地点名 | `201教室前` |
| `building` | 建物名 | `本館` |
| `floor` | 階数 | `2` |
| `kana` | 検索用の読み仮名。ひらがなで登録する | `にひゃくいちきょうしつまえ` |

`kana` は目的地検索で使う読み仮名です。基本はひらがなで登録してください。検索側ではひらがな・カタカナを同じものとして扱うため、利用者がどちらで入力しても一致します。

`type` は任意項目です。例として `entrance`、`junction`、`hall`、`room`、`teacher`、`bridge` などを使えます。目的地として扱う教員部屋には `type: "teacher"` を付けると、整合性チェッカーでも目的地として確認できます。

### id のルール

- 同じ `id` を2回使わない。
- 半角英数字と `-` を基本にする。
- QRコードに保存する文字列と完全一致させる。
- 後から変更すると、既に印刷したQRコードも使えなくなるため、登録後はなるべく変更しない。

QRコードはノードIDそのものではなく、`config.js` の `APP_BASE_URL` を基準にした `?node=ノードID` 形式のURLを生成します。

## 2. edge（移動区間）を追加する

`edges` に次のようなオブジェクトを追加します。

```json
{
  "from": "main-hall-1f",
  "to": "main-stair-east-1f",
  "cost": 1,
  "instruction": "東階段まで進んでください。"
}
```

### 項目

| 項目 | 内容 | 例 |
|---|---|---|
| `from` | 移動元ノードのID | `main-hall-1f` |
| `to` | 移動先ノードのID | `main-stair-east-1f` |
| `cost` | 経路選択に使う移動コスト。小さいほど優先される | `1` |
| `instruction` | 利用者へ表示する次の1手の案内文 | `東階段まで進んでください。` |

`from` と `to` は、必ず `nodes[].id` に存在するIDを指定してください。

## 3. 双方向のエッジについて

現在の `js/pathfinding.js` は、`data.json` に書いた1本のエッジを自動的に逆方向にも利用します。

そのため、**通常の廊下・階段・渡り廊下など、双方向に移動できる区間は1本だけ記述します。**

```json
{
  "from": "main-hall-1f",
  "to": "stair-east-1f",
  "cost": 1,
  "instruction": "東階段まで進んでください。"
}
```

この1本で、

- `main-hall-1f` → `stair-east-1f`
- `stair-east-1f` → `main-hall-1f`

の両方向が使えます。

**同じ双方向区間を2本書かないでください。** 重複すると将来データを変更するときに管理しづらくなります。

なお、現在のプロトタイプは基本的に全エッジを双方向として扱います。**一方通行・立入制限付き経路を表現する必要がある場合は、現行のデータ仕様だけでは対応していない**ため、別途 `oneWay` などの仕様追加が必要です。

## 4. cost の目安

学校内のナビゲーションでは、距離だけでなく「通りやすさ」を表す値として利用できます。

- `1` : 普通の廊下、近い階段
- `2` : 少し長い廊下、渡り廊下など
- `3` : 大きく迂回する区間など

絶対的な単位ではないので、同じ学校内ではルールをそろえてください。

## 5. 実例：本館1〜3階＋他棟への渡り廊下

以下は、このプロトタイプに入っているダミーデータの考え方です。

```json
{
  "nodes": [
    {"id":"main-entrance","name":"正門入口","building":"本館","floor":1,"type":"entrance"},
    {"id":"main-hall-1f","name":"本館1階ホール","building":"本館","floor":1,"type":"hall"},
    {"id":"main-stair-east-1f","name":"東階段 1階","building":"本館","floor":1,"type":"stair"},
    {"id":"main-stair-east-2f","name":"東階段 2階","building":"本館","floor":2,"type":"stair"},
    {"id":"main-hall-2f","name":"本館2階ホール","building":"本館","floor":2,"type":"hall"},
    {"id":"main-stair-east-3f","name":"東階段 3階","building":"本館","floor":3,"type":"stair"},
    {"id":"main-hall-3f","name":"本館3階ホール","building":"本館","floor":3,"type":"hall"},
    {"id":"bridge-2f","name":"2階渡り廊下入口","building":"本館・実験棟連絡部","floor":2,"type":"bridge"},
    {"id":"lab-building-2f","name":"実験棟2階ホール","building":"実験棟","floor":2,"type":"hall"},
    {"id":"teacher-a","name":"田中先生の部屋","building":"実験棟","floor":2,"type":"teacher"}
  ],
  "edges": [
    {"from":"main-entrance","to":"main-hall-1f","cost":1,"instruction":"正門から本館1階ホールまで直進してください。"},
    {"from":"main-hall-1f","to":"main-stair-east-1f","cost":1,"instruction":"右手の東階段へ進んでください。"},
    {"from":"main-stair-east-1f","to":"main-stair-east-2f","cost":1,"instruction":"東階段で2階まで上がってください。"},
    {"from":"main-stair-east-2f","to":"main-hall-2f","cost":1,"instruction":"階段を出て本館2階ホールへ進んでください。"},
    {"from":"main-hall-2f","to":"main-stair-east-3f","cost":1,"instruction":"東階段へ進んでください。"},
    {"from":"main-stair-east-3f","to":"main-hall-3f","cost":1,"instruction":"階段を出て本館3階ホールへ進んでください。"},
    {"from":"main-hall-2f","to":"bridge-2f","cost":1,"instruction":"2階の渡り廊下入口まで進んでください。"},
    {"from":"bridge-2f","to":"lab-building-2f","cost":2,"instruction":"渡り廊下を渡って実験棟2階へ進んでください。"},
    {"from":"lab-building-2f","to":"teacher-a","cost":1,"instruction":"左手の田中先生の部屋へ進んでください。"}
  ]
}
```

実際の校舎を登録するときは、まず「QRコードを置く地点」を決め、その後で「その地点間を安全に歩ける区間」をedgeとしてつないでください。

## 6. 追加・変更後の確認

変更後は、データ整合性チェッカーを実行してください。

```bash
npm install
node scripts/validate-data.js
```

問題がなければ `問題は見つかりませんでした。` と表示されます。警告が出た場合は、表示されたノードIDやエッジを `data.json` で確認してください。

QRコードを新しいノード分まで作り直す場合は、次を実行します。

```bash
node scripts/generate-qrcodes.js
```

生成されたQRコードの文字列は、必ず対応する `nodes[].id` と一致します。
