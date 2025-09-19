'use client';

import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('@/components/chat/chat-interface').then(m => m.ChatInterface), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Loading chat...</div>
});

export default function ChatPage() {
  return <ChatInterface />;
}