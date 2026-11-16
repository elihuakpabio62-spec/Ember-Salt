import { useCallback, useEffect, useState } from 'react';
import { fetchContactMessages } from '@/src/services/menuService';
import type { ContactMessage } from '@/src/types';

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchContactMessages();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1A1917]">Contact Inquiries</h1>
        <p className="mt-1 text-sm text-[#645F58]">
          Private dining, catering, and dietary inquiries sent via the Contact page.
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[#B91C1C]/30 bg-white p-4">
          <p className="text-sm text-[#B91C1C]">{error}</p>
          <button
            type="button"
            onClick={loadMessages}
            className="rounded-lg border border-[#E6E1D8] px-3 py-1.5 text-xs font-medium text-[#1A1917]"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white border border-[#E6E1D8]" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-[#E6E1D8] bg-white p-12 text-center">
          <p className="font-display text-lg font-semibold text-[#1A1917]">No inquiries yet</p>
          <p className="mt-1 text-sm text-[#645F58]">
            Messages submitted via the Contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E6E1D8] rounded-xl border border-[#E6E1D8] bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#1A1917]">{msg.subject}</h2>
                <span className="font-mono text-xs text-[#645F58] tabular-nums">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#645F58]">
                From <span className="font-medium text-[#1A1917]">{msg.name}</span> &middot;{' '}
                {msg.email}
                {msg.phone ? ` · ${msg.phone}` : ''}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#1A1917]">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
