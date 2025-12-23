import { CopilotSidebar } from "@copilotkit/react-ui"; // 按照官网改造1

export default function Home() {
  return (
    <main>
      <h1>Your App</h1>
      <p>这是一个集成 CopilotKit + LangGraph 的示例应用</p>
      {/* 按照官网改造2 */}
      <CopilotSidebar />
    </main>
  );
}
