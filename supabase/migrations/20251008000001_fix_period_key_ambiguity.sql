-- Fix ambiguous period_key reference in trigger function
CREATE OR REPLACE FUNCTION public.log_client_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_key TEXT;
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
        v_period_key := current_year || '-' || LPAD(current_month::TEXT, 2, '0');
      WHEN 'quarterly' THEN
        v_period_key := current_year || '-Q' || current_quarter;
      WHEN 'bi-annually' THEN
        v_period_key := current_year || '-H' || CASE WHEN current_month <= 6 THEN '1' ELSE '2' END;
      WHEN 'annually' THEN
        v_period_key := current_year::TEXT;
    END CASE;
    
    -- Insert history record
    INSERT INTO public.client_status_history (client_id, user_id, old_status, new_status, period_key)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, v_period_key);
    
    -- Update or insert period data
    INSERT INTO public.client_period_data (client_id, period_key, status, last_updated)
    VALUES (NEW.id, v_period_key, NEW.status, NOW())
    ON CONFLICT (client_id, period_key)
    DO UPDATE SET status = NEW.status, last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;
