'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, User, Phone, Globe, ChevronLeft, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Locale } from '@/types/user';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'email' | 'register' | 'verify';

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'PA', name: 'Panama' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'ES', name: 'Spain' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'OTHER', name: 'Other' },
];

const languages: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Espanol' },
  { code: 'pt', name: 'Portugues' },
];

// Translations
const translations = {
  en: {
    signIn: 'Sign In',
    createAccount: 'Create Account',
    enterEmail: 'Enter your email',
    emailPlaceholder: 'your@email.com',
    continue: 'Continue',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone (optional)',
    country: 'Country',
    selectCountry: 'Select country',
    language: 'Preferred Language',
    verificationCode: 'Verification Code',
    enterCode: 'Enter the 6-digit code sent to',
    verifyButton: 'Verify',
    didntReceive: "Didn't receive the code?",
    resend: 'Resend',
    back: 'Back',
    or: 'or',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    welcomeBack: 'Welcome back!',
    createYourAccount: 'Create your account',
    joinCasita: 'Join Casita to track your reservations and earn points.',
    codeExpires: 'Code expires in 10 minutes',
    accountNotFound: 'No account found with this email. Let\'s create one!',
  },
  es: {
    signIn: 'Iniciar Sesion',
    createAccount: 'Crear Cuenta',
    enterEmail: 'Ingresa tu correo',
    emailPlaceholder: 'tu@email.com',
    continue: 'Continuar',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Telefono (opcional)',
    country: 'Pais',
    selectCountry: 'Selecciona pais',
    language: 'Idioma Preferido',
    verificationCode: 'Codigo de Verificacion',
    enterCode: 'Ingresa el codigo de 6 digitos enviado a',
    verifyButton: 'Verificar',
    didntReceive: '¿No recibiste el codigo?',
    resend: 'Reenviar',
    back: 'Volver',
    or: 'o',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    noAccount: '¿No tienes cuenta?',
    welcomeBack: '¡Bienvenido de vuelta!',
    createYourAccount: 'Crea tu cuenta',
    joinCasita: 'Unete a Casita para seguir tus reservas y ganar puntos.',
    codeExpires: 'El codigo expira en 10 minutos',
    accountNotFound: 'No encontramos una cuenta con este correo. ¡Vamos a crear una!',
  },
  pt: {
    signIn: 'Entrar',
    createAccount: 'Criar Conta',
    enterEmail: 'Digite seu email',
    emailPlaceholder: 'seu@email.com',
    continue: 'Continuar',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    phone: 'Telefone (opcional)',
    country: 'Pais',
    selectCountry: 'Selecione pais',
    language: 'Idioma Preferido',
    verificationCode: 'Codigo de Verificacao',
    enterCode: 'Digite o codigo de 6 digitos enviado para',
    verifyButton: 'Verificar',
    didntReceive: 'Nao recebeu o codigo?',
    resend: 'Reenviar',
    back: 'Voltar',
    or: 'ou',
    alreadyHaveAccount: 'Ja tem uma conta?',
    noAccount: 'Nao tem uma conta?',
    welcomeBack: 'Bem-vindo de volta!',
    createYourAccount: 'Crie sua conta',
    joinCasita: 'Junte-se a Casita para acompanhar suas reservas e ganhar pontos.',
    codeExpires: 'O codigo expira em 10 minutos',
    accountNotFound: 'Nao encontramos uma conta com este email. Vamos criar uma!',
  },
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, verifyCode } = useUser();
  const { locale } = useLocale();
  const t = translations[locale];

  const [step, setStep] = useState<AuthStep>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountNotFound, setShowAccountNotFound] = useState(false);

  // Form data
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);

  // Verification code
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('email');
      setIsLogin(true);
      setError(null);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setCountry('');
      setPreferredLanguage(locale);
      setVerificationCode(['', '', '', '', '', '']);
      setShowAccountNotFound(false);
    }
  }, [isOpen, locale]);

  // Focus first code input when entering verify step
  useEffect(() => {
    if (step === 'verify' && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(email);
        if (result.requiresRegistration) {
          setIsLogin(false);
          setShowAccountNotFound(true);
          setStep('register');
        } else if (result.success) {
          setStep('verify');
        } else {
          setError(result.message);
        }
      } else {
        // Switch to register step
        setStep('register');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await register({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        country: country || undefined,
        preferredLanguage,
      });

      if (result.success) {
        setStep('verify');
      } else {
        setError(result.message);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (value && index < 5 && codeInputRefs.current[index + 1]) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...verificationCode];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setVerificationCode(newCode);
    // Focus the next empty input or last input
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    codeInputRefs.current[focusIndex]?.focus();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const registrationData = !isLogin ? {
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        country: country || undefined,
        preferredLanguage,
      } : undefined;

      const result = await verifyCode(email, code, registrationData);

      if (result.success) {
        onClose();
      } else {
        setError(result.message);
        setVerificationCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email);
      } else {
        await register({
          email,
          firstName,
          lastName,
          phone: phone || undefined,
          country: country || undefined,
          preferredLanguage,
        });
      }
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Track if we're mounted (for SSR compatibility with portal)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen) return null;

  // Use portal to render outside any stacking context (like fixed header)
  // Only use portal after mounting (client-side)
  if (!isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Modal container - centers modal vertically and horizontally */}
      <div className="flex min-h-full items-center justify-center p-4 relative z-[9999]">
        {/* Modal */}
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-[var(--casita-gray-100)]">
          {step !== 'email' && (
            <button
              onClick={() => setStep(step === 'verify' ? (isLogin ? 'email' : 'register') : 'email')}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-2 -ml-2 hover:bg-[var(--casita-gray-100)] rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--casita-gray-600)]" />
            </button>
          )}
          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 -mr-2 hover:bg-[var(--casita-gray-100)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--casita-gray-600)]" />
          </button>
          <div className="text-center">
            <img
              src="/icon-512.png"
              alt="Casita"
              className="w-12 h-12 mx-auto mb-2"
            />
            <h2 className="text-xl font-semibold text-[var(--casita-gray-900)]">
              {step === 'verify' ? t.verificationCode : isLogin ? t.signIn : t.createAccount}
            </h2>
            {step === 'email' && (
              <p className="mt-1 text-sm text-[var(--casita-gray-500)]">
                {isLogin ? t.welcomeBack : t.joinCasita}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  {t.enterEmail}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                  className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 bg-[var(--casita-orange)] text-white font-medium rounded-xl hover:bg-[var(--casita-orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.continue
                )}
              </button>

              <div className="mt-4 text-center text-sm text-[var(--casita-gray-500)]">
                {isLogin ? t.noAccount : t.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[var(--casita-orange)] font-medium hover:underline"
                >
                  {isLogin ? t.createAccount : t.signIn}
                </button>
              </div>
            </form>
          )}

          {/* Register Step */}
          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit}>
              {/* Show info message when user was redirected from login */}
              {showAccountNotFound && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                  {t.accountNotFound}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      {t.firstName} *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                      {t.lastName} *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    {t.country}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)] bg-white"
                  >
                    <option value="">{t.selectCountry}</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                    {t.language}
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as Locale)}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)] bg-white"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !firstName || !lastName}
                className="w-full mt-6 py-3 px-4 bg-[var(--casita-orange)] text-white font-medium rounded-xl hover:bg-[var(--casita-orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.continue
                )}
              </button>
            </form>
          )}

          {/* Verify Code Step */}
          {step === 'verify' && (
            <form onSubmit={handleVerifySubmit}>
              <p className="text-sm text-[var(--casita-gray-600)] text-center mb-6">
                {t.enterCode}{' '}
                <span className="font-medium text-[var(--casita-gray-900)]">{email}</span>
              </p>

              <div className="flex justify-center gap-2 mb-4">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={index === 0 ? handleCodePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-semibold border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                  />
                ))}
              </div>

              <p className="text-xs text-[var(--casita-gray-500)] text-center mb-6">
                {t.codeExpires}
              </p>

              <button
                type="submit"
                disabled={isLoading || verificationCode.some(d => !d)}
                className="w-full py-3 px-4 bg-[var(--casita-orange)] text-white font-medium rounded-xl hover:bg-[var(--casita-orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.verifyButton
                )}
              </button>

              <div className="mt-4 text-center text-sm text-[var(--casita-gray-500)]">
                {t.didntReceive}{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-[var(--casita-orange)] font-medium hover:underline disabled:opacity-50"
                >
                  {t.resend}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}
