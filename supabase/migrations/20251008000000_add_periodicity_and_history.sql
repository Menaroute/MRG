-- Create enum for periodicity types
CREATE TYPE public.periodicity_type AS ENUM ('monthly', 'quarterly', 'bi-annually', 'annually');

-- Add periodicity columns to clients table
ALTER TABLE public.clients
  ADD COLUMN periodicity periodicity_type NOT NULL DEFAULT 'monthly',
  ADD COLUMN periodicity_months INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12];

-- Create client_status_history table for tracking status changes
CREATE TABLE public.client_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status work_status,
  new_status work_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_key TEXT NOT NULL -- Format: YYYY-MM for monthly, YYYY-Q1/Q2/Q3/Q4 for quarterly, etc.
);

-- Create index for faster queries
CREATE INDEX idx_client_status_history_client_id ON public.client_status_history(client_id);
CREATE INDEX idx_client_status_history_changed_at ON public.client_status_history(changed_at DESC);

-- Create client_period_data table for period-specific status
CREATE TABLE public.client_period_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL, -- Format: YYYY-MM for monthly, YYYY-Q1 for quarterly, etc.
  status work_status NOT NULL DEFAULT 'todo',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, period_key)
);

-- Create index for faster queries
CREATE INDEX idx_client_period_data_client_id ON public.client_period_data(client_id);
CREATE INDEX idx_client_period_data_period_key ON public.client_period_data(period_key);

-- Enable RLS on new tables
ALTER TABLE public.client_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_period_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_status_history
CREATE POLICY "Admins can view all history"
  ON public.client_status_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view history of own clients"
  ON public.client_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_status_history.client_id
      AND clients.assigned_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert history"
  ON public.client_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for client_period_data
CREATE POLICY "Users can view own client period data"
  ON public.client_period_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_period_data.client_id
      AND (clients.assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can insert own client period data"
  ON public.client_period_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_period_data.client_id
      AND (clients.assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can update own client period data"
  ON public.client_period_data
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_period_data.client_id
      AND (clients.assigned_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Function to log status changes and update period data
CREATE OR REPLACE FUNCTION public.log_client_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_key TEXT;
  current_month INTEGER;
  current_year INTEGER;
  current_quarter INTEGER;
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Calculate period key based on current date
    current_month := EXTRACT(MONTH FROM NOW());
    current_year := EXTRACT(YEAR FROM NOW());
    current_quarter := CEIL(current_month / 3.0);
    
    -- Determine period_key based on periodicity
    CASE NEW.periodicity
      WHEN 'monthly' THEN
        period_key := current_year || '-' || LPAD(current_month::TEXT, 2, '0');
      WHEN 'quarterly' THEN
        period_key := current_year || '-Q' || current_quarter;
      WHEN 'bi-annually' THEN
        period_key := current_year || '-H' || CASE WHEN current_month <= 6 THEN '1' ELSE '2' END;
      WHEN 'annually' THEN
        period_key := current_year::TEXT;
    END CASE;
    
    -- Insert history record
    INSERT INTO public.client_status_history (client_id, user_id, old_status, new_status, period_key)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, period_key);
    
    -- Update or insert period data
    INSERT INTO public.client_period_data (client_id, period_key, status, last_updated)
    VALUES (NEW.id, period_key, NEW.status, NOW())
    ON CONFLICT (client_id, period_key)
    DO UPDATE SET status = NEW.status, last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for status change logging
CREATE TRIGGER log_client_status_change_trigger
  AFTER UPDATE ON public.clients
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_client_status_change();

