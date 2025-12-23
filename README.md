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

```bash
# 测试 API 端点是否可访问
curl -X POST http://localhost:3000/api/copilotkit \
  -H "Content-Type: application/json" \
  -d '{"action":"test","messages":[{"role":"user","content":"Hello"}]}'
```

**预期响应**:
- 可能会看到 `Invalid single-route payload` 错误，这是正常的
- 重要的是没有 404 错误，说明路由配置正确

## 步骤 8: 验证集成

检查开发服务器日志，应该看到：
- 没有 TypeScript 编译错误
- API 请求能够到达 `/api/copilotkit` 端点
- 没有连接 LangGraph 的错误信息

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

```
test-copilotkit/
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts          # CopilotKit API 路由
│   ├── layout.tsx
│   └── page.tsx
├── .env                          # 环境变量
├── package.json
└── README.md
```

## 总结

通过以上步骤，你成功地将 CopilotKit 集成到了 Next.js 应用中，并连接到了 LangGraph 后端。这为构建 AI 原生应用奠定了基础。
