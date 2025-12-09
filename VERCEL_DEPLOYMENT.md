# Vercel 部署指南 / Vercel Deployment Guide
## 晨光國際少年團 - Sunrise Youth International

完整的 Vercel 部署教程 / Complete Vercel deployment tutorial

---

## 📋 部署前準備 / Pre-deployment Checklist

### 1. MongoDB Atlas 設置 / MongoDB Atlas Setup

⚠️ **重要**: Vercel 是無伺服器平台，不支持本地 MongoDB。您需要使用 MongoDB Atlas（雲端數據庫）。

**Important**: Vercel is a serverless platform and doesn't support local MongoDB. You need to use MongoDB Atlas (cloud database).

#### 步驟 / Steps:

1. **註冊 MongoDB Atlas** / Sign up for MongoDB Atlas
   - 訪問 https://www.mongodb.com/cloud/atlas/register
   - 創建免費帳號（Free Tier 足夠使用）

2. **創建集群** / Create a Cluster
   - 選擇 "Free Shared Cluster"
   - 選擇離台灣最近的地區（建議：Singapore 或 Tokyo）
   - 點擊 "Create Cluster"

3. **配置網絡訪問** / Configure Network Access
   - 左側菜單：Network Access
   - 點擊 "Add IP Address"
   - 選擇 "Allow Access from Anywhere" (0.0.0.0/0)
   - 確認

4. **創建數據庫用戶** / Create Database User
   - 左側菜單：Database Access
   - 點擊 "Add New Database User"
   - 設置用戶名和密碼（記住這些憑證！）
   - 權限：Read and write to any database
   - 添加用戶

5. **獲取連接字符串** / Get Connection String
   - 返回 Clusters
   - 點擊 "Connect" 按鈕
   - 選擇 "Connect your application"
   - 複製連接字符串，格式如下：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - 替換 `<username>` 和 `<password>` 為您的憑證
   - 可選：在 `mongodb.net/` 後添加數據庫名稱，如 `mongodb.net/sunrise-youth?retryWrites...`

---

## 🚀 Vercel 部署步驟 / Vercel Deployment Steps

### 方法 1: 通過 Vercel 網站部署（推薦）

#### 1. 推送代碼到 GitHub
```bash
# 確保所有更改已提交
git add .
git commit -m "Prepare for Vercel deployment"
git push origin claude/member-profile-system-013JxDdDUF6JU6KH49rToBpR
```

#### 2. 登入 Vercel
- 訪問 https://vercel.com
- 使用 GitHub 帳號登入

#### 3. 導入項目
- 點擊 "Add New..." → "Project"
- 從 GitHub 倉庫列表選擇 `sunriseyouthinternational-arch/website`
- 點擊 "Import"

#### 4. 配置項目

**Framework Preset**:
- 選擇 "Create React App"

**Root Directory**:
- 保持空白（使用項目根目錄）

**Build and Output Settings**:
- Build Command: `cd client && npm install && npm run build`
- Output Directory: `client/build`
- Install Command: `npm install`

**Environment Variables** - 點擊 "Environment Variables"，添加以下變量：

| Name | Value | 說明 |
|------|-------|------|
| `MONGODB_URI` | `mongodb+srv://...` | 您的 MongoDB Atlas 連接字符串 |
| `JWT_SECRET` | `your-secure-jwt-secret-key-change-this` | JWT 密鑰（請設置一個強密碼）|
| `NODE_ENV` | `production` | 環境設置 |
| `ADMIN_USERNAME` | `admin` | 管理員用戶名（可自定義）|
| `ADMIN_PASSWORD` | `your-secure-password` | 管理員密碼（請更改！）|

⚠️ **安全提示**:
- JWT_SECRET 應該是長且隨機的字符串
- 請更改默認的 ADMIN_PASSWORD
- 不要在公開的地方分享這些憑證

#### 5. 部署
- 點擊 "Deploy"
- 等待部署完成（約 2-5 分鐘）
- 部署成功後會顯示您的網站 URL

---

### 方法 2: 使用 Vercel CLI

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入 Vercel
vercel login

