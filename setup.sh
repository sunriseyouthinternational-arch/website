#!/bin/bash

echo "=========================================="
echo "晨光國際少年團 - Setup Script"
echo "Sunrise Youth International - Setup Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "❌ 未安裝 Node.js。請先安裝 Node.js。"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MongoDB is running
if ! command -v mongo &> /dev/null && ! command -v mongosh &> /dev/null; then
    echo "⚠️  MongoDB client not found. Please make sure MongoDB is installed and running."
    echo "⚠️  找不到 MongoDB 客戶端。請確保已安裝並運行 MongoDB。"
fi

echo ""
echo "📦 Installing backend dependencies..."
echo "📦 安裝後端依賴..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies."
    echo "❌ 後端依賴安裝失敗。"
    exit 1
fi

echo ""
echo "📦 Installing frontend dependencies..."
echo "📦 安裝前端依賴..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies."
    echo "❌ 前端依賴安裝失敗。"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup completed successfully!"
echo "✅ 設置完成！"
echo ""
echo "=========================================="
echo "Next steps / 下一步："
echo "=========================================="
echo ""
echo "1. Make sure MongoDB is running"
echo "   確保 MongoDB 正在運行"
echo ""
echo "2. Create default admin account (optional):"
echo "   創建默認管理員帳號（可選）："
echo "   curl -X POST http://localhost:5000/api/auth/admin/create-default"
echo ""
echo "3. Start the backend server:"
echo "   啟動後端服務器："
echo "   npm run dev"
echo ""
echo "4. In a new terminal, start the frontend:"
echo "   在新終端中啟動前端："
echo "   cd client && npm start"
echo ""
echo "5. Open browser and visit:"
echo "   打開瀏覽器訪問："
echo "   http://localhost:3000"
echo ""
echo "Default admin credentials / 默認管理員憑證："
echo "Username / 用戶名: admin"
echo "Password / 密碼: admin123"
echo ""
echo "=========================================="
