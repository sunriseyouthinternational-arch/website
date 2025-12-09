# ✅ Vercel 部署檢查清單
# Vercel Deployment Checklist

## 📋 部署前準備 / Pre-Deployment

### 1. MongoDB Atlas 設置
- [ ] 註冊 MongoDB Atlas 帳號
- [ ] 創建免費集群（選擇離台灣近的區域）
- [ ] 設置網絡訪問為 0.0.0.0/0（允許所有 IP）
- [ ] 創建數據庫用戶（記錄用戶名和密碼）
- [ ] 獲取連接字符串（格式：mongodb+srv://...）

### 2. 準備環境變量值
複製以下內容並填寫您的值：

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sunrise-youth?retryWrites=true&w=majority
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD
```

⚠️ **重要提示**:
- 將 YOUR_USERNAME 和 YOUR_PASSWORD 替換為 MongoDB 憑證
- 將 YOUR_RANDOM_SECRET_KEY 替換為隨機字符串（例如：openssl rand -base64 32）
- 將 YOUR_SECURE_PASSWORD 替換為強密碼

---

## 🚀 Vercel 部署步驟

### 方法 1: 網站部署（推薦新手）

#### 步驟 1: 推送代碼
- [ ] 確保所有代碼已提交到 GitHub
- [ ] 檢查分支：claude/member-profile-system-013JxDdDUF6JU6KH49rToBpR

#### 步驟 2: Vercel 設置
- [ ] 訪問 https://vercel.com 並用 GitHub 登入
- [ ] 點擊 "Add New..." → "Project"
- [ ] 選擇您的 GitHub 倉庫
- [ ] 點擊 "Import"

#### 步驟 3: 配置項目
- [ ] Framework Preset: 選擇 "Create React App"
- [ ] Root Directory: 保持空白
- [ ] Build Command: `cd client && npm install && npm run build`
- [ ] Output Directory: `client/build`
- [ ] Install Command: `npm install`

#### 步驟 4: 環境變量
點擊 "Environment Variables"，逐一添加：

| 變量名 | 值 | 已添加？ |
|-------|-----|---------|
| MONGODB_URI | mongodb+srv://... | ⬜ |
| JWT_SECRET | 您的密鑰 | ⬜ |
| NODE_ENV | production | ⬜ |
| ADMIN_USERNAME | admin（或自定義）| ⬜ |
| ADMIN_PASSWORD | 您的密碼 | ⬜ |

#### 步驟 5: 部署
- [ ] 點擊 "Deploy" 按鈕
- [ ] 等待部署完成（2-5 分鐘）
- [ ] 記錄您的網站 URL（例如：https://your-app.vercel.app）

---

### 方法 2: CLI 部署（推薦進階用戶）

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入
vercel login

# 3. 部署
vercel

# 4. 添加環境變量（每個都要執行）
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NODE_ENV
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD

# 5. 生產部署
vercel --prod
```

- [ ] 已安裝 Vercel CLI
- [ ] 已登入 Vercel
- [ ] 已添加所有環境變量
- [ ] 部署成功

---

## 🔧 部署後配置

### 1. 創建管理員帳號
部署成功後，立即執行：

```bash
curl -X POST https://YOUR-APP.vercel.app/api/auth/admin/create-default
```

將 `YOUR-APP` 替換為您的 Vercel 應用名稱。

**預期響應**:
```json
{"message": "默認管理員已創建 / Default admin created successfully"}
```

- [ ] 管理員帳號已創建

### 2. 測試 API
```bash
curl https://YOUR-APP.vercel.app/api/health
```

**預期響應**:
```json
{
  "status": "ok",
  "message": "晨光國際少年團 API - Sunrise Youth International API",
  "timestamp": "..."
}
```

- [ ] API 健康檢查通過

### 3. 測試網站
在瀏覽器中訪問：`https://YOUR-APP.vercel.app`

檢查：
- [ ] 首頁正常顯示
- [ ] 語言切換功能正常
- [ ] 可以訪問註冊頁面
- [ ] 可以訪問個人檔案頁面
- [ ] 可以訪問管理員登入頁面

---

## ✅ 功能測試清單

### 團員功能測試

