-- Drop existing client policies
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete any client" ON public.clients;

-- Admins can do everything with clients
CREATE POLICY "Admins can manage all clients"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their assigned clients only
CREATE POLICY "Users can view assigned clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Users can only update their assigned clients (status changes)
CREATE POLICY "Users can update assigned clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (assigned_user_id = auth.uid())
  WITH CHECK (assigned_user_id = auth.uid());