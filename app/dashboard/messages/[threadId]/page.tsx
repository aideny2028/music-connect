'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/lib/language-context';
import { ChevronLeft, Send } from 'lucide-react';

export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const { t } = useLanguage();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch(`/api/messages/${threadId}`)
      .then(r => r.json())
      .then(d => {
        setThread(d.thread);
        setMessages(d.messages ?? []);
      });
  };

  useEffect(() => {
    load();
    const pollInterval = setInterval(load, 5000);
    return () => clearInterval(pollInterval);
  }, [threadId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getOther = () => {
    if (!thread) return null;
    if (String(thread.participant_1_id) === String(userId)) {
      return { name: thread.p2_name, username: thread.p2_username, avatar: thread.p2_avatar };
    }
    return { name: thread.p1_name, username: thread.p1_username, avatar: thread.p1_avatar };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Optimistic update — show message immediately
    const optimisticMsg = {
      id: Date.now(),
      thread_id: Number(threadId),
      sender_id: Number(userId),
      content: content.trim(),
      read_at: null,
      created_at: new Date().toISOString(),
      sender_name: 'You',
      sender_avatar: null,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const sentContent = content.trim();
    setContent('');
    setSending(true);

    await fetch(`/api/messages/${threadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: sentContent }),
    });
    setSending(false);
    load(); // Sync with server to get real message ID
  };

  const other = getOther();

  return (
    <div className="bg-transparent min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass-dark border-b border-white/10 px-4 py-3 sticky top-16 z-10">
        <div className="container mx-auto max-w-2xl flex items-center gap-3">
          <Link href="/dashboard/messages" className="text-white/60 hover:text-white shrink-0 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {other && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={other.avatar ?? ''} />
                <AvatarFallback className="bg-[#B84050] text-white text-sm">
                  {other.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link href={`/musicians/${other.username}`} className="font-semibold text-white hover:underline block truncate">
                  {other.name}
                </Link>
                {/* Show which listing this conversation is about */}
                {thread?.listing_title && (
                  <Link
                    href={`/listings/${thread.listing_id_link}`}
                    className="text-xs text-white/60 hover:text-white hover:underline truncate block transition-colors"
                  >
                    Re: {thread.listing_title}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="container mx-auto max-w-2xl space-y-3">
          {messages.map(msg => {
            const isMine = String(msg.sender_id) === String(userId);
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                {!isMine && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={msg.sender_avatar ?? ''} />
                    <AvatarFallback className="bg-[#B84050] text-white text-xs">
                      {msg.sender_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMine
                    ? 'bg-[#B84050] text-white rounded-br-sm'
                    : 'rounded-bl-sm border'
                }`} style={!isMine ? { background: 'var(--surface-raised)', color: 'var(--text)', borderColor: 'var(--border-strong)' } : undefined}>
                  {msg.content}
                  <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${isMine ? 'text-white/60' : 'text-faint'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {/* Read receipt — only show on my own messages */}
                    {isMine && (
                      <span title={msg.read_at ? `Seen ${new Date(msg.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Delivered'}>
                        {msg.read_at ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Compose */}
      <div className="border-t px-4 py-3 sticky bottom-0" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <form onSubmit={handleSend} className="container mx-auto max-w-2xl flex gap-2 items-end">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
            placeholder={t.messages.typeMessage}
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B84050]/60 transition-all max-h-32 overflow-y-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
          />
          <Button type="submit" size="icon" className="rounded-full h-9 w-9 shrink-0" disabled={sending || !content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
