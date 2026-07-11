# 英语口语情景陪练平台 - 使用说明

## 项目概述

这是一个基于 Next.js 的英语口语情景陪练 Web 应用，用户可以通过文字或语音输入，与 AI 进行情景对话练习，并获得智能评价反馈和学习进度追踪。

## 📋 使用前必读

### ⚠️ 必须完成的配置清单

在开始使用之前，您必须完成以下配置：

#### 1. 填入 DeepSeek API Key

**位置**：`src/lib/api.ts` 文件

**步骤**：
1. 打开 `src/lib/api.ts` 文件
2. 找到第 7 行的 `DEEPSEEK_API_KEY` 常量
3. 将 `YOUR_DEEPSEEK_API_KEY_HERE` 替换为您的实际 API Key

```typescript
// TODO: 请在此处填入您的 DeepSeek API Key
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY_HERE'; // 替换这里
```

**获取 API Key**：
- 访问 DeepSeek 官网：https://platform.deepseek.com/
- 注册账号并获取 API Key

#### 2. CORS 代理设置（可选）

如果遇到跨域问题（CORS），您可能需要设置代理：

**位置**：`src/lib/api.ts` 文件

**步骤**：
1. 找到第 11 行的 `CORS_PROXY` 常量
2. 如果需要使用代理，填入代理地址

```typescript
// TODO: 如果遇到 CORS 问题，可能需要设置代理
// 示例：const CORS_PROXY = 'https://your-cors-proxy.com/';
const CORS_PROXY = ''; // 如果需要代理，填入代理地址
```

#### 3. 确保浏览器支持 Web Speech API

本应用使用以下浏览器 API，请确保您的浏览器支持：
- `SpeechRecognition`（语音识别）
- `speechSynthesis`（语音合成）

**推荐浏览器**：
- Chrome（推荐）
- Edge
- Safari

**注意**：Firefox 对 Web Speech API 的支持有限

## 🚀 如何运行项目

### 开发环境运行

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm run dev

# 3. 打开浏览器访问 http://localhost:5000
```

### 生产环境构建和运行

```bash
# 1. 构建项目
pnpm run build

# 2. 启动生产服务器
pnpm run start
```

## 📱 功能模块说明

### 1. 对话练习模块
- **场景选择**：提供 3 个练习场景
  - 🍽️ 餐厅点餐：练习在餐厅点餐、询问菜品
  - ✈️ 机场值机：练习在机场办理登机手续
  - 📝 雅思口语考试：模拟雅思口语考试 Part 1 & Part 2
  
- **输入方式**：
  - 文字输入：直接在输入框输入英语回复
  - 语音输入：点击麦克风按钮进行语音识别（需要浏览器支持）
  
- **流式输出**：AI 回复采用打字机效果，一个字一个字显示

- **对话轮次**：最多 5 轮对话，或可手动结束

### 2. 智能评价模块
每次对话结束后，AI 自动生成评价报告：
- **四维评分**：
  - 语法准确性（0-100）
  - 词汇丰富度（0-100）
  - 流利度（0-100）
  - 发音（基于语音识别置信度估算）

- **详细分析**：
  - 2-3 个优点
  - 2-3 个需要改进的地方
  - 2-3 个具体学习建议
  - 语法纠正示例（如有错误）

### 3. 学习仪表盘模块
展示详细的学习统计数据：
- 总练习时长
- 总对话轮次
- 连续打卡天数
- 每日得分趋势折线图（最近 30 天）
- 四维能力雷达图
- 各场景练习次数柱状图

### 4. 历史记录模块
- 查看所有历史对话记录列表
- 点击记录查看完整对话内容和评价报告
- 可删除历史记录

## 🎨 设计特点

- **温暖友好的界面**：采用温暖珊瑚橙和柔和青绿的配色，营造轻松的学习氛围
- **响应式设计**：完美适配移动端和桌面端
- **流畅的交互**：打字机效果、语音波形动画、数字递增动画等
- **清晰的信息层级**：卡片式布局，模块化设计

## 🔧 技术栈

- **框架**：Next.js 16 (App Router)
- **核心**：React 19
- **语言**：TypeScript 5
- **UI 组件**：shadcn/ui (基于 Radix UI)
- **样式**：Tailwind CSS 4
- **图表**：ECharts 5.4.3 (CDN)
- **语音**：Web Speech API
- **AI**：DeepSeek API
- **数据存储**：localStorage

## ⚠️ 注意事项

### 语音功能
1. 语音识别需要浏览器支持 Web Speech API
2. 需要麦克风权限，首次使用时浏览器会请求权限
3. 语音识别默认使用英语（en-US）
4. 语音合成默认使用英语女声

### API 调用
1. 确保填入有效的 DeepSeek API Key
2. API 调用会产生费用，请注意使用量
3. 如果遇到 CORS 问题，可能需要设置代理

### 数据存储
1. 所有数据存储在浏览器 localStorage 中
2. 清除浏览器数据会丢失所有学习记录
3. 数据仅保存在本地，不会上传到服务器

## 📂 项目结构

```
.
├── src/
│   ├── app/                    # 页面路由
│   │   ├── page.tsx           # 首页（场景选择）
│   │   ├── dashboard/         # 学习仪表盘
│   │   ├── history/           # 历史记录
│   │   └── practice/          # 对话练习
│   ├── components/            # 组件
│   │   ├── ui/                # UI 组件库
│   │   ├── Navigation.tsx     # 导航栏
│   │   ├── Footer.tsx         # 底部栏
│   │   ├── MessageBubble.tsx  # 消息气泡
│   │   ├── InputArea.tsx      # 输入区域
│   │   ├── EvaluationResult.tsx # 评价结果
│   │   └── ECharts.tsx        # 图表组件
│   ├── hooks/                 # 自定义 Hooks
│   │   └── useSpeech.ts       # 语音识别和合成
│   ├── lib/                   # 工具库
│   │   ├── api.ts             # DeepSeek API
│   │   ├── storage.ts         # localStorage
│   │   └── utils.ts           # 工具函数
│   └── types/                 # 类型定义
│       └── index.ts           # 核心类型
├── DESIGN.md                  # 设计规范
├── SKILL.md                   # 本文档
└── AGENTS.md                  # 项目规范
```

## 🎯 使用流程

1. **选择场景**：在首页选择想要练习的场景
2. **开始对话**：点击"开始练习"进入对话界面
3. **输入回复**：通过文字或语音输入您的英语回复
4. **AI 对话**：AI 会根据场景扮演对应角色进行回复
5. **结束对话**：达到 5 轮或手动点击"结束对话"
6. **查看评价**：AI 自动生成评价报告
7. **查看统计**：在仪表盘查看学习数据
8. **回顾历史**：在历史记录查看过往对话

## 💡 学习建议

1. **定期练习**：每天至少练习 15 分钟，保持连续打卡
2. **多样化场景**：尝试不同的场景，提升不同情境下的表达能力
3. **重视评价**：认真阅读 AI 的评价和建议，针对性改进
4. **语音练习**：多使用语音输入，提升口语流利度
5. **复习历史**：定期回顾历史对话，巩固学习成果

## 🔗 相关链接

- DeepSeek 官网：https://platform.deepseek.com/
- Next.js 文档：https://nextjs.org/docs
- shadcn/ui 文档：https://ui.shadcn.com/
- ECharts 文档：https://echarts.apache.org/
- Web Speech API：https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

**祝您学习愉快！如有问题，请查看代码中的 TODO 注释或参考上述文档。**