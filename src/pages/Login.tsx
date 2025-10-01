import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import logo from '@/assets/logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } else {
      toast.error('Email ou mot de passe incorrect');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto">
            <img src={logo} alt="Infomineo" className="h-10 mx-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Suivi Interne</CardTitle>
            <CardDescription className="text-sm mt-2">
              Connectez-vous pour accéder à votre espace
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
              Comptes de démonstration
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Admin:</span>
                <span className="text-muted-foreground">admin@company.com / admin123</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Utilisateur:</span>
                <span className="text-muted-foreground">user@company.com / user123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