#### 註冊功能
- [ ] 填寫申請人資料
- [ ] 添加家庭成員（測試添加/刪除）
- [ ] 填寫聯絡方式
- [ ] 提交表單
- [ ] 收到會員編號
- [ ] QR 碼正常顯示
- [ ] 可以保存/下載 QR 碼

#### 個人檔案
- [ ] 使用會員編號登入
- [ ] 個人資料正確顯示
- [ ] QR 碼顯示正確
- [ ] 可以上傳個人照片
- [ ] 照片上傳後正常顯示（base64）
- [ ] 家庭成員資訊顯示正確

#### 課程與活動
- [ ] 可以查看可報名課程
- [ ] 可以查看可報名活動
- [ ] 可以報名課程
- [ ] 可以報名活動
- [ ] 報名後顯示在已報名列表
- [ ] 付款狀態正確顯示

### 管理員功能測試

#### 登入
- [ ] 使用配置的憑證登入
- [ ] 登入成功跳轉到儀表板
- [ ] Token 正確保存

#### 儀表板
- [ ] 統計數據正確顯示
- [ ] 總團員數正確
- [ ] 活躍課程數正確
- [ ] 活躍活動數正確

#### 團員管理
- [ ] 可以查看所有團員列表
- [ ] 團員資料完整顯示
- [ ] 報名數正確統計

#### 課程管理
- [ ] 可以添加新課程
- [ ] 可以上傳課程橫幅（base64）
- [ ] 課程資訊正確顯示
- [ ] 參與者列表正確
- [ ] 可以更新付款狀態（未付款→已付款）
- [ ] 可以更新付款狀態（已付款→未付款）

#### 活動管理
- [ ] 可以添加新活動
- [ ] 可以上傳活動橫幅（base64）
- [ ] 活動資訊正確顯示
- [ ] 參與者列表正確
- [ ] 可以更新付款狀態

### 雙語功能測試
- [ ] 中文顯示正常
- [ ] 英文顯示正常
- [ ] 語言切換即時生效
- [ ] 所有頁面都支持雙語

---

## 🔐 安全檢查

- [ ] 已更改默認管理員密碼（不是 admin123）
- [ ] JWT_SECRET 是隨機生成的（至少 32 字符）
- [ ] MongoDB 連接字符串包含正確憑證
- [ ] 環境變量未在代碼中硬編碼
- [ ] .env 文件在 .gitignore 中
- [ ] 密碼不在 GitHub 倉庫中

---

## 📊 性能和監控

### Vercel 監控
- [ ] 已啟用 Vercel Analytics
- [ ] 檢查函數執行時間
- [ ] 檢查錯誤日誌

### MongoDB Atlas 監控
- [ ] 檢查連接數
- [ ] 檢查存儲使用量
- [ ] 設置警報（可選）
- [ ] 啟用自動備份（可選）

---

## 🌐 自定義域名（可選）

如果您有自己的域名：
- [ ] 在 Vercel 中添加域名
- [ ] 配置 DNS 記錄
- [ ] 等待 DNS 傳播
- [ ] 驗證 SSL 證書
- [ ] 測試自定義域名訪問

---

## 📝 文檔和分享

- [ ] 記錄網站 URL
- [ ] 記錄管理員憑證（安全保存）
- [ ] 為團員創建使用指南（可選）
- [ ] 分享網站 URL 給相關人員

---

## 🎉 部署完成！

所有檢查項目完成後，您的網站已經成功部署並可以使用！

**網站 URL**: https://_________________.vercel.app

**管理員憑證**:
- 用戶名: ________________
- 密碼: ________________

**下一步**:
1. 開始添加課程和活動
2. 邀請團員註冊
3. 定期檢查和維護

---

## 📞 獲取幫助

如果遇到問題：
1. 查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) 的故障排除部分
2. 檢查 Vercel 部署日誌
3. 檢查 MongoDB Atlas 連接日誌
4. 訪問 Vercel 文檔：https://vercel.com/docs
5. 訪問 MongoDB Atlas 文檔：https://docs.atlas.mongodb.com

---

**版本**: 1.0.0
**最後更新**: 2024年12月9日
**狀態**: ✅ 準備部署
