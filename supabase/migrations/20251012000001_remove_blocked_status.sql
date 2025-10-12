-- Remove 'waiting' and 'blocked' statuses from work_status enum

-- First, update any existing clients with 'waiting' or 'blocked' status to 'todo'
UPDATE public.clients
SET status = 'todo'
WHERE status IN ('waiting', 'blocked');

-- Update any client_period_data with 'waiting' or 'blocked' status
UPDATE public.client_period_data
SET status = 'todo'
WHERE status IN ('waiting', 'blocked');

-- Create new enum without 'waiting' and 'blocked'
CREATE TYPE public.work_status_new AS ENUM ('todo', 'in-progress', 'done');

-- Update clients table
ALTER TABLE public.clients
  ALTER COLUMN status TYPE work_status_new USING status::text::work_status_new;

-- Update client_period_data table
ALTER TABLE public.client_period_data
  ALTER COLUMN status TYPE work_status_new USING status::text::work_status_new;

-- Update client_status_history table
ALTER TABLE public.client_status_history
  ALTER COLUMN old_status TYPE work_status_new USING old_status::text::work_status_new,
  ALTER COLUMN new_status TYPE work_status_new USING new_status::text::work_status_new;

-- Drop old enum and rename new one
DROP TYPE public.work_status;
ALTER TYPE public.work_status_new RENAME TO work_status;

