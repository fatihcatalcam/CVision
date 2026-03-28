import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post('/auth/register', { 
        full_name: fullName, 
        email, 
        password 
      });
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md animate-in slide-up hidden sm:block">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-[var(--color-muted)]">Join CVision to analyze your CV</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Full Name" 
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Create a password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-primary)] hover:underline">
            Log in
          </Link>
        </div>
      </Card>
      
      {/* Mobile view */}
      <div className="w-full sm:hidden px-4 animate-in slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" isLoading={isLoading}>Register</Button>
        </form>
      </div>
    </div>
  );
}
