# 晨光國際少年團 - Sunrise Youth International
## 團員管理系統 / Member Management System

完整的團員管理系統，支持中英文雙語切換。
A comprehensive member management system with bilingual support (Chinese/English).

## 功能特點 / Features

### 團員功能 / Member Features
- ✅ 團員註冊（包含家庭成員資料）/ Member registration (including family members)
- ✅ 個人專屬 QR 碼和會員編號 / Unique QR code and member ID
- ✅ 上傳和更新個人照片 / Upload and update profile picture
- ✅ 查看和更新個人資料 / View and update personal information
- ✅ 瀏覽可報名的課程和活動 / Browse available classes and activities
- ✅ 報名課程和活動 / Enroll in classes and activities
- ✅ 查看已報名的課程和活動 / View enrolled classes and activities
- ✅ 付款狀態追蹤 / Payment status tracking

### 管理員功能 / Admin Features
- ✅ 安全登入系統 / Secure login system
- ✅ 儀表板統計資訊 / Dashboard with statistics
- ✅ 查看所有團員資料 / View all member information
- ✅ 查看團員報名歷史 / View member enrollment history
- ✅ 新增和管理課程 / Add and manage classes
- ✅ 新增和管理活動 / Add and manage activities
- ✅ 更新參與者付款狀態 / Update participant payment status
- ✅ 查看課程/活動參與者名單 / View class/activity participant lists

## 技術棧 / Tech Stack

- **後端 / Backend**: Node.js, Express, MongoDB, Mongoose
- **前端 / Frontend**: React, React Router
- **認證 / Authentication**: JWT (JSON Web Tokens)
- **文件上傳 / File Upload**: Multer
- **QR 碼生成 / QR Code**: qrcode library

## 安裝說明 / Installation

### 前置需求 / Prerequisites

- Node.js (v14 或更高版本 / v14 or higher)
- MongoDB (本地或 MongoDB Atlas / Local or MongoDB Atlas)

### 步驟 / Steps

1. **克隆專案 / Clone the repository**
   ```bash
   git clone <repository-url>
   cd website
   ```

2. **安裝後端依賴 / Install backend dependencies**
   ```bash
   npm install
   ```

3. **安裝前端依賴 / Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **設置環境變量 / Set up environment variables**

   已經創建了 `.env` 文件，默認配置如下：
   The `.env` file has been created with default configuration:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sunrise-youth
   JWT_SECRET=sunrise_youth_secret_key_2024_change_in_production
   NODE_ENV=development
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

   **重要 / Important**: 生產環境請更改 JWT_SECRET 和管理員密碼！
   Please change JWT_SECRET and admin password in production!

5. **啟動 MongoDB / Start MongoDB**

   確保 MongoDB 正在運行（本地或雲端）
   Make sure MongoDB is running (locally or in cloud)

   ```bash
   # 本地 MongoDB / Local MongoDB
   mongod
   ```

6. **創建默認管理員帳號 / Create default admin account**

   啟動後端服務器後，訪問：
   After starting the backend server, visit:

   ```
   POST http://localhost:5000/api/auth/admin/create-default
   ```

   或使用 curl:
   Or use curl:

   ```bash
   curl -X POST http://localhost:5000/api/auth/admin/create-default
   ```

## 運行應用 / Running the Application

### 開發模式 / Development Mode

1. **啟動後端服務器 / Start backend server**
   ```bash
   npm run dev
   # 或 / or
   npm start
   ```

   後端將運行在 http://localhost:5000
   Backend will run on http://localhost:5000

2. **啟動前端開發服務器 / Start frontend dev server** (新終端 / new terminal)
   ```bash
   cd client
   npm start
   ```

   前端將運行在 http://localhost:3000
   Frontend will run on http://localhost:3000

### 生產模式 / Production Mode

1. **構建前端 / Build frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **設置環境變量 / Set environment variable**
   ```bash
   export NODE_ENV=production
   ```

3. **啟動服務器 / Start server**
   ```bash
   npm start
   ```

## 使用指南 / Usage Guide

### 團員使用 / For Members

1. **註冊成為團員 / Register as a member**
   - 訪問「註冊」頁面 / Visit the "Register" page
   - 填寫個人資料 / Fill in personal information
   - 可選：添加家庭成員資料 / Optional: Add family member information
   - 提交後獲得專屬 QR 碼和會員編號 / Receive unique QR code and member ID

2. **查看個人檔案 / View profile**
   - 在「個人檔案」頁面輸入會員編號 / Enter member ID on "Profile" page
   - 查看個人資料和 QR 碼 / View personal information and QR code
   - 上傳或更新個人照片 / Upload or update profile picture

3. **報名課程和活動 / Enroll in classes and activities**
   - 切換到「我的課程與活動」標籤 / Switch to "My Classes & Activities" tab
   - 瀏覽可用的課程和活動 / Browse available classes and activities
   - 點擊「報名」按鈕 / Click "Enroll" button
   - 記得於現場繳費 / Remember to pay at the venue

### 管理員使用 / For Admins

