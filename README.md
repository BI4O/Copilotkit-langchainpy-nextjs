# CopilotKit + LangGraph + Next.js 集成教程

本教程演示如何将 CopilotKit 集成到 Next.js 应用中，连接到 LangGraph 后端服务。

## 前置条件

1. **LangGraph 服务运行在 `http://localhost:2024`**
   - 确保你的 LangGraph Platform 或 LangGraph Studio 已启动
   - 可以通过访问 `http://localhost:2024/docs` 验证服务是否运行

2. **Node.js 和 pnpm 环境**
   ```bash
   node --version  # 推荐 v18+
   pnpm --version  # 推荐 v8+
   ```

## 步骤 1: 创建 Next.js 项目

```bash
npx create-next-app@latest test-copilotkit
cd test-copilotkit
```

## 步骤 2: 安装 CopilotKit 依赖

```bash
pnpm add @copilotkit/react-ui @copilotkit/react-core @copilotkit/runtime openai@^4.85.1 zod@^3.23.8
```

**注意**:
- 使用 `openai@^4.85.1` 而不是最新版本，以避免 peer dependency 警告
- 如果遇到网络慢的问题，建议切换到国内镜像源：
  ```bash
  pnpm config set registry https://registry.npmmirror.com
  ```

## 步骤 3: 配置环境变量

创建 `.env` 文件：

```env
OPENAI_API_KEY=your_openai_api_key_here
# 可选：如果你的 LangGraph 服务不在默认地址
LANGGRAPH_DEPLOYMENT_URL=http://localhost:2024
# 可选：LangSmith 监控密钥
LANGSMITH_API_KEY=your_langsmith_api_key_here
```

## 步骤 4: 创建 CopilotKit API 路由

创建 `app/api/copilotkit/route.ts` 文件：

```typescript
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const serviceAdapter = new OpenAIAdapter({ openai } as any);

const runtime = new CopilotRuntime({
  agents: {
    'my_agent': new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024",
      graphId: 'agent',
    })
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
```

## 步骤 5: 验证 LangGraph 服务

检查你的 LangGraph 服务配置：

1. **验证服务运行状态**：
   ```bash
   curl http://localhost:2024/docs
   ```

2. **获取可用的 graph_id**：
   ```bash
   curl -X POST http://localhost:2024/assistants \
     -H "Content-Type: application/json" \
     -d '{"graph_id":"agent"}'
   ```

3. **查看 API 端点**：
   ```bash
   curl -s http://localhost:2024/openapi.json | jq '.paths | keys'
   ```

## 步骤 6: 启动开发服务器

```bash
pnpm dev
```

服务器应该运行在 `http://localhost:3000`。

## 步骤 7: 测试 API 连接

使用 curl 测试 CopilotKit API 端点：

**测试 1: 获取运行时信息 (推荐)**
```bash
# Linux/macOS/Git Bash
curl -X POST http://localhost:3000/api/copilotkit \
  -H "Content-Type: application/json" \
  -d '{"method":"info","params":{}}'

# Windows PowerShell
curl.exe -X POST http://localhost:3000/api/copilotkit -H "Content-Type: application/json" -d '{"method":"info","params":{}}'
```

**预期响应**:
```json
{
  "version": "0.0.33",
  "agents": {
    "my_agent": {
      "name": "my_agent",
      "description": "",
      "className": "LangGraphAgent"
    }
  },
  "audioFileTranscriptionEnabled": false
}
```

**测试 2: 运行 Agent (需要 LangGraph 后端正常工作)**
```bash
# Linux/macOS/Git Bash
curl -X POST http://localhost:3000/api/copilotkit \
  -H "Content-Type: application/json" \
  -d '{"method":"agent/run","params":{"agentId":"my_agent"},"body":{"messages":[{"role":"user","content":"Hello"}],"threadId":"test-thread-1"}}'

# Windows PowerShell
curl.exe -X POST http://localhost:3000/api/copilotkit -H "Content-Type: application/json" -d '{"method":"agent/run","params":{"agentId":"my_agent"},"body":{"messages":[{"role":"user","content":"Hello"}],"threadId":"test-thread-1"}}'
```

**CopilotKit API 协议说明**:
- CopilotKit 使用统一的单端点 API，所有操作都通过 `POST /api/copilotkit`
- 请求格式：`{"method": "操作类型", "params": {}, "body": {}}`
- 支持的方法：
  - `info` - 获取运行时信息
  - `agent/run` - 执行 agent
  - `agent/connect` - 建立持久连接
  - `agent/stop` - 停止 agent 执行

**测试结果解释**:
- ✅ **200 响应 + JSON 数据** - API 完全正常工作
- ❌ **连接超时** - LangGraph 后端可能有问题或配置不正确
- 🚫 **404 错误** - API 路由配置有问题
- 🚫 **Invalid single-route payload** - 请求格式错误（使用上面的正确格式）

