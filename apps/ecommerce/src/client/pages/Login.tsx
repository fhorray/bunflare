import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $user, $router, $adminUser } from '../store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = (await res.json()) as { success: boolean; user: { id: string; name: string; role: string }; error?: string };
      
      if (res.ok) {
        if (isLogin) {
          $user.set(data.user);
          if (data.user.role === 'admin') {
            $adminUser.set(data.user);
          }
          toast.success(`Welcome back, ${data.user.name}`);
          $router.open('/');
        } else {
          toast.success('Account created! Please sign in.');
          setIsLogin(true);
        }
      } else {
        toast.error(data.error || 'Authentication failed');
      }
    } catch (err) {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md border border-slate-200 bg-white p-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin ? 'Enter your details to access your account' : 'Join our premium edge-commerce community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-900">Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="h-12 border-slate-200 rounded-none shadow-none"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-900">Username</Label>
            <Input
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username"
              className="h-12 border-slate-200 rounded-none shadow-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-900">Password</Label>
            <Input
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="h-12 border-slate-200 rounded-none shadow-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-slate-900 text-white font-bold rounded-none shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                    {isLogin ? 'SIGN IN' : 'REGISTER'}
                    <ArrowRight className="h-4 w-4" />
                </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