1. **登入管理員面板 / Login to admin panel**
   - 訪問「管理員」頁面 / Visit "Admin" page
   - 使用默認帳號：admin / admin123 / Use default credentials: admin / admin123
   - 或使用自定義管理員帳號 / Or use custom admin account

2. **管理團員 / Manage members**
   - 查看所有團員列表 / View all members list
   - 檢視團員詳細資料和報名歷史 / View member details and enrollment history

3. **管理課程和活動 / Manage classes and activities**
   - 新增課程/活動（填寫名稱、描述、時間、費用、教師、最大人數）
     Add classes/activities (name, description, time, cost, teacher, max participants)
   - 查看報名人員列表 / View enrolled participants list
   - 更新付款狀態 / Update payment status

## 目錄結構 / Project Structure

```
website/
├── server/                 # 後端 / Backend
│   ├── index.js           # 主服務器文件 / Main server file
│   ├── models/            # 數據庫模型 / Database models
│   │   ├── Member.js
│   │   ├── Class.js
│   │   ├── Activity.js
│   │   └── Admin.js
│   ├── routes/            # API 路由 / API routes
│   │   ├── auth.js
│   │   ├── members.js
│   │   ├── classes.js
│   │   ├── activities.js
│   │   └── admin.js
│   └── middleware/        # 中間件 / Middleware
│       ├── auth.js
│       └── upload.js
├── client/                # 前端 / Frontend
│   ├── public/
│   └── src/
│       ├── contexts/      # React Context (語言切換)
│       ├── pages/         # 頁面組件 / Page components
│       │   ├── Home.js
│       │   ├── Register.js
│       │   ├── Profile.js
│       │   ├── AdminLogin.js
│       │   └── AdminDashboard.js
│       ├── App.js
│       └── index.js
├── uploads/               # 上傳的文件 / Uploaded files
│   ├── profiles/         # 個人照片 / Profile pictures
│   └── banners/          # 課程/活動橫幅 / Class/activity banners
├── .env                   # 環境變量 / Environment variables
├── .gitignore
├── package.json
└── README.md
```

## API 端點 / API Endpoints

### 認證 / Authentication
- `POST /api/auth/admin/login` - 管理員登入 / Admin login
- `POST /api/auth/admin/create-default` - 創建默認管理員 / Create default admin

### 團員 / Members
- `POST /api/members/register` - 註冊團員 / Register member
- `GET /api/members/:memberId` - 獲取團員資料 / Get member info
- `PUT /api/members/:memberId` - 更新團員資料 / Update member info
- `POST /api/members/:memberId/profile-picture` - 上傳照片 / Upload profile picture

### 課程 / Classes
- `GET /api/classes` - 獲取所有課程 / Get all classes
- `GET /api/classes/:id` - 獲取課程詳情 / Get class details
- `POST /api/classes/:id/enroll` - 報名課程 / Enroll in class
- `POST /api/classes` - 新增課程 (管理員) / Add class (admin)

### 活動 / Activities
- `GET /api/activities` - 獲取所有活動 / Get all activities
- `GET /api/activities/:id` - 獲取活動詳情 / Get activity details
- `POST /api/activities/:id/enroll` - 報名活動 / Enroll in activity
- `POST /api/activities` - 新增活動 (管理員) / Add activity (admin)

### 管理員 / Admin
- `GET /api/admin/members` - 獲取所有團員 / Get all members
- `GET /api/admin/classes` - 獲取所有課程 / Get all classes
- `GET /api/admin/activities` - 獲取所有活動 / Get all activities
- `PUT /api/admin/classes/:classId/participants/:participantId/payment` - 更新付款狀態
- `GET /api/admin/dashboard/stats` - 獲取統計資料 / Get statistics

## 資料格式 / Date Formatting

系統使用台灣日期格式（中華民國曆法和西元紀年）
System uses Taiwan date formatting (ROC and Gregorian calendar)

## 安全性注意事項 / Security Notes

1. 生產環境請更改默認管理員密碼
   Change default admin password in production
2. 使用強密鑰作為 JWT_SECRET
   Use a strong secret key for JWT_SECRET
3. 考慮使用 HTTPS 加密傳輸
   Consider using HTTPS for encrypted transmission
4. 定期備份數據庫
   Regular database backups

## 故障排除 / Troubleshooting

### MongoDB 連接失敗 / MongoDB Connection Failed
- 確保 MongoDB 正在運行 / Ensure MongoDB is running
- 檢查 .env 中的 MONGODB_URI / Check MONGODB_URI in .env

### 端口已被占用 / Port Already in Use
- 更改 .env 中的 PORT / Change PORT in .env
- 或停止占用端口的進程 / Or stop the process using the port

### 無法上傳文件 / Cannot Upload Files
- 確保 uploads 目錄存在且有寫入權限
  Ensure uploads directory exists with write permissions

## 聯繫方式 / Contact

如有問題或建議，請聯繫：
For questions or suggestions, please contact:

晨光國際少年團 / Sunrise Youth International

## 授權 / License

ISC

---

**開發日期 / Development Date**: 2024
**版本 / Version**: 1.0.0
