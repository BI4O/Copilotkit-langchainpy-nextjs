"use client";

import {
  CopilotChat,
  CopilotSidebar,
  CopilotPopup
} from "@copilotkit/react-ui";
import { useState } from "react";

// 这里写出三个不同的chatmode作为组件，也就是一个函数
function ChatComponent() {
  return (
    <CopilotChat
      className="absolute inset-0 flex flex-col px-80"
      labels={{
        placeholder: "输入你的问题...",
      }}
    />
  );
}

function SidebarComponent() {
  return (
    <div className="h-full">
      <CopilotSidebar
        labels={{
          placeholder: "输入你的问题...",
        }}
      />
    </div>
  );
}

function PopupComponent() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600 mb-4">点击右下角的聊天图标开始对话</p>
        <div className="text-left">
          <CopilotPopup
            labels={{
              placeholder: "输入你的问题...",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 这里写一下那个下拉的选项组件
function ChatModeSelector({
  chatMode,
  onModeChange
}: {
  chatMode: 'chat' | 'sidebar' | 'popup';
  onModeChange: (mode: 'chat' | 'sidebar' | 'popup') => void;
}) {
  return (
    <select
      value={chatMode}
      onChange={(e) => onModeChange(e.target.value as 'chat' | 'sidebar' | 'popup')}
      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="chat">Chat</option>
      <option value="sidebar">Sidebar</option>
      <option value="popup">Popup</option>
    </select>
  );
}

// 这里写一下合格header组件，要求下拉的组件放在h1的右边，而不是最右边
function Header({
  chatMode,
  onModeChange
}: {
  chatMode: 'chat' | 'sidebar' | 'popup';
  onModeChange: (mode: 'chat' | 'sidebar' | 'popup') => void;
}) {
  return (
    <header className="bg-white shadow-lg border-b-2 border-gray-200 px-10 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">AI Chat Assistant</h1>
        <ChatModeSelector chatMode={chatMode} onModeChange={onModeChange} />
      </div>
    </header>
  );
}

export default function Home() {
  const [chatMode, setChatMode] = useState<'chat' | 'sidebar' | 'popup'>('chat');

  return (
    <div className="h-screen flex flex-col">
      <Header chatMode={chatMode} onModeChange={setChatMode} />
      <div className="flex-1 relative">
        {chatMode === 'chat' && <ChatComponent />}
        {chatMode === 'sidebar' && <SidebarComponent />}
        {chatMode === 'popup' && <PopupComponent />}
      </div>
    </div>
  );
}
