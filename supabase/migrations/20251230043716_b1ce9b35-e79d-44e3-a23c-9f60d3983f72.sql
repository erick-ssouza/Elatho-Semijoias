-- =============================================
-- PARTE 1: CORREÇÕES DE SEGURANÇA
-- =============================================

-- 1.1 PROTEGER TABELA CLIENTES
-- Remover política de INSERT público
DROP POLICY IF EXISTS "Qualquer pessoa pode se cadastrar" ON public.clientes;

-- Criar política mais restritiva: INSERT apenas via service_role (checkout backend)
-- Nota: O checkout usa service_role key, então clientes são criados pelo backend
CREATE POLICY "Service role can insert clientes"
ON public.clientes
FOR INSERT
TO service_role
WITH CHECK (true);

-- Permitir que usuários autenticados vejam apenas seus próprios dados (por email)
CREATE POLICY "Users can view own cliente data"
ON public.clientes
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 1.2 PROTEGER TABELA PEDIDOS
-- Remover política de INSERT público
DROP POLICY IF EXISTS "Qualquer pessoa pode criar pedidos" ON public.pedidos;

-- INSERT apenas via service_role (checkout backend)
CREATE POLICY "Service role can insert pedidos"
ON public.pedidos
FOR INSERT
TO service_role
WITH CHECK (true);

-- Usuários autenticados podem ver apenas seus próprios pedidos
CREATE POLICY "Users can view own pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (cliente_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 1.3 PROTEGER AVALIAÇÕES - Remover cliente_email da exposição pública
-- A política atual já permite apenas aprovado=true para SELECT público
-- Vamos criar uma VIEW para esconder o email
CREATE OR REPLACE VIEW public.avaliacoes_publicas AS
SELECT 
  id,
  produto_id,
  cliente_nome,
  nota,
  titulo,
  comentario,
  created_at
FROM public.avaliacoes
WHERE aprovado = true;

-- Dar acesso público à view
GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;

-- 1.4 PROTEGER TABELA CONFIGURACOES
-- Adicionar políticas de escrita apenas para admins
CREATE POLICY "Admin can insert configuracoes"
ON public.configuracoes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update configuracoes"
ON public.configuracoes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete configuracoes"
ON public.configuracoes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.5 PROTEGER TABELA USER_ROLES contra escalação de privilégios
-- Apenas admins existentes podem inserir novas roles
CREATE POLICY "Admin can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar roles (mas não a própria)
CREATE POLICY "Admin can update other user_roles"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id != auth.uid()
);

-- Apenas admins podem deletar roles (mas não a própria)
CREATE POLICY "Admin can delete other user_roles"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id != auth.uid()
);

-- Permitir que admins vejam todas as roles
CREATE POLICY "Admin can view all user_roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- PARTE 2: PREPARAÇÃO PARA GALERIA DE FOTOS
-- =============================================

-- Adicionar coluna imagens (array de URLs) na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS imagens jsonb DEFAULT '[]'::jsonb;

-- =============================================
-- PARTE 3: TABELA PARA HISTÓRICO DE STATUS
-- =============================================

-- Criar tabela para rastrear histórico de status dos pedidos
CREATE TABLE IF NOT EXISTS public.pedidos_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pedidos_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para histórico
CREATE POLICY "Admin can manage pedidos_historico"
ON public.pedidos_historico
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own pedidos historico"
ON public.pedidos_historico
FOR SELECT
TO authenticated
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos 
    WHERE cliente_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Consulta pública por número do pedido (para rastreamento)
CREATE POLICY "Anyone can view historico by pedido number"
ON public.pedidos_historico
FOR SELECT
TO anon
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE numero_pedido IS NOT NULL
  )
);

-- Trigger para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_pedido_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.pedidos_historico (pedido_id, status_anterior, status_novo)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_pedido_status_change ON public.pedidos;
CREATE TRIGGER on_pedido_status_change
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.log_pedido_status_change();