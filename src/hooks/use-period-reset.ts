import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { getCurrentPeriodKey, shouldResetStatus } from '@/utils/periodicity';

/**
 * Hook to check and reset client statuses when entering a new period
 * This runs on app load for each client assigned to the user
 */
export function usePeriodReset(clients: Client[], userId: string | undefined) {
  useEffect(() => {
    if (!userId || clients.length === 0) return;

    const checkAndResetPeriods = async () => {
      try {
        for (const client of clients) {
          const currentPeriodKey = getCurrentPeriodKey(client.periodicity);
          
          // Fetch the latest period data for this client
          const { data: periodData, error } = await supabase
            .from('client_period_data')
            .select('*')
            .eq('client_id', client.id)
            .eq('period_key', currentPeriodKey)
            .single();

          if (error && error.code !== 'PGRST116') {
            // PGRST116 is "not found" which is okay - means new period
            console.error('Error fetching period data:', error);
            continue;
          }

          // If no period data exists for current period, create it with 'todo' status
          if (!periodData) {
            // Check if there was a previous period
            const { data: previousPeriods } = await supabase
              .from('client_period_data')
              .select('period_key, last_updated')
              .eq('client_id', client.id)
              .order('last_updated', { ascending: false })
              .limit(1);

            const lastPeriodKey = previousPeriods?.[0]?.period_key || null;
            
            // If we had a previous period and it's different from current, reset status
            if (shouldResetStatus(lastPeriodKey, currentPeriodKey)) {
              // Insert new period data with 'todo' status
              await supabase
                .from('client_period_data')
                .insert({
                  client_id: client.id,
                  period_key: currentPeriodKey,
                  status: 'todo',
                  last_updated: new Date().toISOString(),
                });

              // Update the client's status to 'todo' for the new period
              await supabase
                .from('clients')
                .update({ status: 'todo' })
                .eq('id', client.id);
            }
          }
        }
      } catch (error) {
        console.error('Error in period reset check:', error);
      }
    };

    checkAndResetPeriods();
  }, [clients, userId]);
}

/**
 * Get the current period status for a client
 * Returns the status from period_data table if available, otherwise from client table
 */
export async function getCurrentPeriodStatus(
  clientId: string, 
  periodicity: Client['periodicity']
): Promise<Client['status']> {
  const currentPeriodKey = getCurrentPeriodKey(periodicity);
  
  const { data, error } = await supabase
    .from('client_period_data')
    .select('status')
    .eq('client_id', clientId)
    .eq('period_key', currentPeriodKey)
    .single();

  if (error || !data) {
    // Fallback to client's current status
    const { data: clientData } = await supabase
      .from('clients')
      .select('status')
      .eq('id', clientId)
      .single();
    
    return clientData?.status || 'todo';
  }

  return data.status;
}