# 3. 在項目根目錄運行部署
vercel

# 4. 按照提示操作：
#    - Set up and deploy? Yes
#    - Which scope? 選擇您的帳號
#    - Link to existing project? No
#    - What's your project's name? sunrise-youth-international
#    - In which directory is your code located? ./
#    - Want to override the settings? Yes
#      - Build Command: cd client && npm install && npm run build
#      - Output Directory: client/build
#      - Development Command: npm run dev

# 5. 設置環境變量
vercel env add MONGODB_URI
# 輸入您的 MongoDB Atlas 連接字符串

vercel env add JWT_SECRET
# 輸入您的 JWT 密鑰

vercel env add NODE_ENV
# 輸入: production

vercel env add ADMIN_USERNAME
# 輸入管理員用戶名

vercel env add ADMIN_PASSWORD
# 輸入管理員密碼

# 6. 重新部署以應用環境變量
vercel --prod
```

---

## 🔧 部署後配置 / Post-Deployment Configuration

### 1. 創建默認管理員帳號

部署成功後，訪問以下 URL 創建管理員帳號：
```
https://your-app-name.vercel.app/api/auth/admin/create-default
```

或使用 curl:
```bash
curl -X POST https://your-app-name.vercel.app/api/auth/admin/create-default
```

**預期響應**:
```json
{
  "message": "默認管理員已創建 / Default admin created successfully"
}
```

如果已存在管理員：
```json
{
  "message": "管理員已存在 / Admin already exists"
}
```

### 2. 測試 API

訪問健康檢查端點：
```
https://your-app-name.vercel.app/api/health
```

應該返回：
```json
{
  "status": "ok",
  "message": "晨光國際少年團 API - Sunrise Youth International API",
  "timestamp": "2024-12-09T..."
}
```

### 3. 訪問網站

打開您的 Vercel 應用 URL：
```
https://your-app-name.vercel.app
```

您應該看到完整的網站界面！

---

## 📁 Vercel 項目結構說明

```
website/
├── api/                    # Vercel 無伺服器函數
│   ├── index.js           # 主 API 處理器
│   └── package.json       # API 依賴
├── client/                # React 前端
│   ├── build/            # 構建輸出（自動生成）
│   └── src/              # 源代碼
├── server/               # 後端邏輯
│   ├── models/          # MongoDB 模型
│   ├── routes/          # API 路由
│   │   ├── *-serverless.js  # Vercel 優化的路由
│   │   └── *.js             # 標準路由（本地開發）
│   └── middleware/      # 中間件
│       ├── upload-serverless.js  # 無伺服器上傳
│       └── upload.js             # 本地上傳
└── vercel.json          # Vercel 配置
```

### 關鍵差異：本地 vs Vercel

| 功能 | 本地開發 | Vercel（無伺服器）|
|------|---------|------------------|
| 數據庫 | MongoDB 本地 | MongoDB Atlas |
| 文件上傳 | 保存到磁盤 | Base64 存入數據庫 |
| 服務器 | Express 持久運行 | 無伺服器函數 |
| 圖片存儲 | `/uploads` 目錄 | MongoDB (base64) |

---

## 🎨 功能說明

### 圖片處理（Vercel 版本）

在 Vercel 環境中：
- ✅ 個人照片：轉換為 base64 存入 MongoDB
- ✅ 課程/活動橫幅：轉換為 base64 存入 MongoDB
- ✅ QR 碼：已經是 base64 格式
- ⚠️ 限制：單個圖片最大 5MB（個人照片）/ 10MB（橫幅）

### API 端點

所有 API 端點通過 `/api` 前綴訪問：

```
https://your-app.vercel.app/api/auth/admin/login
https://your-app.vercel.app/api/members/register
https://your-app.vercel.app/api/classes
https://your-app.vercel.app/api/activities
https://your-app.vercel.app/api/admin/members
```

---

## 🔍 故障排除 / Troubleshooting

### 問題 1: 部署失敗 - "Build failed"

**解決方案**:
- 檢查 Build Command 是否正確
- 確保 `client/package.json` 存在
- 查看 Vercel 構建日誌的詳細錯誤

### 問題 2: API 返回 "Database connection failed"

**可能原因**:
- MongoDB Atlas 連接字符串不正確
- IP 地址未加入白名單（應該是 0.0.0.0/0）
- 數據庫用戶憑證錯誤

**解決方案**:
1. 檢查環境變量中的 `MONGODB_URI`
2. 在 MongoDB Atlas 中驗證 Network Access 設置
3. 確認數據庫用戶名和密碼正確

### 問題 3: 圖片無法顯示

**解決方案**:
- Vercel 版本使用 base64 存儲圖片
- 檢查圖片大小是否超過限制（5MB/10MB）
- 確保上傳的是圖片格式（jpeg, jpg, png, gif）

### 問題 4: 管理員無法登入

**解決方案**:
1. 確保已運行創建管理員的命令
2. 檢查環境變量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
3. 查看瀏覽器控制台和 Vercel 日誌

### 問題 5: CORS 錯誤

**解決方案**:
- 前端和後端在同一域名下，不應該有 CORS 問題
- 如果出現，檢查 API 路由是否正確（/api/...）

---

## 🔐 安全性建議

### 生產環境清單：

- [ ] 更改默認管理員密碼
- [ ] 使用強 JWT_SECRET（至少 32 字符）
- [ ] 不要在代碼中硬編碼憑證
- [ ] 定期備份 MongoDB Atlas 數據庫
- [ ] 啟用 MongoDB Atlas 的備份功能
- [ ] 考慮設置自定義域名（Vercel 支持）
- [ ] 監控 Vercel Analytics 和日誌

---

## 📊 監控和日誌

### 查看日誌：

1. **Vercel Dashboard**:
   - 登入 Vercel
   - 選擇您的項目
   - 點擊 "Deployments"
   - 選擇部署
   - 查看 "Function Logs"

2. **MongoDB Atlas**:
   - 登入 Atlas
   - 選擇 Cluster
   - 點擊 "Metrics"
   - 查看連接數、操作數等

### 性能監控：

- Vercel Analytics: 訪問 `https://vercel.com/[username]/[project]/analytics`
- MongoDB Atlas Monitoring: 在 Atlas 控制面板中查看

