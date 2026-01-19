'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, Check } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    setIsLoading(true);
    // Add registration logic here
    setTimeout(() => setIsLoading(false), 1500);
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(formData.password), text: 'One number' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200"
          alt="Boutique hotel pool"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-center p-12">
          <Link href="/" className="absolute top-8 left-8">
            <Image
              src="/logo-white.png"
              alt="Casita"
              width={140}
              height={45}
              className="h-10 w-auto"
            />
          </Link>
          <div className="max-w-md">
            <h1 className="font-serif text-5xl font-bold text-white mb-6">
              Join the Casita family
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Create your account and unlock exclusive access to handpicked boutique hotels worldwide.
            </p>
            <div className="space-y-4">
              {[
                'Exclusive member-only rates',
                'Early access to new properties',
                'Personalized recommendations',
                '24/7 concierge support',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <div className="w-6 h-6 rounded-full bg-[var(--casita-orange)] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-[var(--casita-gray-600)] mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to home</span>
            </Link>
            <Image
              src="/logo.png"
              alt="Casita"
              width={140}
              height={45}
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop back link */}
          <Link
            href="/"
            className="hidden lg:flex items-center gap-2 text-[var(--casita-gray-600)] mb-8 hover:text-[var(--casita-gray-900)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to home</span>
          </Link>

          <h2 className="font-serif text-3xl font-bold text-[var(--casita-gray-900)] mb-2">
            Create your account
          </h2>
          <p className="text-[var(--casita-gray-600)] mb-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--casita-orange)] hover:underline font-medium">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)]" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full pl-12 pr-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange-light)]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange-light)]"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange-light)]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="w-full pl-12 pr-12 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange-light)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--casita-gray-400)] hover:text-[var(--casita-gray-600)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        req.met ? 'text-green-600' : 'text-[var(--casita-gray-400)]'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${req.met ? 'opacity-100' : 'opacity-40'}`} />
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-[var(--casita-gray-300)] text-[var(--casita-orange)] focus:ring-[var(--casita-orange)]"
              />
              <span className="text-sm text-[var(--casita-gray-600)]">
                I agree to the{' '}
                <Link href="/terms" className="text-[var(--casita-orange)] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[var(--casita-orange)] hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={!agreedToTerms}
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-[var(--casita-gray-200)]" />
            <span className="px-4 text-sm text-[var(--casita-gray-500)]">or sign up with</span>
            <div className="flex-1 h-px bg-[var(--casita-gray-200)]" />
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl hover:bg-[var(--casita-gray-50)] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-[var(--casita-gray-700)]">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl hover:bg-[var(--casita-gray-50)] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              <span className="font-medium text-[var(--casita-gray-700)]">Apple</span>
            </button>
          </div>

          {/* Cute house icon at bottom */}
          <div className="mt-12 flex justify-center">
            <Image
              src="/house-icon.png"
              alt="Casita"
              width={32}
              height={32}
              className="opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
