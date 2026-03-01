# 貨幣轉換器 (Currency Converter PWA)

這個工具提供即時、響應式界面，可將150多種全球貨幣轉換為實時數據並支持離線使用。

## 🎯 核心功能

### 1. 貨幣轉換器 (Converter)
- **智慧搜尋選單**：支援全球幣別代碼與中文關鍵字搜尋。
- **國家識別**：自動抓取並顯示幣別對應的真實「中文國家/地區」名稱。

### 2. 即時匯率資料表 (Exchange Rates)
- **報表匯出**：提供一鍵將所有匯率資料匯出為 CSV 檔案的功能。
- **置頂關注**：可將您最在意的貨幣「釘選」在頁面最上方，隨時追蹤。

### 3. 最愛清單與快速換算 (Favorites & Quick Convert)
- **清單管理**：自由新增或刪除愛用的「貨幣對」組合。
- **一鍵快速轉換**：在最愛清單點擊「快速轉換」按鈕，系統會自動跳回轉換器。

### 4. 漸進式網頁應用 (PWA) 支援
- **跨平台安裝**：支援安裝至手機主畫面或電腦桌面。
- **自動背景更新**：版本更新對使用者完全透明，背景自動下載新版本替換。
- **安全本機儲存**：使用者的偏好設定（釘選、最愛）皆以專屬 Namespace 安全地保存在瀏覽器中。

## 📁 專案結構

```text
src/
├── components/          # 視覺與共用標籤元件層 (Presentational Components)
│   ├── BottomNav.vue    # 行動端底部導覽列
│   ├── ConverterCard.vue# 轉換器核心演算元件
│   └── Sidebar.vue      # 桌面端側邊導覽列 (含 RWD 響應式封裝)
│
├── stores/              # 狀態管理層 (State Management via Pinia)
│   └── currency.js      # 業務邏輯核心：負責 API 介接、狀態持久化、與 Intl 名稱解析
│
├── views/               # 路由視圖層 (Container Components)
│   ├── ConverterView.vue# 轉換器主頁
│   ├── FavoritesView.vue# 最愛貨幣對管理與觸發頁面
│   └── RatesView.vue    # 即時匯率資料網格展示頁面
│
├── router/              # 應用程式路由定義 (Vue Router)
├── assets/              # 靜態資源 (含 Tailwind CSS 全域進入點 main.css)
└── App.vue              # 系統根元件 (Root Component & Layout Container)
```

## 🏁 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器（預設 http://localhost:3000）
pnpm dev

# 打包正式版本
pnpm build

# 預覽正式版本
pnpm preview
```

## 📜 License

MIT
