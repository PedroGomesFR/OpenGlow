import React, { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import '../css/AppleDesign.css';
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../common/ToastContext';

function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [forgotData, setForgotData] = useState({ email: '' });
  const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      toast(t('captcha_required'), 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(window.API_URL + '/records/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken }),
      });
      if (!response.ok) {
        const data = await response.json();
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        if (data.requiresVerification) {
          toast(t('account_not_verified_re_register'), 'warning');
        } else {
          toast(t('login_error') + " : " + (data.error || t('generic_error')), 'error');
        }
      } else {
        const successData = await response.json();
        localStorage.setItem("user", JSON.stringify(successData.user));
        localStorage.setItem("token", successData.token);
        setUser(successData.user);
        navigate('/profile');
      }
    } catch (error) {
      console.error("Error during login:", error);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      toast(t('generic_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotData.email) {
      toast(t('email_required'), 'warning');
      return;
    }
    if (!captchaToken) {
      toast(t('captcha_required'), 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(window.API_URL + '/records/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotData.email, captchaToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast(data.error || t('password_reset_request_error'), 'error');
        return;
      }

      toast(t('password_reset_request_success'), 'success');
      setResetData((prev) => ({ ...prev, email: forgotData.email }));
      setAuthMode('reset');
    } catch (error) {
      console.error('Error requesting reset code:', error);
      toast(t('generic_error'), 'error');
    } finally {
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetData.email || !resetData.code || !resetData.newPassword) {
      toast(t('reset_required_fields'), 'warning');
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      toast(t('passwords_mismatch'), 'warning');
      return;
    }

    if (!captchaToken) {
      toast(t('captcha_required'), 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(window.API_URL + '/records/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetData.email,
          code: resetData.code,
          newPassword: resetData.newPassword,
          captchaToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast(data.error || t('password_reset_error'), 'error');
        return;
      }

      toast(t('password_reset_success'), 'success');
      setAuthMode('login');
      setFormData({ email: resetData.email, password: '' });
      setResetData({ email: '', code: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast(t('generic_error'), 'error');
    } finally {
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      setIsSubmitting(false);
    }
  };

  const renderTitle = () => {
    if (authMode === 'forgot') return t('forgot_password_title');
    if (authMode === 'reset') return t('reset_password_title');
    return t('login_title');
  };

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <h2 className="text-center" style={{ marginBottom: '30px' }}>{renderTitle()}</h2>

        {authMode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('email_label')}</label>
              <input
                className="form-input"
                type="email"
                name="email"
                required
                onChange={handleChange}
                value={formData.email}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('password_label')}</label>
              <input
                className="form-input"
                type="password"
                name="password"
                required
                onChange={handleChange}
                value={formData.password}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-link"
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer' }}
                onClick={() => {
                  setAuthMode('forgot');
                  setForgotData({ email: formData.email || '' });
                }}
              >
                {t('forgot_password_link')}
              </button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={window.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: captchaToken ? 1 : 0.6 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('saving') : t('login_btn')}
            </button>
          </form>
        )}

        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <p className="text-secondary" style={{ marginBottom: '20px' }}>
              {t('forgot_password_intro')}
            </p>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('email_label')}</label>
              <input
                className="form-input"
                type="email"
                required
                value={forgotData.email}
                onChange={(e) => setForgotData({ email: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={window.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? t('saving') : t('send_reset_code')}
            </button>
            <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={() => setAuthMode('login')}>
              {t('back_to_login')}
            </button>
          </form>
        )}

        {authMode === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <p className="text-secondary" style={{ marginBottom: '20px' }}>
              {t('reset_password_intro')}
            </p>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('email_label')}</label>
              <input
                className="form-input"
                type="email"
                required
                value={resetData.email}
                onChange={(e) => setResetData((prev) => ({ ...prev, email: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('reset_code_label')}</label>
              <input
                className="form-input"
                type="text"
                required
                value={resetData.code}
                onChange={(e) => setResetData((prev) => ({ ...prev, code: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('new_password_label')}</label>
              <input
                className="form-input"
                type="password"
                required
                value={resetData.newPassword}
                onChange={(e) => setResetData((prev) => ({ ...prev, newPassword: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>{t('confirm_new_password_label')}</label>
              <input
                className="form-input"
                type="password"
                required
                value={resetData.confirmPassword}
                onChange={(e) => setResetData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={window.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? t('saving') : t('reset_password_btn')}
            </button>
            <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={() => setAuthMode('login')}>
              {t('back_to_login')}
            </button>
          </form>
        )}

        {authMode === 'login' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p className="text-secondary"> {t('no_account')} <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{t('register_link')}</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
export default LoginPage;