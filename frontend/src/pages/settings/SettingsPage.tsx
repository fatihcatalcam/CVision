import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Lock, Sparkles, Shield, Eye, EyeOff,
  Check, X, Loader2, Crown, Calendar, Mail,
} from 'lucide-react';

function SectionHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    password.length >= 8,
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-zinc-800'}`} />
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile section
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const profileChanged = fullName.trim() !== user?.full_name && fullName.trim().length >= 2;

  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword);

  const handleSaveProfile = async () => {
    if (!profileChanged) return;
    setIsSavingProfile(true);
    try {
      await api.patch('/auth/me', { full_name: fullName.trim() });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) { toast.error('Passwords do not match'); return; }
    if (!passwordValid) { toast.error('New password does not meet requirements'); return; }
    if (currentPassword === newPassword) { toast.error('New password must be different'); return; }

    setIsSavingPassword(true);
    try {
      await api.post('/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to change password';
      toast.error(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const quota = user?.plan_type === 'premium' ? 50 : 3;
  const used = user?.analysis_count ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-in slide-up">

      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Account Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your profile, security, and subscription</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left sidebar — account summary */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col items-center text-center gap-3 py-8">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-500/25">
              {(user?.full_name ?? 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{user?.full_name}</p>
              <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1 justify-center">
                <Mail className="w-3 h-3" /> {user?.email}
              </p>
            </div>

            {/* Plan badge */}
            {user?.plan_type === 'premium' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" /> Pro Member
              </div>
            ) : (
              <div className="w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold mb-3">
                  Free Plan
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 border border-indigo-500/30 text-white text-xs font-bold hover:from-indigo-600 hover:to-violet-600 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" /> Upgrade to Pro
                </button>
              </div>
            )}
          </Card>

          {/* Quick stats */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Usage</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Analyses used</span>
                <span className="text-white font-bold stat-number">{used} / {quota}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full rounded-full ${user?.plan_type === 'premium' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min((used / quota) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600">{Math.max(0, quota - used)} remaining this week</p>
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Member since
                </span>
                <span className="text-zinc-300 text-xs">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              {user?.role === 'admin' && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Role
                  </span>
                  <span className="text-amber-400 text-xs font-bold">Administrator</span>
                </div>
              )}
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="p-4 border-red-500/10">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Account</p>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full py-2 rounded-lg border border-zinc-800 text-zinc-500 text-xs font-medium hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
            >
              Sign Out
            </button>
          </Card>
        </div>

        {/* Right — forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile section */}
          <Card>
            <SectionHeader
              icon={User}
              title="Profile Information"
              desc="Update your display name"
            />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  minLength={2}
                  maxLength={150}
                  className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-11 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="w-full bg-[rgba(15,15,24,0.4)] border border-[var(--color-card-border)] rounded-xl h-11 px-4 text-zinc-500 cursor-not-allowed pr-24"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    Cannot change
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={!profileChanged || isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSavingProfile
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><Check className="w-4 h-4" /> Save Changes</>
                  }
                </button>
              </div>
            </div>
          </Card>

          {/* Password section */}
          <Card>
            <SectionHeader
              icon={Lock}
              title="Change Password"
              desc="Use a strong password with uppercase, lowercase, and numbers"
            />

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-11 px-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] rounded-xl h-11 px-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={newPassword} />
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className={`w-full bg-[rgba(15,15,24,0.8)] border rounded-xl h-11 px-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && !passwordsMatch
                        ? 'border-red-500/50 focus:ring-red-500/15 focus:border-red-500/60'
                        : confirmPassword && passwordsMatch
                        ? 'border-emerald-500/40 focus:ring-emerald-500/15 focus:border-emerald-500/50'
                        : 'border-[var(--color-card-border)] focus:ring-indigo-500/15 focus:border-indigo-500/60'
                    }`}
                  />
                  {confirmPassword && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {passwordsMatch
                        ? <Check className="w-4 h-4 text-emerald-400" />
                        : <X className="w-4 h-4 text-red-400" />}
                    </div>
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword || !currentPassword || !passwordValid || !passwordsMatch}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSavingPassword
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</>
                    : <><Lock className="w-4 h-4" /> Change Password</>
                  }
                </button>
              </div>
            </form>
          </Card>

        </div>
      </div>
    </div>
  );
}