## 步骤 8: 集成前端 CopilotKit 组件

现在我们已经验证了后端 API 正常工作，接下来集成前端组件。

### 8.1 修改 layout.tsx 添加 CopilotKit Provider

修改 `app/layout.tsx` 文件，添加 CopilotKit Provider：

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 导入 CopilotKit 相关组件
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 包装整个应用，提供 CopilotKit 上下文 */}
        <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

**关键改动说明**：
- 导入 `CopilotKit` 组件和样式文件
- 用 `CopilotKit` 包装整个应用
- `runtimeUrl="/api/copilotkit"` 指向我们创建的 API 端点
- `showDevConsole={false}` 禁用开发控制台（避免 MetaMask 检测问题）

### 8.2 修改 page.tsx 添加聊天界面

修改 `app/page.tsx` 文件，添加 CopilotSidebar：

```tsx
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Home() {
  return (
    <main>
      <h1>Your App</h1>
      <p>这是一个集成 CopilotKit + LangGraph 的示例应用</p>
      {/* 添加 CopilotKit 聊天侧边栏 */}
      <CopilotSidebar />
    </main>
  );
}
```

**说明**：
- `CopilotSidebar` 是 CopilotKit 提供的现成聊天界面
- 默认会显示一个"Open Chat"按钮
- 点击后会展开完整的聊天界面

### 8.3 测试前端集成

保存所有文件后，检查浏览器中的页面：

1. **页面应该显示**：
   - "Your App" 标题
   - 中文描述文字
   - "Open Chat" 按钮（CopilotSidebar）
   - "Powered by CopilotKit" 文字

2. **功能测试**：
   - 点击"Open Chat"按钮，应该展开聊天界面
   - 在输入框中输入消息
   - 点击发送按钮

**预期行为**：
- 聊天界面应该正常打开和关闭
- 消息应该能够发送（即使 LangGraph 后端可能还没完全配置好）
- 没有控制台错误

## 步骤 9: 解决 MetaMask 连接错误

### 9.1 问题描述

在使用过程中，你可能会遇到以下错误：
```
Uncaught (in promise) i: Failed to connect to MetaMask
Caused by: Error: MetaMask extension not found
```

### 9.2 问题原因

这个错误来自 CopilotKit 的开发控制台功能。它会自动检测浏览器中的各种扩展，包括 Web3 钱包（如 MetaMask），即使用户没有安装这些扩展。

### 9.3 解决方案

在 `app/layout.tsx` 中禁用开发控制台：

```tsx
<CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
  {children}
</CopilotKit>
```

**效果**：
- ✅ MetaMask 连接错误消失
- ✅ 聊天功能正常工作
- ⚠️ 开发时无法使用 CopilotKit 的调试控制台（生产环境应该关闭）

### 9.4 验证修复

刷新页面，重新测试：
1. 打开浏览器控制台，确认没有 MetaMask 错误
2. 点击"Open Chat"按钮，正常打开聊天界面
3. 发送消息，确认功能正常

## 步骤 10: 验证集成

检查以下内容，确认集成成功：

### 10.1 前端检查
- ✅ 页面正常显示，没有布局错误
- ✅ CopilotSidebar 组件正常渲染
- ✅ 点击"Open Chat"可以打开聊天界面
- ✅ 控制台没有错误信息

### 10.2 后端检查
- ✅ 开发服务器没有 TypeScript 编译错误
- ✅ API 请求能够到达 `/api/copilotkit` 端点
- ✅ 没有 LangGraph 连接错误（如果后端服务正常运行）

### 10.3 端到端测试
1. 打开聊天界面
2. 输入测试消息（如 "Hello"）
3. 点击发送
4. 观察是否有响应（需要 LangGraph 后端支持）

## 常见问题解决

### 1. TypeScript 错误：LangGraphAgent 类型不匹配

**问题**: `LangGraphAgent is missing properties from type 'AbstractAgent'`

**解决**: 确保从正确的路径导入：
```typescript
import { LangGraphAgent } from "@copilotkit/runtime/langgraph"; // 正确
// 而不是
import { LangGraphAgent } from "@copilotkit/runtime"; // 错误
```

### 2. Peer Dependency 警告

**问题**: `unmet peer openai@^4.85.1: found 5.9.0`

**解决**: 降级 OpenAI 到兼容版本：
```bash
pnpm add openai@^4.85.1
```

### 3. API 路由 404 错误

**问题**: `POST /api/copilotkit 404`

**解决**: 确保文件路径正确：
- 文件应该在 `app/api/copilotkit/route.ts`
- 而不是 `app/api/route.ts`

### 4. 网络下载慢

