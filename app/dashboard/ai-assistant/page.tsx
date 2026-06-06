'use client';

/**
 * AI Assistant page for Music Connect.
 * Features: streaming typewriter responses, animated typing indicator,
 * floating input bar with glow, quick-action pill buttons.
 */

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bot, Send, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const QUICK_ACTIONS = [
  'How do I find a teacher?',
  'What are typical rates?',
  'How do I create a listing?',
  'Which districts are covered?',
  'Best instrument for beginners?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-[#B84050] shadow-[0_0_12px_rgba(184,64,80,0.4)]' : 'bg-white/10 border border-white/25'}`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Bot className="h-4 w-4 text-[#CC5060]" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-[#B84050] text-white rounded-tr-sm shadow-[0_0_16px_rgba(184,64,80,0.3)]'
          : 'glass text-white/90 rounded-tl-sm border border-white/20'
      }`}>
        {/* Render simple markdown-ish bold */}
        {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
            : <span key={i}>{part}</span>
        )}
        {message.streaming && (
          <span className="inline-block w-0.5 h-4 bg-[#CC5060] ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${currentUser?.name?.split(' ')[0] ?? 'there'}! 👋 I'm your Music Connect assistant. I can help you find teachers, understand pricing, create listings, or answer any questions about the platform. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok) throw new Error('Request failed');

      // Add an empty streaming assistant message
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { token } = JSON.parse(data);
            fullContent += token;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: fullContent, streaming: true };
              return updated;
            });
          } catch { /* skip malformed chunks */ }
        }
      }

      // Mark streaming complete
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullContent, streaming: false };
        return updated;
      });
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that right now. Please try again.",
      }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Page header */}
      <div className="glass-dark border-b border-white/18 px-4 py-4">
        <div className="container mx-auto max-w-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B84050]/20 border border-[#B84050]/30 flex items-center justify-center shadow-[0_0_16px_rgba(184,64,80,0.2)]">
            <Bot className="h-5 w-5 text-[#CC5060]" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">AI Assistant</h1>
            <p className="text-xs text-white/65">Ask me anything about Music Connect</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-3xl space-y-5">

          {/* Welcome card */}
          {messages.length === 1 && (
            <div className="glass rounded-2xl p-5 border border-white/20 mb-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#CC5060]" />
                <span className="text-sm font-semibold text-white">Quick Actions</span>
              </div>
              {/* Quick-action pill buttons */}
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-[#B84050]/15 border border-white/20 hover:border-[#B84050]/30 rounded-full px-3 py-1.5 transition-all duration-200 hover:shadow-[0_0_10px_rgba(184,64,80,0.2)]"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/25 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-[#CC5060]" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm border border-white/20">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick actions (persistent) */}
      {messages.length > 1 && (
        <div className="border-t border-white/5 px-4 py-2">
          <div className="container mx-auto max-w-3xl">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  disabled={isTyping}
                  className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-[#B84050]/15 border border-white/18 hover:border-[#B84050]/25 rounded-full px-3 py-1 transition-all duration-200 shrink-0 disabled:opacity-40"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating input bar */}
      <div className="border-t border-white/18 glass-dark px-4 py-4">
        <form onSubmit={handleSubmit} className="container mx-auto max-w-3xl">
          <div className={`flex items-center gap-3 glass rounded-2xl px-4 py-2.5 border border-white/20 transition-all duration-300 ${input ? 'border-[#B84050]/40 shadow-[0_0_20px_rgba(184,64,80,0.15)]' : ''}`}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything…"
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="btn-primary w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
