import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, ArrowLeft } from "lucide-react";

type ViewMode = "login" | "forgot";

// Allowed admin emails - only these can access the admin panel
const ALLOWED_ADMIN_EMAILS = [
  "admin@elatho.com",
  "elathosemijoias@gmail.com",
];

const isEmailAllowed = (email: string): boolean => {
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (viewMode === "forgot") {
        // Password reset flow
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/painel-elatho-2025/reset-password`,
        });

        if (error) throw error;

        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setViewMode("login");
        setEmail("");
      } else {
        // Login flow - check if email is allowed first
        if (!isEmailAllowed(email)) {
          toast({
            title: "Acesso negado",
            description: "Este email não está autorizado a acessar o painel administrativo.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has admin role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData) {
          await supabase.auth.signOut();
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão de administrador.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao painel administrativo.",
        });
        navigate("/painel-elatho-2025/dashboard");
      }
    } catch (error: any) {
      const errorTitle = viewMode === "forgot" 
        ? "Erro ao enviar email" 
        : "Erro no login";
      
      toast({
        title: errorTitle,
        description: error.message || "Algo deu errado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case "forgot":
        return "Recuperar Senha";
      default:
        return "Painel Administrativo";
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case "forgot":
        return "Digite seu email para receber o link de recuperação";
      default:
        return "Acesse com suas credenciais de administrador";
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (viewMode) {
        case "forgot":
          return "Enviando...";
        default:
          return "Entrando...";
      }
    }
    switch (viewMode) {
      case "forgot":
        return "Enviar Link";
      default:
        return "Entrar";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@elatho.com"
                required
              />
            </div>
            {viewMode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getButtonText()}
            </Button>
          </form>
          
          <div className="mt-4 space-y-2 text-center">
            {viewMode === "login" && (
              <button
                type="button"
                onClick={() => setViewMode("forgot")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Esqueceu sua senha?
              </button>
            )}
            {viewMode === "forgot" && (
              <button
                type="button"
                onClick={() => setViewMode("login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 w-full"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar para login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
