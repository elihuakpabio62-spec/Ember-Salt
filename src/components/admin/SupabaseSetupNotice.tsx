import { useState } from 'react';
import { Check, Copy, Database } from 'lucide-react';
import { useToast } from '@/src/context/ToastContext';

const ENV_SNIPPET = `VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
VITE_WHATSAPP_NUMBER="15552348910"`;

export function SupabaseSetupNotice() {
  const { showToast } = useToast();
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(ENV_SNIPPET);
      setCopiedEnv(true);
      showToast('success', 'Environment template copied');
      window.setTimeout(() => setCopiedEnv(false), 2500);
    } catch {
      showToast('error', 'Clipboard unavailable', 'Copy the variables manually below.');
    }
  };

  return (
    <div className="rounded-xl border border-[#D97706]/40 bg-white p-6">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-[#1A1917]">
            Connect Your Supabase Project
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#645F58]">
            Supabase credentials are not configured in this environment yet. Admin authentication,
            live food CRUD, and Supabase Storage image uploads activate automatically once your
            project keys are added.
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#1A1917]">
            <li>
              Run the SQL script located at{' '}
              <code className="rounded bg-[#F2EFE9] px-1.5 py-0.5 font-mono text-xs">
                supabase/schema.sql
              </code>{' '}
              inside your Supabase SQL Editor.
            </li>
            <li>
              Add these environment variables to your <code className="font-mono text-xs">.env</code>{' '}
              or Vercel Project Settings:
            </li>
          </ol>

          <div className="mt-3 rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] p-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <span className="font-mono text-[11px] font-medium text-[#645F58]">
                Environment Variables
              </span>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E1D8] bg-white px-2.5 py-1 text-xs font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
              >
                {copiedEnv ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#1F4E3D]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-[#1A1917]">
              {ENV_SNIPPET}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
