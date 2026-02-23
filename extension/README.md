# 🔌 VidNote Browser Extension

Chrome / Edge 浏览器扩展版 VidNote，在 YouTube 页面上直接做笔记。

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 📌 **Side Panel 笔记面板** | 在浏览器侧边栏中记录笔记，不遮挡视频 |
| ⏱ **自动时间戳** | 添加笔记时自动关联当前视频播放时间 |
| 🔗 **时间戳跳转** | 点击笔记时间戳，视频自动跳转到对应时刻 |
| ⭐ **高光标记** | 标记重要笔记并筛选查看 |
| 🔍 **笔记搜索** | 快速检索笔记内容 |
| 🤖 **AI 总结** | 基于 OpenAI GPT 一键生成内容摘要 |
| 📥 **Markdown 导出** | 将笔记导出为 Markdown 文件 |
| 🎬 **浮动按钮** | YouTube 播放器上显示 VidNote 快捷入口 |

## 🚀 安装方式（开发者模式）

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择本项目的 `extension/` 文件夹
5. 扩展安装完成！

## 📖 使用方式

1. 访问任意 YouTube 视频页面
2. 点击浏览器工具栏中的 VidNote 图标，打开侧边栏
3. 在侧边栏中输入笔记内容，自动关联当前视频时间
4. 点击笔记的时间戳跳转到对应时刻
5. 使用搜索和高光筛选管理笔记

### AI 总结

1. 点击侧边栏 ⚙️ 设置按钮
2. 输入 OpenAI API Key
3. 展开 AI 总结面板，点击"全文总结"或"高光摘要"

## 🏗 架构说明

```
extension/
├── manifest.json            # Chrome Manifest V3 配置
├── background/
│   └── service-worker.js    # 后台服务（消息路由）
├── content/
│   ├── content.js           # YouTube 页面注入脚本
│   └── content.css          # 注入样式（浮动按钮）
├── sidepanel/
│   ├── panel.html           # 侧边栏面板 HTML
│   ├── panel.js             # 侧边栏交互逻辑
│   └── panel.css            # 侧边栏样式
├── shared/
│   ├── storage.js           # chrome.storage 封装
│   ├── ai.js                # OpenAI API 服务
│   └── utils.js             # 工具函数
└── icons/                   # 扩展图标
```

### 通信架构

```
YouTube 页面 (Content Script)
    ↕ chrome.runtime.sendMessage
Service Worker (Background)
    ↕ chrome.runtime.sendMessage
Side Panel (panel.js)
```

## 🌐 浏览器兼容性

| 浏览器 | 支持状态 | 备注 |
|--------|---------|------|
| Chrome | ✅ 完全支持 | Manifest V3 + Side Panel API |
| Edge   | ✅ 完全支持 | 与 Chrome 共用同一套代码 |
| Firefox | 🔲 计划中 | 需要适配 sidebar API |
| Safari | 🔲 计划中 | 需要 Xcode 包装 |
