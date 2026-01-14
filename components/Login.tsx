
import React, { useState } from 'react';
import { User } from '../types';
import { APP_NAME } from '../constants';
import { authAPI } from '../api';
import { Lock, Mail, User as UserIcon, Phone, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!isLogin) {
        // Register
        await authAPI.register({
          name,
          email,
          password,
          phone,
        });

        // Auto login response already contains user & token
        const res = await authAPI.getMe();
        onLogin(res);
      } else {
        // Login
        const res = await authAPI.login({
          email,
          password,
        });
        onLogin(res.user);
      }
    } catch (error: any) {
      alert(error.message || 'Authentication failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full border-[30px] border-white" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border-[20px] border-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 font-bold text-2xl font-heading mb-16">
            <div className="bg-white text-slate-900 w-10 h-10 rounded-xl flex items-center justify-center">I</div>
            {APP_NAME}
          </div>

          <h2 className="text-4xl font-bold font-heading leading-tight mb-6">
            Professional Invoice<br />
            <span className="text-slate-400">Management Made Simple</span>
          </h2>

          <p className="text-lg text-slate-400 max-w-md leading-relaxed">
            Streamline your billing workflow. Create, track, and manage invoices with real-time payment updates.
          </p>
        </div>

        <div className="relative z-10 bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
          <p className="text-sm text-slate-300 italic leading-relaxed">"The simplest way to manage our office invoicing. Real-time tracking is incredibly useful."</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700" />
            <div>
              <p className="text-sm font-semibold">Sarah Jenkins</p>
              <p className="text-xs text-slate-500">Finance Director</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 font-heading mb-2">
              {isLogin ? 'Welcome back' : 'Create Account'}
            </h1>
            <p className="text-slate-500">
              {isLogin ? 'Enter your credentials to continue' : 'Set up your admin account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="email"
                placeholder="Email Address"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium">or</span>
              </div>
            </div>

            <p className="text-center text-slate-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-slate-900 hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs text-slate-400">Powered by {APP_NAME}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
