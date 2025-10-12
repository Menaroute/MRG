import { Client, PeriodicityType } from '@/types';

/**
 * Get the current period key based on periodicity type
 * Format: YYYY-MM for monthly, YYYY-Q1 for quarterly, YYYY-H1 for bi-annually, YYYY for annually
 */
export function getCurrentPeriodKey(periodicity: PeriodicityType, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const quarter = Math.ceil(month / 3);
  const half = month <= 6 ? 1 : 2;

  switch (periodicity) {
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':
      return `${year}-Q${quarter}`;
    case 'bi-annually':
      return `${year}-H${half}`;
    case 'annually':
      return `${year}`;
  }
}

/**
 * Check if a client should be visible to users based on periodicity and current month
 * Admins always see all clients
 */
export function isClientVisibleInCurrentPeriod(client: Client, isAdmin: boolean = false): boolean {
  // Admins always see all clients
  if (isAdmin) {
    return true;
  }

  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Monthly clients are always visible
  if (client.periodicity === 'monthly') {
    return true;
  }

  // Check if periodicity_months exists and is an array
  if (!client.periodicity_months || !Array.isArray(client.periodicity_months)) {
    console.warn(`Client ${client.id} has invalid periodicity_months:`, client.periodicity_months);
    return false;
  }

  // Check if current month is in the client's periodicity months
  return client.periodicity_months.includes(currentMonth);
}

/**
 * Get the number of months that should be selected for a periodicity type
 */
export function getRequiredMonthCount(periodicity: PeriodicityType): number {
  switch (periodicity) {
    case 'monthly':
      return 12; // All months
    case 'quarterly':
      return 4; // 4 quarters
    case 'bi-annually':
      return 2; // 2 halves
    case 'annually':
      return 1; // 1 year
  }
}

/**
 * Get default months for a periodicity type
 */
export function getDefaultMonths(periodicity: PeriodicityType): number[] {
  switch (periodicity) {
    case 'monthly':
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    case 'quarterly':
      return [1, 4, 7, 10]; // First month of each quarter
    case 'bi-annually':
      return [1, 7]; // January and July
    case 'annually':
      return [1]; // January
  }
}

/**
 * Validate if the selected months are correct for the periodicity type
 */
export function validateMonthSelection(periodicity: PeriodicityType, months: number[]): boolean {
  const requiredCount = getRequiredMonthCount(periodicity);
  
  if (periodicity === 'monthly') {
    // Monthly should have all 12 months
    return months.length === 12 && months.sort((a, b) => a - b).join(',') === '1,2,3,4,5,6,7,8,9,10,11,12';
  }
  
  // Other periodicities should have exactly the required number of unique months
  const uniqueMonths = Array.from(new Set(months));
  return uniqueMonths.length === requiredCount && 
         uniqueMonths.every(m => m >= 1 && m <= 12);
}

/**
 * Get period label for display
 */
export function getPeriodLabel(periodKey: string): string {
  if (periodKey.includes('-Q')) {
    const [year, quarter] = periodKey.split('-Q');
    return `T${quarter} ${year}`;
  } else if (periodKey.includes('-H')) {
    const [year, half] = periodKey.split('-H');
    return `${half === '1' ? '1er' : '2ème'} semestre ${year}`;
  } else if (periodKey.includes('-')) {
    const [year, month] = periodKey.split('-');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  } else {
    return `Année ${periodKey}`;
  }
}

/**
 * Check if we've entered a new period and need to reset status
 */
export function shouldResetStatus(
  lastPeriodKey: string | null, 
  currentPeriodKey: string
): boolean {
  return lastPeriodKey !== null && lastPeriodKey !== currentPeriodKey;
}

/**
 * Check if a client is relevant for a given month range based on its periodicity
 */
export function isClientRelevantForMonthRange(
  client: Client,
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): boolean {
  // Monthly clients are relevant for any month range
  if (client.periodicity === 'monthly') {
    return true;
  }

  // Check if periodicity_months exists and is valid
  if (!client.periodicity_months || !Array.isArray(client.periodicity_months)) {
    return false;
  }

  // Create an array of all months in the range
  const monthsInRange: number[] = [];
  let currentYear = startYear;
  let currentMonth = startMonth;

  while (
    currentYear < endYear || 
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    monthsInRange.push(currentMonth);
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  // Check if any of the client's periodicity months are in the range
  return client.periodicity_months.some(month => monthsInRange.includes(month));
}

