import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { MONTH_LABELS } from '@/types';

const MONTH_LABELS_SHORT: Record<number, string> = {
  1: 'Jan',
  2: 'Fév',
  3: 'Mar',
  4: 'Avr',
  5: 'Mai',
  6: 'Juin',
  7: 'Juil',
  8: 'Aoû',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Déc',
};

interface MonthRange {
  start: { month: number; year: number };
  end: { month: number; year: number };
}

interface MonthRangeFilterProps {
  value: MonthRange | null;
  onChange: (range: MonthRange | null) => void;
}

type PresetValue = 'this-month' | 'this-quarter' | 'this-year' | 'last-month' | 'last-quarter' | 'last-year' | 'all-time' | 'custom';

export default function MonthRangeFilter({ value, onChange }: MonthRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetValue>('this-month');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStartMonth, setSelectedStartMonth] = useState<{ month: number; year: number } | null>(null);
  const [selectedEndMonth, setSelectedEndMonth] = useState<{ month: number; year: number } | null>(null);
  const [tempValue, setTempValue] = useState<MonthRange | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Calculate preset ranges
  const getPresetRange = (preset: PresetValue): MonthRange | null => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);

    switch (preset) {
      case 'this-month':
        return { start: { month, year }, end: { month, year } };
      
      case 'this-quarter': {
        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = quarter * 3;
        return { start: { month: startMonth, year }, end: { month: endMonth, year } };
      }
      
      case 'this-year':
        return { start: { month: 1, year }, end: { month: 12, year } };
      
      case 'last-month': {
        const lastMonth = month === 1 ? 12 : month - 1;
        const lastMonthYear = month === 1 ? year - 1 : year;
        return { start: { month: lastMonth, year: lastMonthYear }, end: { month: lastMonth, year: lastMonthYear } };
      }
      
      case 'last-quarter': {
        const lastQuarter = quarter === 1 ? 4 : quarter - 1;
        const lastQuarterYear = quarter === 1 ? year - 1 : year;
        const startMonth = (lastQuarter - 1) * 3 + 1;
        const endMonth = lastQuarter * 3;
        return { start: { month: startMonth, year: lastQuarterYear }, end: { month: endMonth, year: lastQuarterYear } };
      }
      
      case 'last-year':
        return { start: { month: 1, year: year - 1 }, end: { month: 12, year: year - 1 } };
      
      case 'all-time':
        return null;
      
      case 'custom':
        return value;
    }
  };

  const handlePresetClick = (preset: PresetValue) => {
    setSelectedPreset(preset);
    const range = getPresetRange(preset);
    setTempValue(range);
    
    // Reset custom selection when switching presets
    setSelectedStartMonth(null);
    setSelectedEndMonth(null);
  };

  const handleMonthClick = (month: number) => {
    if (selectedPreset === 'custom') {
      // For custom mode: handle start and end separately (period selection)
      if (!selectedStartMonth) {
        // First click - set start month with current year
        setSelectedStartMonth({ month, year: selectedYear });
      } else if (!selectedEndMonth) {
        // Second click - set end month and set temp value
        const endSelection = { month, year: selectedYear };
        setSelectedEndMonth(endSelection);
        
        // Compare dates to determine which is start and which is end
        const startDate = new Date(selectedStartMonth.year, selectedStartMonth.month - 1);
        const endDate = new Date(endSelection.year, endSelection.month - 1);
        
        const start = startDate <= endDate ? selectedStartMonth : endSelection;
        const end = startDate <= endDate ? endSelection : selectedStartMonth;
        
        setTempValue({ start, end });
      } else {
        // Third click - reset and start over
        setSelectedStartMonth({ month, year: selectedYear });
        setSelectedEndMonth(null);
      }
    } else {
      // For other presets: single month selection only
      const singleMonthRange = {
        start: { month, year: selectedYear },
        end: { month, year: selectedYear }
      };
      setTempValue(singleMonthRange);
    }
  };

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Reset to current value
    setTempValue(value);
    setSelectedStartMonth(null);
    setSelectedEndMonth(null);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  // Generate display label
  const getDisplayLabel = (): string => {
    if (!value) return 'Toute la période';
    
    const { start, end } = value;
    
    // If single month, show full name
    if (start.month === end.month && start.year === end.year) {
      return `${MONTH_LABELS[start.month]} ${start.year}`;
    }
    
    // If range, show abbreviated names
    const startLabel = `${MONTH_LABELS_SHORT[start.month]} ${start.year}`;
    const endLabel = `${MONTH_LABELS_SHORT[end.month]} ${end.year}`;
    return `${startLabel} - ${endLabel}`;
  };

  const isMonthSelected = (month: number): boolean => {
    if (!tempValue) return false;
    
    if (selectedPreset === 'custom') {
      // For custom mode, show selection in progress
      if (!selectedStartMonth) return false;
      
      // If only start is selected
      if (!selectedEndMonth) {
        return month === selectedStartMonth.month && selectedYear === selectedStartMonth.year;
      }
      
      // If both start and end are selected
      const startDate = new Date(selectedStartMonth.year, selectedStartMonth.month - 1);
      const endDate = new Date(selectedEndMonth.year, selectedEndMonth.month - 1);
      const currentDate = new Date(selectedYear, month - 1);
      
      const actualStart = startDate <= endDate ? startDate : endDate;
      const actualEnd = startDate <= endDate ? endDate : startDate;
      
      return currentDate >= actualStart && currentDate <= actualEnd;
    } else {
      // For other presets, highlight selected month from tempValue
      const { start, end } = tempValue;
      const currentDate = new Date(selectedYear, month - 1);
      const startDate = new Date(start.year, start.month - 1);
      const endDate = new Date(end.year, end.month - 1);
      
      return currentDate >= startDate && currentDate <= endDate;
    }
  };

  // Set initial value on mount
  useEffect(() => {
    if (!value) {
      const initialRange = getPresetRange('this-month');
      onChange(initialRange);
      setTempValue(initialRange);
    } else {
      setTempValue(value);
    }
  }, []);

  // Update tempValue when value changes externally
  useEffect(() => {
    if (value) {
      setTempValue(value);
    }
  }, [value]);

  const presets = [
    { value: 'this-month' as PresetValue, label: 'Ce mois' },
    { value: 'this-quarter' as PresetValue, label: 'Ce trimestre' },
    { value: 'this-year' as PresetValue, label: 'Cette année' },
    { divider: true },
    { value: 'last-month' as PresetValue, label: 'Mois dernier' },
    { value: 'last-quarter' as PresetValue, label: 'Trimestre dernier' },
    { value: 'last-year' as PresetValue, label: 'Année dernière' },
    { divider: true },
    { value: 'all-time' as PresetValue, label: 'Toute la période' },
    { value: 'custom' as PresetValue, label: 'Personnalisé' },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-start"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {getDisplayLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Left sidebar - Presets */}
          <div className="border-r p-2 flex flex-col">
            {presets.map((preset, idx) => 
              preset.divider ? (
                <Separator key={`divider-${idx}`} className="my-2" />
              ) : (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? 'secondary' : 'ghost'}
                  size="sm"
                  className="justify-start h-8 px-3 mb-1 whitespace-nowrap text-xs w-full"
                  onClick={() => handlePresetClick(preset.value!)}
                >
                  {preset.label}
                </Button>
              )
            )}
          </div>
          
          {/* Right side - Month picker (always visible) */}
          <div className="p-4 w-[280px]">
            {/* Year navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleYearChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{selectedYear}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleYearChange('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Month grid */}
            <div>
              {selectedPreset === 'custom' ? (
                <p className="text-xs text-muted-foreground mb-2 text-center">
                  {!selectedStartMonth && 'Sélectionnez le premier mois'}
                  {selectedStartMonth && !selectedEndMonth && 'Sélectionnez le mois de fin'}
                  {selectedStartMonth && selectedEndMonth && 'Période sélectionnée'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-2 text-center invisible">
                  Placeholder
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(MONTH_LABELS_SHORT).map(([monthNum, monthName]) => {
                  const month = parseInt(monthNum);
                  const isSelected = isMonthSelected(month);
                  
                  return (
                    <Button
                      key={month}
                      variant={isSelected ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-9 text-xs"
                      onClick={() => handleMonthClick(month)}
                    >
                      {monthName}
                    </Button>
                  );
                })}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8"
                  onClick={handleApply}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
