# jwt-parser

JWT をデコードして header / payload を表示する CLI です。`dependencies` はゼロで、Node.js 26 の標準 API だけで動きます。署名は検証しません。

## 使い方

```sh
jwt-parse <token>
pbpaste | jwt-parse            # 標準入力からも読める ("Bearer " は自動で除去)
jwt-parse --json <token> | jq  # JSON 出力
```

`iat` / `nbf` / `exp` / `auth_time` は JST・UTC・相対時間で表示し、`exp` / `nbf` には有効・期限切れ・未到来の状態を付けます。

| 終了コード | 意味           |
| ---------- | -------------- |
| 0          | 成功           |
| 1          | トークンが不正 |
| 2          | 引数が不正     |

## 開発

```sh
pnpm install
pnpm start <token>   # src/cli.ts を直接実行
vp test
vp check
vp pack              # dist/cli.mjs を生成
pnpm link --global   # jwt-parse コマンドとして使う
```