---

## 🔄 更新部署

### 自動部署（推薦）:

每次推送到 GitHub，Vercel 會自動重新部署：

```bash
git add .
git commit -m "Update feature"
git push origin your-branch-name
```

### 手動部署:

```bash
vercel --prod
```

---

## 🌐 自定義域名（可選）

1. 在 Vercel Dashboard 中選擇項目
2. 點擊 "Settings" → "Domains"
3. 輸入您的自定義域名
4. 按照說明配置 DNS 記錄

---

## 📞 獲取幫助

### Vercel 支持：
- 文檔: https://vercel.com/docs
- 社區: https://github.com/vercel/vercel/discussions

### MongoDB Atlas 支持：
- 文檔: https://docs.atlas.mongodb.com
- 社區: https://www.mongodb.com/community/forums

---

## ✅ 部署成功檢查清單

完成部署後，驗證以下功能：

- [ ] 網站可以訪問
- [ ] 語言切換正常工作
- [ ] 可以註冊新團員
- [ ] QR 碼正常生成
- [ ] 可以上傳個人照片
- [ ] 管理員可以登入
- [ ] 可以創建課程和活動
- [ ] 可以報名課程/活動
- [ ] 付款狀態可以更新
- [ ] 所有頁面載入正常

---

## 🎉 恭喜！

您的晨光國際少年團網站已成功部署到 Vercel！

**下一步**:
1. 分享網站 URL 給團員
2. 開始添加課程和活動
3. 邀請團員註冊
4. 定期備份數據庫

**網站 URL**: https://your-app-name.vercel.app

享受您的新網站！🚀

---

**版本**: 1.0.0
**最後更新**: 2024年12月9日
**支持**: 晨光國際少年團 - Sunrise Youth International
