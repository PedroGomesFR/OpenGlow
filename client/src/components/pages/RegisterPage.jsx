import '../css/AppleDesign.css';
import Input from "../common/Input";
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ReCAPTCHA from "react-google-recaptcha";

function RegisterPage({ setUser }) {
  const { t } = useTranslation();
  const [typePerson, setTypePerson] = useState('Client');
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formData, setFormData] = useState({
    prenom: '', nom: '', dateDeNaissance: '', email: '', password: '', profession: '', companyName: '', siret: '', address: '', latitude: '', longitude: ''
  });
  const [errorMessages, setErrorMessages] = useState({});

  const passwordRules = [
    { label: '12 caractères minimum', test: (p) => p.length >= 12 },
    { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
    { label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
    { label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
    { label: 'Un caractère spécial (!@#$%...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const isPasswordValid = (p) => passwordRules.every((r) => r.test(p));
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  useEffect(() => {
    if (!addressQuery || addressQuery.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&limit=5`);
        const data = await response.json();
        setAddressSuggestions(data);
        setShowAddressSuggestions(true);
      } catch (error) {
        console.error("Error fetching addresses", error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 600); // 600ms debounce to respect nominatim rate limits

    return () => clearTimeout(delayDebounceFn);
  }, [addressQuery]);

  const handleAddressSelect = (suggestion) => {
    setAddressQuery(suggestion.display_name);
    setFormData({
      ...formData,
      address: suggestion.display_name,
      latitude: suggestion.lat,
      longitude: suggestion.lon
    });
    setShowAddressSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      alert('Veuillez valider le CAPTCHA avant de continuer.');
      return;
    }

    if (!isPasswordValid(formData.password)) {
      alert('Le mot de passe ne respecte pas les critères de sécurité requis.');
      return;
    }
    const type = typePerson === 'Client' ? 'client' : 'professional';

    if (type === 'professional') {
      if (!formData.address || !formData.latitude || !formData.longitude) {
        alert("Veuillez sélectionner une adresse valide dans la liste proposée.");
        return;
      }
    }

    try {
      const response = await fetch(window.API_URL + '/records/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type, captchaToken })
      });

      if (!response.ok) {
        const data = await response.json();
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        if (data.emailUsed) alert(t('email_used'));
        else alert(t('register_error'));
      } else {
        const successData = await response.json();
        if (successData.requiresVerification) {
          setRegisteredEmail(successData.email);
          setVerificationMode(true);
        } else {
          localStorage.setItem("user", JSON.stringify(successData.user));
          localStorage.setItem("token", successData.token);
          setUser(successData.user);
          navigate('/');
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(window.API_URL + '/records/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail, code: verificationCode })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Code invalide ou expiré');
      } else {
        const successData = await response.json();
        localStorage.setItem("user", JSON.stringify(successData.user));
        localStorage.setItem("token", successData.token);
        setUser(successData.user);
        navigate('/');
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
        {verificationMode ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Vérifiez votre e-mail</h2>
            <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>
              Nous avons envoyé un code à 6 chiffres à <b>{registeredEmail}</b>.<br />Entrez-le ci-dessous pour finaliser votre inscription.
            </p>
            <form onSubmit={handleVerify}>
              <div className="form-group" style={{ marginBottom: '30px' }}>
                <input 
                  className="form-input" 
                  type="text" 
                  required 
                  maxLength="6"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Valider mon compte</button>
            </form>
            <button onClick={() => setVerificationMode(false)} className="btn btn-outline" style={{ width: '100%', marginTop: '15px' }}>
              Modifier mes informations
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-center" style={{ marginBottom: '30px' }}>{t('register_title')}</h2>
            <div style={{ display: 'flex', background: '#F5F5F7', padding: '4px', borderRadius: '12px', marginBottom: '30px' }}>
              <button
                onClick={() => setTypePerson('Client')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                  background: typePerson === 'Client' ? 'white' : 'transparent',
                  boxShadow: typePerson === 'Client' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {t('client_role')}
              </button>
              <button
                onClick={() => setTypePerson('Professional')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                  background: typePerson === 'Professional' ? 'white' : 'transparent',
                  boxShadow: typePerson === 'Professional' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {t('pro_role')}
              </button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">{t('firstname_label')}</label>
                <input className="form-input" type="text" name="prenom" required onChange={handleChange} value={formData.prenom} />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">{t('lastname_label')}</label>
                <input className="form-input" type="text" name="nom" required onChange={handleChange} value={formData.nom} />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">{t('birthdate_label')}</label>
                <input className="form-input" type="date" name="dateDeNaissance" required onChange={handleChange} value={formData.dateDeNaissance} />
              </div>

              {typePerson === 'Professional' && (
                <>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label className="form-label">{t('profession_label')}</label>
                    <select
                      className="form-input"
                      name="profession"
                      required
                      value={formData.profession}
                      onChange={handleChange}
                      style={{ cursor: 'pointer', appearance: 'auto' }}
                    >
                      <option value="">-- Sélectionnez votre métier --</option>
                      <optgroup label="Coiffure & Barbier">
                        <option value="Coiffeur(se)">Coiffeur(se)</option>
                        <option value="Barbier">Barbier</option>
                        <option value="Coloriste">Coloriste</option>
                        <option value="Coiffeur(se) Afro">Coiffeur(se) Afro</option>
                      </optgroup>
                      <optgroup label="Esthétique & Beauté">
                        <option value="Esthéticien(ne)">Esthéticien(ne)</option>
                        <option value="Ongleur(se) / Prothésiste ongulaire">Ongleur(se) / Prothésiste ongulaire</option>
                        <option value="Maquilleur(se)">Maquilleur(se)</option>
                        <option value="Sourcilier(ère) / Lashiste">Sourcilier(ère) / Lashiste</option>
                        <option value="Épilateur(trice)">Épilateur(trice)</option>
                        <option value="Spécialiste Soins du Visage">Spécialiste Soins du Visage</option>
                      </optgroup>
                      <optgroup label="Bien-être & Massage">
                        <option value="Masseur(se) / Massothérapeute">Masseur(se) / Massothérapeute</option>
                        <option value="Spa Praticien(ne)">Spa Praticien(ne)</option>
                        <option value="Réflexologue">Réflexologue</option>
                      </optgroup>
                      <optgroup label="Corps Art">
                        <option value="Tatoueur(se)">Tatoueur(se)</option>
                        <option value="Perceur(se) / Pierceur">Perceur(se) / Pierceur</option>
                      </optgroup>
                      <optgroup label="Autre">
                        <option value="Autre">Autre</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label className="form-label">{t('company_label')}</label>
                    <input className="form-input" type="text" name="companyName" required onChange={handleChange} value={formData.companyName} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label className="form-label">{t('siret_label')}</label>
                    <input className="form-input" type="text" name="siret" required onChange={handleChange} value={formData.siret} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }}>
                    <label className="form-label">Adresse de l'établissement</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="Saisissez une adresse complète..."
                      value={addressQuery}
                      onChange={(e) => {
                         setAddressQuery(e.target.value);
                         if (formData.address !== e.target.value) {
                             setFormData({ ...formData, address: '', latitude: '', longitude: '' });
                         }
                      }}
                      onFocus={() => { if(addressSuggestions.length > 0) setShowAddressSuggestions(true); }}
                      required 
                    />
                    {isSearchingAddress && <div style={{position: 'absolute', right: '10px', top: '35px', fontSize: '12px', color: '#888'}}>Recherche...</div>}
                    
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                        background: 'white', border: '1px solid #ddd', borderRadius: '8px',
                        listStyle: 'none', padding: 0, margin: '5px 0 0 0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
                      }}>
                        {addressSuggestions.map((sug, i) => (
                           <li 
                             key={i} 
                             onClick={() => handleAddressSelect(sug)}
                             style={{ padding: '10px 15px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}
                             onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f7'}
                             onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                           >
                             {sug.display_name}
                           </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">{t('email_label')}</label>
                <input className="form-input" type="email" name="email" required onChange={handleChange} value={formData.email} />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">{t('password_label')}</label>
                <input className="form-input" type="password" name="password" required onChange={handleChange} value={formData.password} />
                {formData.password.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: '8px 0 0 0', margin: 0, fontSize: '12px' }}>
                    {passwordRules.map((rule, i) => {
                      const ok = rule.test(formData.password);
                      return (
                        <li key={i} style={{ color: ok ? '#34C759' : '#FF3B30', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span>{ok ? '✓' : '✗'}</span> {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
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
                {t('register_btn')}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p className="text-secondary"> {t('already_account')} <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{t('login_link')}</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;