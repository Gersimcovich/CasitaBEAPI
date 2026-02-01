'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useUser } from '@/contexts/UserContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Locale } from '@/types/user';
import {
  User,
  Calendar,
  Award,
  Settings,
  LogOut,
  MapPin,
  Users,
  Moon,
  Loader2,
  Globe,
  Phone,
  Save,
  ChevronRight,
  Home,
} from 'lucide-react';
import { useCapacitor } from '@/hooks/useCapacitor';

// Translations
const translations = {
  en: {
    account: 'My Account',
    dashboard: 'Dashboard',
    reservations: 'My Reservations',
    settings: 'Settings',
    logout: 'Log Out',
    welcome: 'Welcome back',
    casitaPoints: 'Casita Points',
    pointsEarned: 'points earned',
    totalSpent: 'Total Spent',
    rewardsComingSoon: 'Rewards coming soon!',
    noReservations: 'No reservations yet',
    startExploring: 'Start exploring our properties and book your first stay.',
    browseProperties: 'Browse Properties',
    upcoming: 'Upcoming',
    past: 'Past',
    cancelled: 'Cancelled',
    nights: 'nights',
    guests: 'guests',
    viewDetails: 'View Details',
    profileSettings: 'Profile Settings',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    selectCountry: 'Select country',
    language: 'Preferred Language',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    changesSaved: 'Changes saved successfully',
    memberSince: 'Member since',
    confirmationCode: 'Confirmation',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    status: 'Status',
    confirmed: 'Confirmed',
    completed: 'Completed',
  },
  es: {
    account: 'Mi Cuenta',
    dashboard: 'Panel',
    reservations: 'Mis Reservas',
    settings: 'Configuracion',
    logout: 'Cerrar Sesion',
    welcome: 'Bienvenido de vuelta',
    casitaPoints: 'Puntos Casita',
    pointsEarned: 'puntos ganados',
    totalSpent: 'Total Gastado',
    rewardsComingSoon: 'Recompensas proximamente!',
    noReservations: 'Sin reservas aun',
    startExploring: 'Explora nuestras propiedades y reserva tu primera estadia.',
    browseProperties: 'Ver Propiedades',
    upcoming: 'Proximas',
    past: 'Pasadas',
    cancelled: 'Canceladas',
    nights: 'noches',
    guests: 'huespedes',
    viewDetails: 'Ver Detalles',
    profileSettings: 'Configuracion de Perfil',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    phone: 'Telefono',
    country: 'Pais',
    selectCountry: 'Selecciona pais',
    language: 'Idioma Preferido',
    saveChanges: 'Guardar Cambios',
    saving: 'Guardando...',
    changesSaved: 'Cambios guardados exitosamente',
    memberSince: 'Miembro desde',
    confirmationCode: 'Confirmacion',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    status: 'Estado',
    confirmed: 'Confirmada',
    completed: 'Completada',
  },
  pt: {
    account: 'Minha Conta',
    dashboard: 'Painel',
    reservations: 'Minhas Reservas',
    settings: 'Configuracoes',
    logout: 'Sair',
    welcome: 'Bem-vindo de volta',
    casitaPoints: 'Pontos Casita',
    pointsEarned: 'pontos ganhos',
    totalSpent: 'Total Gasto',
    rewardsComingSoon: 'Recompensas em breve!',
    noReservations: 'Sem reservas ainda',
    startExploring: 'Explore nossas propriedades e reserve sua primeira estadia.',
    browseProperties: 'Ver Propriedades',
    upcoming: 'Proximas',
    past: 'Passadas',
    cancelled: 'Canceladas',
    nights: 'noites',
    guests: 'hospedes',
    viewDetails: 'Ver Detalhes',
    profileSettings: 'Configuracoes do Perfil',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    email: 'Email',
    phone: 'Telefone',
    country: 'Pais',
    selectCountry: 'Selecione pais',
    language: 'Idioma Preferido',
    saveChanges: 'Salvar Alteracoes',
    saving: 'Salvando...',
    changesSaved: 'Alteracoes salvas com sucesso',
    memberSince: 'Membro desde',
    confirmationCode: 'Confirmacao',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    status: 'Status',
    confirmed: 'Confirmada',
    completed: 'Completada',
  },
};

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
  { code: 'MX', name: 'Mexico' },
  { code: 'PA', name: 'Panama' },
  { code: 'PE', name: 'Peru' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'ES', name: 'Spain' },
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

type Tab = 'dashboard' | 'reservations' | 'settings';

