import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});

export default function Auth() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupNome, setSignupNome] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Reset password field
  const [resetEmail, setResetEmail] = useState('');

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get the page user came from (for redirect after login)
  // SECURITY: Validate redirect path to prevent open redirect attacks
  const rawFrom = (location.state as { from?: string })?.from || '/';
  const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') && !rawFrom.includes(':') ? rawFrom : '/';

  // If already logged in, show logged in state
  useEffect(() => {
    if (user) {
      // Already logged in - redirect to where they came from or home
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[`login_${err.path[0]}`] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          title: 'Erro ao entrar',
          description: 'Email ou senha incorretos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({ title: 'Login realizado com sucesso!' });
      navigate(from, { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      signupSchema.parse({
        nome: signupNome,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[`signup_${err.path[0]}`] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupNome);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está em uso. Tente fazer login.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Você já pode começar a usar seus favoritos.',
      });
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      resetSchema.parse({ email: resetEmail });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[`reset_${err.path[0]}`] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/redefinir-senha`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectUrl,
    });
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    }
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Helmet>
          <title>Recuperar Senha | Elatho Semijoias</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="w-full max-w-md">
          <button 
            onClick={() => {
              setShowForgotPassword(false);
              setResetEmailSent(false);
              setResetEmail('');
            }} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </button>

          <Card className="card-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display text-gradient-gold">
                Recuperar Senha
              </CardTitle>
              <CardDescription>
                {resetEmailSent 
                  ? 'Verifique seu email'
                  : 'Digite seu email para receber o link de recuperação'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Enviamos um link de recuperação para <strong>{resetEmail}</strong>.
                    Verifique sua caixa de entrada e spam.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResetEmailSent(false);
                      setResetEmail('');
                    }}
                    className="mt-4"
                  >
                    Enviar novamente
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.reset_email && (
                      <p className="text-sm text-destructive">{errors.reset_email}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-gold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Link de Recuperação'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Entrar ou Criar Conta | Elatho Semijoias</title>
        <meta name="description" content="Acesse sua conta Elatho para gerenciar favoritos e acompanhar pedidos. Crie sua conta e aproveite benefícios exclusivos." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Entrar ou Criar Conta | Elatho Semijoias" />
        <meta property="og:site_name" content="Elatho Semijoias" />
        <meta property="og:locale" content="pt_BR" />
      </Helmet>
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>

        <Card className="card-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display text-gradient-gold">
              Elatho Semijoias
            </CardTitle>
            <CardDescription>
              Acesse sua conta para gerenciar seus favoritos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.login_email && (
                      <p className="text-sm text-destructive">{errors.login_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.login_password && (
                      <p className="text-sm text-destructive">{errors.login_password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-gold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">Nome</Label>
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder="Seu nome"
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.signup_nome && (
                      <p className="text-sm text-destructive">{errors.signup_nome}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.signup_email && (
                      <p className="text-sm text-destructive">{errors.signup_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.signup_password && (
                      <p className="text-sm text-destructive">{errors.signup_password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="input-elegant"
                    />
                    {errors.signup_confirmPassword && (
                      <p className="text-sm text-destructive">{errors.signup_confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-gold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
