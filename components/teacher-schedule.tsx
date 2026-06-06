'use client';

/**
 * TeacherScheduleWidget — shows a teacher's most recent student conversations.
 * Displayed on the dashboard for users with role="teacher".
 * Data comes from /api/messages (real thread data with last message previews).
 */

import { useEffect, useState } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface ConversationItem {
  threadId: number;
  studentName: string;
  studentUsername: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function TeacherScheduleWidget({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real thread data from the messages API
    fetch('/api/messages')
      .then(r => r.json())
      .then((d: any) => {
        const threads = d.threads ?? [];
        // Map thread data to typed conversation items — get the other participant
        const items: ConversationItem[] = threads.slice(0, 6).map((t: any) => {
          const isP1 = String(t.participant_1_id) === String(userId);
          return {
            threadId:        t.id,
            studentName:     isP1 ? t.p2_name     : t.p1_name,
            studentUsername: isP1 ? t.p2_username  : t.p1_username,
            lastMessage:     t.last_message ?? 'No messages yet',
            lastMessageAt:   t.last_message_at ?? t.created_at,
            unreadCount:     t.unread_count ?? 0,
          };
        });
        setConversations(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[#CC5060]" /> Recent Student Conversations
        </h2>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[#CC5060]" /> Recent Student Conversations
        </h2>
        <p className="text-sm text-white/50 py-2">No student conversations yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-[#CC5060]" /> Recent Student Conversations
      </h2>
      <div className="space-y-0">
        {conversations.map(conv => (
          <a
            key={conv.threadId}
            href={`/dashboard/messages/${conv.threadId}`}
            className="flex items-center gap-3 py-2.5 border-b border-white/8 last:border-0 group hover:opacity-80 transition-opacity"
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${conv.unreadCount > 0 ? 'bg-[#B84050]' : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white/90 group-hover:text-white">{conv.studentName}</span>
              <p className="text-xs text-white/50 truncate">{conv.lastMessage}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {conv.unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-[#B84050] text-white rounded-full h-4 w-4 flex items-center justify-center">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-[#CC5060]" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
