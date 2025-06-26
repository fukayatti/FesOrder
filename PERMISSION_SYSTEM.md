# 権限管理システム

このドキュメントでは、FesOrder アプリケーションの権限管理システムについて説明します。

## 概要

FesOrder では、ユーザーの役割（ロール）と個別権限に基づいて、ページアクセスと機能利用を制御する包括的な権限管理システムを実装しています。

## 主要コンポーネント

### 1. PermissionProvider (`src/components/PermissionProvider.tsx`)

-   アプリケーション全体の権限管理を行うコンテキストプロバイダー
-   ユーザーの権限情報を一元管理
-   リアルタイムでの権限チェック機能

### 2. PageGuard (`src/components/PageGuard.tsx`)

-   ページレベルでの権限制御
-   自動リダイレクト機能
-   カスタムエラーメッセージ表示

### 3. PermissionGuard (`src/components/PermissionGuard.tsx`)

-   コンポーネントレベルでの権限制御
-   既存コードとの後方互換性を維持

### 4. ProtectedNavigation (`src/components/ProtectedNavigation.tsx`)

-   権限に基づく動的ナビゲーション
-   アクセス可能な機能のみ表示

### 5. usePermissionCheck (`src/hooks/usePermissionCheck.ts`)

-   権限チェック用のカスタムフック
-   便利なヘルパー関数を提供

## 権限の種類

### 基本権限

-   `DASHBOARD_VIEW`: ダッシュボード表示
-   `MENU_READ/WRITE/DELETE`: メニュー管理
-   `ORDER_READ/WRITE/UPDATE/DELETE`: 注文管理
-   `SALES_READ/WRITE`: 売上管理
-   `USER_READ/WRITE/DELETE`: ユーザー管理
-   `ADMIN_PANEL`: 管理者パネル
-   `SETTINGS_MANAGE`: 設定管理

### ロール別デフォルト権限

#### admin（管理者）

-   全ての権限

#### manager（マネージャー）

-   ダッシュボード、メニュー、注文、売上、ユーザー管理
-   レポートと分析機能

#### staff（スタッフ）

-   ダッシュボード、メニュー閲覧、注文管理、売上閲覧

#### volunteer（ボランティア）

-   ダッシュボード、メニュー閲覧、注文閲覧のみ

#### custom（カスタム）

-   個別に設定された権限のみ

## 使用方法

### 1. ページに権限制御を追加

```tsx
import PageGuard from "@/components/PageGuard";
import { PERMISSIONS } from "@/components/PermissionProvider";

export default function MyPage() {
    return (
        <PageGuard
            requiredPermissions={[
                PERMISSIONS.MENU_READ,
                PERMISSIONS.MENU_WRITE,
            ]}
            customErrorMessage="メニュー管理権限が必要です"
        >
            {/* ページコンテンツ */}
        </PageGuard>
    );
}
```

### 2. コンポーネントに権限制御を追加

```tsx
import PermissionGuard from "@/components/PermissionGuard";
import { PERMISSIONS } from "@/components/PermissionProvider";

export default function MyComponent() {
    return (
        <PermissionGuard requiredPermissions={[PERMISSIONS.ORDER_WRITE]}>
            {/* 権限が必要なコンテンツ */}
        </PermissionGuard>
    );
}
```

### 3. 権限チェックフックの使用

```tsx
import { usePermissionCheck } from "@/hooks/usePermissionCheck";
import { PERMISSIONS } from "@/components/PermissionProvider";

export default function MyComponent() {
    const { hasPermission, isAdmin, executeWithPermission } =
        usePermissionCheck();

    const handleDelete = () => {
        executeWithPermission(
            PERMISSIONS.MENU_DELETE,
            () => {
                // 削除処理
            },
            () => {
                alert("削除権限がありません");
            }
        );
    };

    return (
        <div>
            {hasPermission(PERMISSIONS.MENU_WRITE) && (
                <button onClick={handleDelete}>削除</button>
            )}
            {isAdmin() && <button>管理者専用機能</button>}
        </div>
    );
}
```

### 4. 動的ナビゲーションの使用

```tsx
import ProtectedNavigation from "@/components/ProtectedNavigation";

export default function Dashboard() {
    return (
        <div>
            <h1>ダッシュボード</h1>
            <ProtectedNavigation
                showDescription={true}
                cardLayout={true}
                maxColumns={3}
            />
        </div>
    );
}
```

## 設定方法

### 1. 新しい権限の追加

`src/components/PermissionProvider.tsx`の`PERMISSIONS`オブジェクトに新しい権限を追加：

```tsx
export const PERMISSIONS = {
    // 既存の権限...
    NEW_FEATURE: "new_feature",
} as const;
```

### 2. ページ権限マッピングの更新

`PAGE_PERMISSION_MAP`に新しいページの権限要件を追加：

```tsx
export const PAGE_PERMISSION_MAP: Record<string, Permission[]> = {
    // 既存のマッピング...
    "/new-page": [PERMISSIONS.NEW_FEATURE],
};
```

### 3. ロール権限の更新

`ROLE_PERMISSIONS`で各ロールの権限を更新：

```tsx
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    manager: [
        // 既存の権限...
        PERMISSIONS.NEW_FEATURE,
    ],
};
```

## セキュリティ考慮事項

1. **クライアントサイド制御の限界**:

    - UI 上の権限制御は主に UX 向上のため
    - 実際のセキュリティはサーバーサイドで実装が必要

2. **権限の階層化**:

    - 上位ロール（admin, manager）は下位ロールの権限を含む
    - カスタムロールは明示的な権限設定が必要

3. **権限更新の反映**:
    - 権限変更後はページの再読み込みが必要な場合がある
    - リアルタイム更新には`refreshPermissions()`を使用

## トラブルシューティング

### よくある問題

1. **権限エラーが表示される**

    - ユーザーの権限設定を確認
    - 必要な権限がロールに含まれているか確認

2. **ページが表示されない**

    - `PAGE_PERMISSION_MAP`の設定を確認
    - コンソールエラーを確認

3. **権限更新が反映されない**
    - ブラウザのキャッシュをクリア
    - `refreshPermissions()`を呼び出し

### デバッグ方法

開発者コンソールで権限情報を確認：

```javascript
// 現在のユーザー権限を確認
console.log(window.__PERMISSION_DEBUG__);
```

## 今後の拡張予定

1. **動的権限管理**:

    - データベースベースの権限設定
    - リアルタイム権限更新

2. **細かい権限制御**:

    - リソースレベルの権限（特定の注文、メニューなど）
    - 時間制限付き権限

3. **監査ログ**:

    - 権限変更の履歴追跡
    - アクセスログの記録

4. **権限テンプレート**:
    - 事前定義された権限セット
    - 簡単な権限割り当て
