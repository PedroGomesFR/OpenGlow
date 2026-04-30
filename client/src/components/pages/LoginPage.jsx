import React, { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import '../css/AppleDesign.css';
import Input from "../common/Input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../common/ToastContext';

function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMessages, setErrorMessages] = useState({ email: '', password: '' });
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      toast('Veuillez valider le CAPTCHA avant de continuer.', 'warning');
      return;
    }
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
          toast('Votre compte n\'est pas vérifié. Veuillez vous réinscrire avec la même adresse e-mail pour recevoir un nouveau code.', 'warning');
        } else {
          toast(t('login_error') + " : " + (data.error || "Erreur"), 'error');
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
    }
  };

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <h2 className="text-center" style={{ marginBottom: '30px' }}>{t('login_title')}</h2>
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
          <div className="form-group" style={{ marginBottom: '30px' }}>
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

          {/* reCAPTCHA */}
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
          >
            {t('login_btn')}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p className="text-secondary"> {t('no_account')} <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{t('register_link')}</Link></p>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;