# 🎬 VidNote — 智能视频笔记工具

<p align="center">
  <img src="public/favicon.svg" width="80" alt="VidNote Logo" />
</p>

<p align="center">
  <strong>边看视频，边做笔记。时间戳跳转 · 高光标记 · AI 自动总结</strong>
</p>

<p align="center">
  <a href="#功能特性">功能</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#使用说明">使用说明</a> •
  <a href="#项目结构">结构</a> •
  <a href="#开发路线">路线</a>
</p>

---

## ✨ 功能特性

### 🎯 核心功能

| 功能 | 说明 |
|------|------|
| ⏱ **时间戳笔记** | 播放视频时一键记录笔记，自动关联当前播放时间 |
| 🔗 **时间戳跳转** | 点击笔记中的时间戳，视频自动跳转到对应时刻 |
| ⭐ **高光标记** | 对重要内容标记"高光"，方便快速回顾 |
| 🤖 **AI 自动总结** | 基于 OpenAI GPT，一键生成视频内容总结和高光摘要 |
| 📥 **Markdown 导出** | 将笔记导出为 Markdown 文件，方便分享和归档 |

### 📋 三种模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| 🎬 **视频模式** | 播放 YouTube / 本地视频，边看边记 | 学习视频、教程、演讲 |
| 📡 **直播模式** | 计时器 + 🎤实时语音识别，自动记录 | 直播观看、线上活动 |
| 🎙️ **会议模式** | 计时器 + 🎤实时语音识别，自动记录 | 团队会议、讲座、讨论 |

### 🎤 实时语音识别（直播/会议模式）

- ✅ 基于 Web Speech API，**免费、零配置**
- ✅ 自动将语音转为带时间戳的笔记
- ✅ 支持中文、英文、日语、韩语
- ✅ 实时显示识别中的文字预览
- ⚠️ 推荐使用 Chrome 浏览器（兼容性最佳）

### 🎬 视频支持

- ✅ YouTube 在线视频
- ✅ 本地视频文件（MP4, WebM, MOV...）
- ✅ 拖拽上传

### 📝 笔记管理

- 添加 / 编辑 / 删除笔记
- 高光标记与筛选
- 关键词搜索
- 按时间戳排序

### 🤖 AI 总结

- 视频模式：生成视频概述、核心要点、关键结论
- 直播模式：生成内容概述、按时间排序的要点、精彩观点
- 会议模式：生成会议概述、讨论要点、**决策事项与行动计划 (Action Items)**

---

## 🚀 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/pilinmw/Vidnote.git
cd Vidnote

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173` 即可使用。

### 配置 AI 总结（可选）

1. 点击右上角 ⚙️ 设置按钮
2. 输入你的 [OpenAI API Key](https://platform.openai.com/api-keys)
3. 保存后即可使用 AI 总结功能

> 🔒 API Key 仅保存在浏览器本地存储中，不会上传到任何服务器。

---

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [React 19](https://react.dev/) | UI 框架 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [React Router v7](https://reactrouter.com/) | 路由 |
| [Zustand](https://zustand.docs.pmnd.rs/) | 状态管理 |
| [React Player](https://github.com/cookpete/react-player) | 视频播放器 |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | 实时语音识别 |
| [idb](https://github.com/jakearchibald/idb) | IndexedDB 封装 |
| [OpenAI API](https://platform.openai.com/) | AI 总结 |
| Vanilla CSS | 样式方案 |

---

## 📖 使用说明

### 基本操作流程

1. **创建项目** — 在首页点击"新建项目"，选择模式（视频/直播/会议），输入标题
2. **进入工作区** — 视频模式显示播放器，直播/会议模式显示计时器
3. **记录笔记** — 在右侧面板输入笔记内容，按 `⌘+Enter` 快速添加
4. **时间戳跳转** — 点击笔记左侧的时间戳，跳转到对应时刻
5. **标记高光** — 点击笔记的 ☆ 按钮，标记为高光
6. **AI 总结** — 展开底部 AI 总结面板，一键生成内容摘要
7. **导出笔记** — 点击 📥 按钮，导出为 Markdown 文件

### 直播/会议模式

1. 创建项目时选择"📡 直播记录"或"🎙️ 会议记录"
2. 进入工作区后，点击 **"开始记录"** 启动计时器
3. 点击 **🎤 开启语音识别** → 自动将语音转为带时间戳的笔记
4. 可选择识别语言（中/英/日/韩）
5. 也可以随时手动在右侧添加笔记
6. 可随时 **暂停/继续** 计时器
7. 结束后使用 AI 总结自动生成摘要（会议模式会额外生成行动计划）

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `⌘/Ctrl + Enter` | 快速添加笔记 |
| `双击笔记` | 编辑笔记内容 |
| `Enter` | 保存编辑 |
| `Escape` | 取消编辑 |

---

## 📁 项目结构

```
VidNote/
├── public/
│   └── favicon.svg            # 应用图标
├── src/
│   ├── components/            # React 组件
│   │   ├── Header.jsx         # 顶部导航栏
│   │   ├── VideoPlayer.jsx    # 视频播放器
│   │   ├── LiveTimer.jsx      # 直播/会议计时器
│   │   ├── NotePanel.jsx      # 笔记面板
│   │   ├── NoteItem.jsx       # 单条笔记
│   │   ├── NoteInput.jsx      # 笔记输入框
│   │   ├── AISummary.jsx      # AI 总结面板
│   │   ├── VideoCard.jsx      # 首页项目卡片
│   │   └── SettingsModal.jsx  # 设置弹窗
│   ├── pages/                 # 页面
│   │   ├── HomePage.jsx       # 首页
│   │   └── WorkspacePage.jsx  # 笔记工作区
│   ├── stores/                # Zustand 状态管理
│   │   ├── useVideoStore.js   # 视频/项目状态
│   │   └── useNoteStore.js    # 笔记状态
│   ├── services/              # 服务层
│   │   ├── storage.js         # IndexedDB 操作
│   │   ├── ai.js              # OpenAI API 集成
│   │   └── speech.js          # 语音识别服务
│   ├── utils/                 # 工具函数
│   │   └── formatTime.js      # 时间格式化等
│   ├── styles/                # 样式
│   │   ├── index.css          # 设计系统 & 全局样式
│   │   ├── components.css     # 组件样式
│   │   └── pages.css          # 页面样式
│   ├── App.jsx                # 根组件
│   └── main.jsx               # 入口文件
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🗺 开发路线

### ✅ Phase 1 — MVP（当前版本）

- [x] YouTube & 本地视频播放
- [x] 时间戳笔记（添加、编辑、删除）
- [x] 时间戳点击跳转
- [x] 高光标记 & 筛选
- [x] 笔记搜索
- [x] AI 自动总结（OpenAI）
- [x] Markdown 导出
- [x] 本地数据持久化（IndexedDB）
- [x] 暗色主题 UI
- [x] 直播模式（实时计时器 + 笔记）
- [x] 会议模式（会议计时器 + 行动计划总结）
- [x] 实时语音识别（Web Speech API，支持中/英/日/韩）
- [x] 语音自动生成时间戳笔记

### 🔲 Phase 2 — 增强

- [ ] 用户认证 & 云端同步（Supabase）
- [ ] Whisper API 高精度语音转写
- [ ] 视频字幕集成
- [ ] 多语言 AI 总结
- [ ] 协作笔记

### 🔲 Phase 3 — 移动端

- [ ] iOS / Android App

---

## 📄 许可证

[MIT License](LICENSE)

---

<p align="center">
  用 ❤️ 打造 by <a href="https://github.com/pilinmw">pilinmw</a>
</p>