**解决**: 切换到国内镜像源：
```bash
pnpm config set registry https://registry.npmmirror.com
```

### 5. MetaMask 连接错误

**问题**: 页面出现 "Failed to connect to MetaMask" 错误，即使没有安装 MetaMask

**原因**: CopilotKit 的开发控制台会尝试检测各种浏览器扩展，包括 Web3 钱包

**解决**: 禁用 CopilotKit 开发控制台：
```tsx
// app/layout.tsx
<CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
  {children}
</CopilotKit>
```

这样会禁用开发时的调试控制台，同时避免不必要的 Web3 检测。

### 6. Agent ID 不匹配错误

**问题**: `useAgent: Agent 'my_agent' not found`

**原因**: API 路由中配置的 agent ID 与前端请求的不匹配

**解决**: 确保 agent ID 一致：
```typescript
// app/api/copilotkit/route.ts
const runtime = new CopilotRuntime({
  agents: {
    'default': new LangGraphAgent({  // 使用 'default' 而不是 'my_agent'
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024",
      graphId: 'agent',
    })
  },
});
```

### 7. HTML 结构错误

**问题**: `<main> cannot be a child of <html>`

**原因**: 在 layout.tsx 中意外删除了 `<body>` 标签

**解决**: 确保正确的 HTML 结构：
```tsx
<html lang="en">
  <body>
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKit>
  </body>
</html>
```

## 架构说明

```
Frontend (Next.js)     CopilotKit Runtime     LangGraph Backend
     │                        │                        │
     │  HTTP Request          │                        │
     ├──────────────────────►│                        │
     │                        │  HTTP Request          │
     │                        ├──────────────────────►│
     │                        │                        │  LangGraph
     │                        │◄──────────────────────│  Processing
     │  Response              │                        │
     │◄───────────────────────│                        │
```

- **CopilotKit Runtime**: 作为中间层，处理前端请求并转发到 LangGraph
- **LangGraphAgent**: 负责与 LangGraph Platform/Studio 的通信
- **OpenAIAdapter**: 提供 OpenAI 模型支持（如果需要）

## 下一步

现在你已经完成了基础集成，接下来可以：

1. **添加前端 CopilotKit 组件**
2. **配置自定义 Actions 和 Tools**
3. **添加状态管理**
4. **实现用户界面**

## 项目结构

完成集成后，项目结构如下：

```
test-copilotkit/
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts          # CopilotKit API 路由
│   ├── layout.tsx                # 根布局，包含 CopilotKit Provider
│   ├── page.tsx                  # 主页，包含 CopilotSidebar
│   └── globals.css               # 全局样式
├── .env                          # 环境变量配置
├── package.json                  # 项目依赖和脚本
├── pnpm-lock.yaml               # 锁定依赖版本
└── README.md                     # 本教程文档
```

**关键文件说明**：
- `app/api/copilotkit/route.ts`: 后端 API 端点，连接 LangGraph
- `app/layout.tsx`: 应用根布局，提供 CopilotKit 上下文
- `app/page.tsx`: 主页面组件，展示聊天界面
- `.env`: 存储敏感信息（API 密钥等）

## 总结

通过以上步骤，你成功地将 CopilotKit 集成到了 Next.js 应用中，并连接到了 LangGraph 后端。这为构建 AI 原生应用奠定了基础。

### ✅ 成功验证清单

完成教程后，你应该能够确认以下所有功能正常：

**后端集成**：
- ✅ CopilotKit API 路由正确创建在 `app/api/copilotkit/route.ts`
- ✅ API 端点响应 `info` 请求，返回运行时信息
- ✅ LangGraphAgent 配置正确，指向 `http://localhost:2024`
- ✅ 没有 TypeScript 编译错误

**前端集成**：
- ✅ CopilotKit Provider 正确包装应用
- ✅ CopilotSidebar 组件在页面中显示
- ✅ 点击"Open Chat"可以打开聊天界面
- ✅ 消息输入和发送功能正常
- ✅ 没有 MetaMask 连接错误

**整体功能**：
- ✅ 前后端通信正常
- ✅ 开发服务器稳定运行
- ✅ 浏览器控制台无错误
- ✅ 用户体验流畅

### 🚀 下一步建议

现在基础集成已经完成，你可以继续探索：

1. **自定义聊天界面**：使用 `useCopilotChat` hook 构建自定义 UI
2. **添加 Actions**：集成应用功能和数据到 AI 对话中
3. **多模态支持**：添加图片、文件上传等功能
4. **用户认证**：集成用户身份验证
5. **部署到生产**：将应用部署到 Vercel、Netlify 等平台

### 📚 相关资源

- [CopilotKit 官方文档](https://docs.copilotkit.ai)
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [Next.js 文档](https://nextjs.org/docs)

祝你在 AI 应用开发的道路上越走越远！🎉
