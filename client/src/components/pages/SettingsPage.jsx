import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IoArrowBack,
  IoCheckmark,
  IoChevronForward,
  IoPerson,
  IoMail,
  IoLockClosed,
  IoEye,
  IoEyeOff,
  IoTrash,
} from 'react-icons/io5';
import { useToast } from '../common/ToastContext';
import { useConfirm } from '../common/ConfirmContext';
import '../css/AppleDesign.css';
import '../css/SettingsPage.css';
import {
  getStoredSettings,
  saveStoredSettings,
} from '../../utils/preferences';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`sp-switch${checked ? ' is-on' : ''}`}
    >
      <span className="sp-switch__thumb" />
    </button>
  );
}

function SettingsPage({ user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  const update = (partial) =>
    setSettings((prev) => saveStoredSettings({ ...prev, ...partial }));

  const THEME_META = {
    classic: { label: t('settings_theme_classic'), dot: ['#1d1d1f', '#f5f5f7', '#d2d2d7'] },
    ocean:   { label: t('settings_theme_ocean'),   dot: ['#1a5c6b', '#e8f3f5', '#b2d4db'] },
    rose:    { label: t('settings_theme_rose'),    dot: ['#b4546c', '#fdf1f5', '#f4d9e2'] },
    dark:    { label: t('settings_theme_dark'),    dot: ['#f5f5f7', '#1c1c1e', '#2c2c2e'] },
  };

  const notifRows = [
    {
      key: 'emailNotifications',
      label: t('settings_notif_email'),
      sub: t('settings_notif_email_sub'),
    },
    {
      key: 'pushNotifications',
      label: t('settings_notif_push'),
      sub: t('settings_notif_push_sub'),
    },
    {
      key: 'marketingEmails',
      label: t('settings_notif_marketing'),
      sub: t('settings_notif_marketing_sub'),
    },
  ];

  const handlePwdChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast(t('passwords_mismatch'), 'warning');
      return;
    }
    setPwdLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(window.API_URL + '/records/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || t('password_change_error'), 'error'); return; }
      toast(t('password_change_success'), 'success');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast(t('network_error_retry'), 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = await confirm({
      title: t('delete_account_title'),
      message: t('delete_account_message'),
      confirmLabel: t('delete_account_confirm'),
      cancelLabel: t('action_cancel'),
      danger: true,
    });
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(window.API_URL + '/records/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        toast(t('delete_account_success', { defaultValue: 'Compte supprimé avec succès.' }), 'success');
        navigate('/', { replace: true });
        return;
      }

      const data = await response.json();
      toast(data.error || t('delete_account_error'), 'error');
    } catch {
      toast(t('network_error_retry'), 'error');
    }
  };

  const displayName = user
    ? `${user.prenom || ''} ${user.nom || ''}`.trim() || t('settings_account_profile')
    : t('settings_not_connected');

  const pwdFields = [
    { field: 'currentPassword', label: t('settings_pwd_current'), vis: 'current' },
    { field: 'newPassword',     label: t('settings_pwd_new'),     vis: 'next' },
    { field: 'confirmPassword', label: t('settings_pwd_confirm'), vis: 'confirm' },
  ];

  return (
    <div className="sp">
      <div className="sp__shell container">

        {/* Header */}
        <div className="sp__header">
          <button type="button" className="sp__back" onClick={() => navigate(-1)}>
            <IoArrowBack size={16} />
            <span>{t('settings_back')}</span>
          </button>
          <div>
            <p className="sp__eyebrow">OpenGlow</p>
            <h1 className="sp__title">{t('settings_title')}</h1>
          </div>
        </div>

        {/* Body */}
        <div className="sp__body">

          {/* Apparence */}
          <section className="sp__section">
            <h2 className="sp__section-label">{t('settings_section_appearance')}</h2>
            <div className="sp__card">
              <p className="sp__card-intro">{t('settings_theme_intro')}</p>
              <div className="sp__theme-list">
                {Object.entries(THEME_META).map(([id, meta]) => {
                  const active = settings.theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`sp__theme-row${active ? ' is-active' : ''}`}
                      onClick={() => update({ theme: id })}
                    >
                      <div className="sp__theme-dots">
                        {meta.dot.map((c, i) => (
                          <span key={i} style={{ background: c }} />
                        ))}
                      </div>
                      <span className="sp__theme-name">{meta.label}</span>
                      <span className="sp__theme-check-wrap">
                        {active && <IoCheckmark size={15} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="sp__divider" />

              <div className="sp__row sp__row--toggle">
                <div>
                  <span className="sp__row-label">{t('settings_compact_mode')}</span>
                  <span className="sp__row-sub">{t('settings_compact_mode_sub')}</span>
                </div>
                <Toggle
                  checked={settings.compactMode}
                  onChange={(v) => update({ compactMode: v })}
                />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="sp__section">
            <h2 className="sp__section-label">{t('settings_section_notifications')}</h2>
            <div className="sp__card">
              {notifRows.map((row, i) => (
                <div key={row.key}>
                  {i > 0 && <div className="sp__divider sp__divider--inset" />}
                  <div className="sp__row sp__row--toggle">
                    <div>
                      <span className="sp__row-label">{row.label}</span>
                      <span className="sp__row-sub">{row.sub}</span>
                    </div>
                    <Toggle
                      checked={Boolean(settings[row.key])}
                      onChange={(v) => update({ [row.key]: v })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Compte */}
          <section className="sp__section">
            <h2 className="sp__section-label">{t('settings_section_account')}</h2>
            <div className="sp__card">
              <button
                type="button"
                className="sp__row sp__row--link"
                onClick={() => navigate('/profile')}
              >
                <span className="sp__row-icon"><IoPerson size={16} /></span>
                <div>
                  <span className="sp__row-label">{t('settings_account_profile')}</span>
                  <span className="sp__row-sub">{displayName}</span>
                </div>
                <IoChevronForward size={15} className="sp__chevron" />
              </button>

              <div className="sp__divider sp__divider--inset" />

              <button
                type="button"
                className="sp__row sp__row--link"
                onClick={() => navigate(user ? '/profile' : '/login')}
              >
                <span className="sp__row-icon"><IoMail size={16} /></span>
                <div>
                  <span className="sp__row-label">{t('settings_account_email_label')}</span>
                  <span className="sp__row-sub">{user?.email || '—'}</span>
                </div>
                <IoChevronForward size={15} className="sp__chevron" />
              </button>
            </div>
          </section>

          {/* Sécurité */}
          {user && (
            <section className="sp__section">
              <h2 className="sp__section-label">{t('settings_section_security')}</h2>
              <div className="sp__card">
                <div className="sp__pwd-header">
                  <span className="sp__row-icon"><IoLockClosed size={16} /></span>
                  <div>
                    <span className="sp__row-label">{t('settings_pwd_title')}</span>
                    <span className="sp__row-sub">{t('settings_pwd_hint')}</span>
                  </div>
                </div>
                <form className="sp__pwd-form" onSubmit={handlePwdChange} autoComplete="off">
                  {pwdFields.map(({ field, label, vis }) => (
                    <div key={field} className="sp__pwd-field">
                      <label className="sp__pwd-label">{label}</label>
                      <div className="sp__pwd-input-wrap">
                        <input
                          type={showPwd[vis] ? 'text' : 'password'}
                          className="sp__pwd-input"
                          value={pwdForm[field]}
                          onChange={(e) => setPwdForm((p) => ({ ...p, [field]: e.target.value }))}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          className="sp__pwd-eye"
                          onClick={() => setShowPwd((p) => ({ ...p, [vis]: !p[vis] }))}
                          aria-label={showPwd[vis] ? t('settings_hide_pwd') : t('settings_show_pwd')}
                        >
                          {showPwd[vis] ? <IoEyeOff size={16} /> : <IoEye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="submit" className="sp__pwd-submit" disabled={pwdLoading}>
                    {pwdLoading ? t('settings_pwd_submitting') : t('settings_pwd_submit')}
                  </button>
                </form>

                <div className="sp__divider" />

                <div className="sp__row">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      color: '#FF3B30',
                      borderColor: '#FF3B30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <IoTrash size={16} /> {t('delete_my_account')}
                  </button>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
