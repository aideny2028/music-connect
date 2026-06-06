'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/language-context';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    const loadThreads = () => {
      fetch('/api/messages')
        .then(r => r.json())
        .then(d => { setThreads(d.threads ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    loadThreads();
    const pollInterval = setInterval(loadThreads, 15000);
    return () => clearInterval(pollInterval);
  }, []);

  const getOther = (thread: any) => {
    if (String(thread.participant_1_id) === String(userId)) {
      return { name: thread.p2_name, username: thread.p2_username, avatar: thread.p2_avatar };
    }
    return { name: thread.p1_name, username: thread.p1_username, avatar: thread.p1_avatar };
  };

  if (loading) return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-2xl space-y-3">
        <div className="skeleton h-8 w-36 rounded mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t.messages.title}</h1>
          <Link href="/search" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Find a teacher →
          </Link>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">{t.messages.noThreads}</p>
            <a href="/search" className="text-sm text-white/70 hover:text-white hover:underline transition-colors">Browse teachers to get started →</a>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(thread => {
              const other = getOther(thread);
              return (
                <Link key={thread.id} href={`/dashboard/messages/${thread.id}`}>
                  <div className="glass rounded-xl border border-white/20 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={other.avatar ?? ''} />
                      <AvatarFallback className="bg-[#B84050] text-white">
                        {other.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-white truncate">{other.name}</span>
                        {thread.unread_count > 0 && (
                          <Badge className="bg-[#B84050] text-white text-xs shrink-0">{thread.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/70 truncate">{thread.last_message || 'No messages yet'}</p>
                    </div>
                    <div className="text-xs text-white/65 shrink-0">
                      {thread.last_message_at ? new Date(thread.last_message_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
