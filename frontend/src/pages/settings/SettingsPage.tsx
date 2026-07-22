import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Lock, Sparkles, Shield, Eye, EyeOff,
  Check, X, Loader2, Crown, Calendar, Mail, Sun, Bell,
  CreditCard, Download, Trash2, AlertTriangle, ChevronRight,
} from 'lucide-react';

function SectionHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 rounded-[var(--radius-md)] bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 text-[#1B3A6B] dark:text-[#4a7dd1] flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4]">{title}</h2>
        <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">{desc}</p>
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
  const colors = ['', 'bg-[#9F2F2D]', 'bg-[#956400]', 'bg-[#956400]', 'bg-[#346538]'];
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-[#EAEAEA] dark:bg-white/[0.07]'}`} />
      ))}
    </div>
  );
}

const NOTIF_KEY = 'cvision_notify_analysis';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('tr') ? 'tr-TR' : 'en-GB';
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const profileChanged = fullName.trim() !== user?.full_name && fullName.trim().length >= 2;

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword);

  // Notifications (localStorage)
  const [notifyAnalysis, setNotifyAnalysis] = useState(() =>
    localStorage.getItem(NOTIF_KEY) !== 'false'
  );

  // Subscription
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Data export
  const [isExporting, setIsExporting] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, String(notifyAnalysis));
  }, [notifyAnalysis]);

  const handleSaveProfile = async () => {
    if (!profileChanged) return;
    setIsSavingProfile(true);
    try {
      await api.patch('/auth/me', { full_name: fullName.trim() });
      await refreshUser();
      toast.success(t('settings.profile.successToast'));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('settings.profile.errorToast'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) { toast.error(t('settings.password.errorNoMatch')); return; }
    if (!passwordValid) {
      // Name the exact failing rules rather than a generic "doesn't meet
      // requirements". Mirrors RegisterPage / ResetPasswordPage.
      const missing: string[] = [];
      if (newPassword.length < 8) missing.push(t('auth.register.reqLength'));
      if (!/[A-Z]/.test(newPassword)) missing.push(t('auth.register.reqUpper'));
      if (!/[a-z]/.test(newPassword)) missing.push(t('auth.register.reqLower'));
      if (!/\d/.test(newPassword)) missing.push(t('auth.register.reqNumber'));
      toast.error(`${t('auth.register.passwordMissing')} ${missing.join(', ')}`);
      return;
    }
    if (currentPassword === newPassword) { toast.error(t('settings.password.errorSame')); return; }
    setIsSavingPassword(true);
    try {
      await api.post('/auth/me/password', { current_password: currentPassword, new_password: newPassword });
      toast.success(t('settings.password.successToast'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || t('settings.password.errorToast'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      const res = await api.post('/payment/lemon/cancel');
      toast.success(res.data.message || t('settings.subscription.cancelSuccessToast'));
      await refreshUser();
      setShowCancelConfirm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('settings.subscription.cancelErrorToast'));
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/auth/me/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvision-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.data.exportSuccessToast'));
    } catch (err: any) {
      toast.error(t('settings.data.exportErrorToast'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) {
      toast.error(t('settings.data.emailMismatchToast'));
      return;
    }
    setIsDeletingAccount(true);
    try {
      await api.delete('/auth/me');
      logout();
      navigate('/');
      toast.success(t('settings.data.deleteSuccessToast'));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('settings.data.deleteErrorToast'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const quota = user?.plan_type === 'premium' ? 50 : 3;
  const used = user?.analysis_count ?? 0;
  const usagePercent = Math.min((used / quota) * 100, 100);
  const initials = (user?.full_name ?? 'U')[0].toUpperCase();

  const subEndDate = user?.subscription_end_at
    ? new Date(user.subscription_end_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const inputCls = 'w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] rounded-[var(--radius-md)] h-11 px-4 focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all';
  const saveBtnCls = 'flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[#1B3A6B] dark:bg-[#4a7dd1] text-white text-sm font-bold transition-all hover:bg-[#122a52] dark:hover:bg-[#3a6dc1] disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-in slide-up">

      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> {t('settings.backToDashboard')}
      </button>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl tracking-tight text-[#111111] dark:text-[#e8e7e4]">{t('settings.title')}</h1>
          <p className="text-[#787774] dark:text-[#908d89] text-sm mt-1">{t('settings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col items-center text-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-[#F7F6F3] dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] flex items-center justify-center mb-3">
              <span className="text-lg font-medium text-[#787774] dark:text-[#908d89]">{initials}</span>
            </div>
            <div>
              <p className="text-[#111111] dark:text-[#e8e7e4] font-bold text-lg leading-tight">{user?.full_name}</p>
              <p className="text-[#787774] dark:text-[#908d89] text-xs mt-0.5 flex items-center gap-1 justify-center">
                <Mail className="w-3 h-3" /> {user?.email}
              </p>
            </div>
            {user?.plan_type === 'premium' ? (
              <span className="badge badge-info">
                <Crown className="w-3.5 h-3.5 inline-block mr-1" /> {t('settings.proBadge')}
              </span>
            ) : (
              <div className="w-full">
                <span className="badge badge-neutral mb-3 inline-block">{t('settings.freeBadge')}</span>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full py-2 rounded-[var(--radius-md)] bg-[#1B3A6B] text-white text-xs font-bold hover:bg-[#122a52] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" /> {t('settings.upgradeToPro')}
                </button>
              </div>
            )}
          </Card>

          {/* Usage */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold text-[#787774] uppercase tracking-wider">{t('settings.usageSection')}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#787774] dark:text-[#908d89]">{t('settings.analysesUsed')}</span>
                <span className="text-[#111111] dark:text-[#e8e7e4] font-bold stat-number">{used} / {quota}</span>
              </div>
              <div className="w-full h-1.5 bg-[#EAEAEA] dark:bg-white/[0.07] rounded-full">
                <div className="h-full bg-[#1B3A6B] dark:bg-[#4a7dd1] rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
              </div>
              <p className="text-[10px] text-[#787774] dark:text-[#908d89]">{Math.max(0, quota - used)} {t('settings.remainingThisWeek')}</p>
            </div>
            <div className="pt-2 border-t border-[#EAEAEA] dark:border-white/[0.07] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#787774] dark:text-[#908d89] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {t('settings.memberSince')}
                </span>
                <span className="text-[#111111] dark:text-[#e8e7e4] text-xs">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' }) : '-'}
                </span>
              </div>
              {user?.role === 'admin' && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#787774] dark:text-[#908d89] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> {t('settings.roleLabel')}
                  </span>
                  <span className="text-[#956400] text-xs font-bold">{t('settings.roleAdmin')}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Account actions */}
          <Card className="p-4 space-y-2">
            <p className="text-xs font-bold text-[#787774] uppercase tracking-wider mb-3">{t('settings.accountSection')}</p>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full py-2 rounded-[var(--radius-sm)] border border-[#EAEAEA] dark:border-white/[0.07] text-[#787774] dark:text-[#908d89] text-xs font-medium hover:text-[#9F2F2D] hover:border-[#9F2F2D]/30 hover:bg-[#9F2F2D]/5 transition-all"
            >
              {t('settings.signOut')}
            </button>
          </Card>
        </div>

        {/* Right forms */}
        <div className="lg:col-span-2 space-y-5">

          {/* 1 - Profile */}
          <div className="surface p-6">
            <SectionHeader icon={User} title={t('settings.profile.title')} desc={t('settings.profile.subtitle')} />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] uppercase tracking-wider">{t('settings.profile.fullName')}</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  minLength={2} maxLength={150} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] uppercase tracking-wider">{t('settings.profile.email')}</label>
                <div className="relative">
                  <input type="email" value={user?.email ?? ''} disabled
                    className="w-full bg-[#F7F6F3] dark:bg-white/[0.03] border border-[#EAEAEA] dark:border-white/[0.07] text-[#A09D9A] dark:text-[#6a6764] rounded-[var(--radius-md)] h-11 px-4 cursor-not-allowed pr-28" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#787774] dark:text-[#908d89] bg-[#EAEAEA] dark:bg-white/[0.07] px-2 py-0.5 rounded border border-[#D5D3D0] dark:border-white/[0.05]">
                    {t('settings.profile.cannotChange')}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveProfile} disabled={!profileChanged || isSavingProfile} className={saveBtnCls}>
                  {isSavingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.saving')}</> : <><Check className="w-4 h-4" /> {t('settings.profile.saveButton')}</>}
                </button>
              </div>
            </div>
          </div>

          {/* 2 - Password */}
          <div className="surface p-6">
            <SectionHeader icon={Lock} title={t('settings.password.title')} desc={t('settings.password.subtitle')} />
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] uppercase tracking-wider">{t('settings.password.current')}</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)} placeholder={t('settings.password.currentPlaceholder')} required
                    className={`${inputCls} pr-12`} />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A09D9A] hover:text-[#787774] transition-colors p-1">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] uppercase tracking-wider">{t('settings.password.new')}</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} placeholder={t('settings.password.newPlaceholder')} required minLength={8}
                    className={`${inputCls} pr-12`} />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A09D9A] hover:text-[#787774] transition-colors p-1">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={newPassword} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] uppercase tracking-wider">{t('settings.password.confirm')}</label>
                <div className="relative">
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t('settings.password.confirmPlaceholder')} required
                    className={`${inputCls} pr-12 ${confirmPassword && !passwordsMatch ? 'border-[#9F2F2D]/50 focus:border-[#9F2F2D] focus:ring-[#9F2F2D]/15' : confirmPassword && passwordsMatch ? 'border-[#346538]/40 focus:border-[#346538] focus:ring-[#346538]/15' : ''}`} />
                  {confirmPassword && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {passwordsMatch ? <Check className="w-4 h-4 text-[#346538]" /> : <X className="w-4 h-4 text-[#9F2F2D]" />}
                    </div>
                  )}
                </div>
                {confirmPassword && !passwordsMatch && <p className="text-xs text-[#9F2F2D]">{t('settings.password.noMatch')}</p>}
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSavingPassword || !currentPassword || !passwordValid || !passwordsMatch} className={saveBtnCls}>
                  {isSavingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('settings.password.changingButton')}</> : <><Lock className="w-4 h-4" /> {t('settings.password.changeButton')}</>}
                </button>
              </div>
            </form>
          </div>

          {/* 3 - Appearance */}
          <div className="surface p-6">
            <SectionHeader icon={Sun} title={t('settings.appearance.title')} desc={t('settings.appearance.subtitle')} />
            <div className="flex items-center justify-between py-3 border-b border-[#EAEAEA] dark:border-white/[0.07] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4]">{t('settings.appearance.theme')}</p>
                <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">{t('settings.appearance.themeDesc')}</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* 4 - Notifications */}
          <div className="surface p-6">
            <SectionHeader icon={Bell} title={t('settings.notifications.title')} desc={t('settings.notifications.subtitle')} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4]">{t('settings.notifications.analysisComplete')}</p>
                  <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">{t('settings.notifications.analysisCompleteDesc')}</p>
                </div>
                <button
                  onClick={() => setNotifyAnalysis(!notifyAnalysis)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifyAnalysis ? 'bg-[#1B3A6B] dark:bg-[#4a7dd1]' : 'bg-[#EAEAEA] dark:bg-white/[0.1]'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifyAnalysis ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <div>
                  <p className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4]">{t('settings.notifications.weeklyDigest')}</p>
                  <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">{t('settings.notifications.weeklyDigestDesc')}</p>
                </div>
                <span className="text-[10px] text-[#787774] dark:text-[#908d89] bg-[#F7F6F3] dark:bg-white/[0.05] border border-[#EAEAEA] dark:border-white/[0.07] px-2 py-0.5 rounded-full">{t('settings.notifications.comingSoon')}</span>
              </div>
            </div>
          </div>

          {/* 5 - Subscription */}
          <div className="surface p-6">
            <SectionHeader icon={CreditCard} title={t('settings.subscription.title')} desc={t('settings.subscription.subtitle')} />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7F6F3] dark:bg-white/[0.04] border border-[#EAEAEA] dark:border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${user?.plan_type === 'premium' ? 'bg-amber-500/10 text-amber-500' : 'bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 text-[#1B3A6B] dark:text-[#4a7dd1]'}`}>
                    {user?.plan_type === 'premium' ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">
                      {user?.plan_type === 'premium' ? t('settings.subscription.proPlan') : t('settings.subscription.freePlan')}
                    </p>
                    <p className="text-xs text-[#787774] dark:text-[#908d89]">
                      {user?.plan_type === 'premium'
                        ? subEndDate ? t('settings.subscription.renews', { date: subEndDate }) : t('settings.subscription.price')
                        : t('settings.subscription.freeLimit')}
                    </p>
                  </div>
                </div>
                {user?.plan_type === 'free' && (
                  <button onClick={() => navigate('/pricing')}
                    className="flex items-center gap-1 text-xs font-bold text-[#1B3A6B] dark:text-[#4a7dd1] hover:underline">
                    {t('settings.subscription.upgradeButton')} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {user?.plan_type === 'premium' && (
                <>
                  {!showCancelConfirm ? (
                    <button onClick={() => setShowCancelConfirm(true)}
                      className="text-xs text-[#787774] dark:text-[#908d89] hover:text-[#9F2F2D] dark:hover:text-[#d4524f] transition-colors underline underline-offset-2">
                      {t('settings.subscription.cancelButton')}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <p className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4] mb-1">{t('settings.subscription.cancelConfirmTitle')}</p>
                      <p className="text-xs text-[#787774] dark:text-[#908d89] mb-4">
                        {t('settings.subscription.cancelConfirmBody', { date: subEndDate || '...' })}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={handleCancelSubscription} disabled={cancellingSubscription}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9F2F2D]/10 text-[#9F2F2D] dark:text-[#d4524f] text-xs font-bold hover:bg-[#9F2F2D]/15 transition-colors disabled:opacity-50">
                          {cancellingSubscription ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          {t('settings.subscription.cancelYes')}
                        </button>
                        <button onClick={() => setShowCancelConfirm(false)}
                          className="px-4 py-2 rounded-lg border border-[#EAEAEA] dark:border-white/[0.07] text-xs font-medium text-[#787774] dark:text-[#908d89] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] transition-colors">
                          {t('settings.subscription.keepPro')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 6 - Data & Privacy */}
          <div className="surface p-6">
            <SectionHeader icon={Download} title={t('settings.data.title')} desc={t('settings.data.subtitle')} />
            <div className="space-y-4">
              {/* Export */}
              <div className="flex items-center justify-between py-3 border-b border-[#EAEAEA] dark:border-white/[0.07]">
                <div>
                  <p className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4]">{t('settings.data.exportTitle')}</p>
                  <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">{t('settings.data.exportDesc')}</p>
                </div>
                <button onClick={handleExportData} disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EAEAEA] dark:border-white/[0.07] text-xs font-medium text-[#787774] dark:text-[#908d89] hover:border-[#1B3A6B]/30 hover:text-[#1B3A6B] dark:hover:text-[#4a7dd1] hover:bg-[#EEF2F8] dark:hover:bg-[#1B3A6B]/10 transition-all disabled:opacity-50">
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {t('settings.data.exportButton')}
                </button>
              </div>

              {/* Delete account */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4]">{t('settings.data.deleteTitle')}</p>
                    <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">{t('settings.data.deleteDesc')}</p>
                  </div>
                  {!showDeleteConfirm && (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#9F2F2D]/20 text-xs font-medium text-[#9F2F2D] dark:text-[#d4524f] hover:bg-[#9F2F2D]/5 transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> {t('settings.data.deleteButton')}
                    </button>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="mt-4 p-4 rounded-xl border border-[#9F2F2D]/20 bg-[#9F2F2D]/5">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-[#9F2F2D] dark:text-[#d4524f] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#787774] dark:text-[#908d89]">
                        {t('settings.data.deleteWarning').replace(' **cannot be undone**', '')}
                        <span className="font-bold text-[#9F2F2D] dark:text-[#d4524f]"> {t('common.confirm').toLowerCase()}</span>.
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#787774] uppercase tracking-wider mb-2">{t('settings.data.deleteEmailConfirm')}</p>
                    <input
                      type="email"
                      value={deleteEmail}
                      onChange={e => setDeleteEmail(e.target.value)}
                      placeholder={user?.email}
                      className={`${inputCls} mb-3 text-sm`}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || deleteEmail !== user?.email}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9F2F2D] text-white text-xs font-bold hover:bg-[#7a2422] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {isDeletingAccount ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        {t('settings.data.deleteConfirmButton')}
                      </button>
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(''); }}
                        className="px-4 py-2 rounded-lg border border-[#EAEAEA] dark:border-white/[0.07] text-xs font-medium text-[#787774] dark:text-[#908d89] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] transition-colors">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
