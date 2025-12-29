-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: users can only see their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update existing tables to allow admin operations

-- Pedidos: admin can do everything
CREATE POLICY "Admin can view all pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update pedidos"
ON public.pedidos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete pedidos"
ON public.pedidos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Produtos: admin can insert, update, delete
CREATE POLICY "Admin can insert produtos"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update produtos"
ON public.produtos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete produtos"
ON public.produtos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Clientes: admin can view and delete
CREATE POLICY "Admin can view all clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Depoimentos: admin can do everything
CREATE POLICY "Admin can insert depoimentos"
ON public.depoimentos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update depoimentos"
ON public.depoimentos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete depoimentos"
ON public.depoimentos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Mensagens: admin can view, update, delete
CREATE POLICY "Admin can view all mensagens"
ON public.mensagens
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update mensagens"
ON public.mensagens
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete mensagens"
ON public.mensagens
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));