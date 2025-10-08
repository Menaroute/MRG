-- Update client dates to random dates in October 2024
-- This will set updated_at to random dates within October 2024 for testing the date filter

UPDATE clients
SET updated_at = timestamp '2024-10-01 00:00:00' + random() * (timestamp '2024-10-31 23:59:59' - timestamp '2024-10-01 00:00:00')
WHERE updated_at IS NOT NULL;

-- Also update client_period_data last_updated to match the pattern
UPDATE client_period_data
SET last_updated = timestamp '2024-10-01 00:00:00' + random() * (timestamp '2024-10-31 23:59:59' - timestamp '2024-10-01 00:00:00')
WHERE last_updated IS NOT NULL;

-- Update client_status_history changed_at to random dates in October
UPDATE client_status_history
SET changed_at = timestamp '2024-10-01 00:00:00' + random() * (timestamp '2024-10-31 23:59:59' - timestamp '2024-10-01 00:00:00')
WHERE changed_at IS NOT NULL;