export default function AccountPage() {
  const router = useRouter();
  const { user, reservations, isLoading, isAuthenticated, logout, updateProfile } = useUser();
  const { locale, setLocale } = useLocale();
  const { isCapacitor } = useCapacitor();
  const t = translations[locale];

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Settings form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>('en');

  // Initialize form when user loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || '');
      setCountry(user.country || '');
      setPreferredLanguage(user.preferredLanguage);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    const result = await updateProfile({
      firstName,
      lastName,
      phone: phone || undefined,
      country: country || undefined,
      preferredLanguage,
    });

    if (result.success) {
      setSaveMessage(t.changesSaved);
      // Update locale context if language changed
      if (preferredLanguage !== locale) {
        setLocale(preferredLanguage);
      }
    }

    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'pt' ? 'pt-BR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Categorize reservations
  const now = new Date();
  const upcomingReservations = reservations.filter(
    r => r.status === 'confirmed' && new Date(r.checkIn) >= now
  );
  const pastReservations = reservations.filter(
    r => r.status === 'completed' || (r.status === 'confirmed' && new Date(r.checkOut) < now)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--casita-cream)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--casita-orange)]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--casita-cream)] pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Account Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 bg-[var(--casita-orange)] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-[var(--casita-gray-900)]">
                  {t.welcome}, {user.firstName}!
                </h1>
                <p className="text-[var(--casita-gray-500)] text-sm">
                  {t.memberSince} {formatDate(user.createdAt)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)] transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', icon: Home, label: t.dashboard },
                    { id: 'reservations', icon: Calendar, label: t.reservations },
                    { id: 'settings', icon: Settings, label: t.settings },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === item.id
                          ? 'bg-[var(--casita-orange)] text-white'
                          : 'hover:bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)]'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      <ChevronRight className={`w-4 h-4 ml-auto ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Points Card */}
                  <div className="bg-gradient-to-br from-[var(--casita-orange)] to-[#D4896A] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-6 h-6" />
                          <span className="font-medium">{t.casitaPoints}</span>
                        </div>
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                          {user.casitaPoints.toLocaleString()}
                        </div>
                        <p className="text-white/80 text-sm">
                          {t.pointsEarned}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm mb-1">{t.totalSpent}</p>
                        <p className="text-2xl font-semibold">{formatCurrency(user.totalSpent)}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-white/70 rounded-full animate-pulse"></span>
                        {t.rewardsComingSoon}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-[var(--casita-orange)]" />
                        <span className="font-medium text-[var(--casita-gray-700)]">{t.upcoming}</span>
                      </div>
                      <p className="text-3xl font-bold text-[var(--casita-gray-900)]">
                        {upcomingReservations.length}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Moon className="w-5 h-5 text-[var(--casita-orange)]" />
                        <span className="font-medium text-[var(--casita-gray-700)]">{t.past}</span>
                      </div>
                      <p className="text-3xl font-bold text-[var(--casita-gray-900)]">
                        {pastReservations.length}
                      </p>
                    </div>
                  </div>

                  {/* Recent Reservations Preview */}
                  {reservations.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[var(--casita-gray-900)]">{t.reservations}</h3>
                        <button
                          onClick={() => setActiveTab('reservations')}
                          className="text-[var(--casita-orange)] text-sm font-medium hover:underline"
                        >
                          {t.viewDetails}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {reservations.slice(0, 3).map((reservation) => (
                          <div
                            key={reservation.id}
                            className="flex items-center gap-4 p-3 bg-[var(--casita-gray-50)] rounded-xl"
                          >
                            {reservation.propertyImage ? (
                              <img
                                src={reservation.propertyImage}
                                alt={reservation.propertyName}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-[var(--casita-sand)] rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-[var(--casita-orange)]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--casita-gray-900)] truncate">
                                {reservation.propertyName}
                              </p>
                              <p className="text-sm text-[var(--casita-gray-500)]">
                                {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[var(--casita-gray-900)]">
                                {formatCurrency(reservation.totalPaid)}
                              </p>
                              <p className="text-xs text-[var(--casita-orange)]">
                                +{reservation.pointsEarned} pts
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Reservations Tab */}
              {activeTab === 'reservations' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-6">
                    {t.reservations}
                  </h2>

                  {reservations.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-[var(--casita-gray-300)] mx-auto mb-4" />
                      <p className="text-[var(--casita-gray-600)] mb-4">{t.noReservations}</p>
                      <p className="text-sm text-[var(--casita-gray-500)] mb-6">{t.startExploring}</p>
                      <a
                        href="/properties"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--casita-orange)] text-white font-medium rounded-xl hover:bg-[var(--casita-orange)]/90 transition-colors"
                      >
                        {t.browseProperties}
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className="border border-[var(--casita-gray-200)] rounded-xl overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row">
                            {reservation.propertyImage && (
                              <div className="sm:w-48 h-32 sm:h-auto">
                                <img
                                  src={reservation.propertyImage}
                                  alt={reservation.propertyName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-[var(--casita-gray-900)]">
                                  {reservation.propertyName}
                                </h3>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    reservation.status === 'confirmed'
                                      ? 'bg-green-100 text-green-700'
                                      : reservation.status === 'completed'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {reservation.status === 'confirmed' ? t.confirmed : t.completed}
                                </span>
                              </div>

                              <p className="text-sm text-[var(--casita-gray-500)] flex items-center gap-1 mb-3">
                                <MapPin className="w-4 h-4" />
                                {reservation.propertyAddress}
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-[var(--casita-gray-500)]">{t.confirmationCode}</p>
                                  <p className="font-medium text-[var(--casita-orange)]">
                                    {reservation.confirmationCode}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[var(--casita-gray-500)]">{t.checkIn}</p>
                                  <p className="font-medium">{formatDate(reservation.checkIn)}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--casita-gray-500)]">{t.checkOut}</p>
                                  <p className="font-medium">{formatDate(reservation.checkOut)}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--casita-gray-500)]">
                                    {reservation.nights} {t.nights} · {reservation.guests} {t.guests}
                                  </p>
                                  <p className="font-semibold text-[var(--casita-gray-900)]">
                                    {formatCurrency(reservation.totalPaid)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-[var(--casita-gray-100)]">
                                <p className="text-sm text-[var(--casita-orange)] font-medium">
                                  +{reservation.pointsEarned} {t.casitaPoints}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-6">
                    {t.profileSettings}
                  </h2>

                  {saveMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                      {saveMessage}
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                          <User className="w-4 h-4 inline mr-1" />
                          {t.firstName}
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
                          {t.lastName}
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
                        {t.email}
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl bg-[var(--casita-gray-50)] text-[var(--casita-gray-500)] cursor-not-allowed"
                      />
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

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                          <MapPin className="w-4 h-4 inline mr-1" />
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
                          <Globe className="w-4 h-4 inline mr-1" />
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

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--casita-orange)] text-white font-medium rounded-xl hover:bg-[var(--casita-orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t.saving}
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            {t.saveChanges}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
