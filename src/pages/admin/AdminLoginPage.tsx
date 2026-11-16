import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { SupabaseSetupNotice } from '@/src/components/admin/SupabaseSetupNotice';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

export function AdminLoginPage() {
  const { isAuthenticated, loading, isConfigured, signInWithPasswordOnly } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password.trim()) {
      setErrorMessage('Please enter the admin password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithPasswordOnly(password);
      showToast('success', 'Admin unlocked', 'Welcome to the kitchen dashboard.');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid password.';
      setErrorMessage(msg);
      showToast('error', 'Access denied', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#FAF9F7] px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#645F58] hover:text-[#1A1917]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Storefront</span>
        </Link>

        <div className="mt-6 rounded-2xl border border-[#E6E1D8] bg-white p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2EFE9] text-[#1F4E3D]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#1A1917]">
                Kitchen Admin
              </h1>
              <p className="text-xs text-[#645F58]">
                Enter the admin password to manage menu &amp; orders
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#1A1917]">
                Admin Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  disabled={submitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] py-2.5 pl-3.5 pr-10 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#645F58] hover:text-[#1A1917]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#B91C1C]"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#1F4E3D] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#173B2E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Access Admin Dashboard'}
            </button>
          </form>
        </div>

        {!isConfigured && (
          <div className="mt-6">
            <SupabaseSetupNotice />
          </div>
        )}
      </div>
    </div>
  );
}
