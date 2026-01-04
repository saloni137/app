import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { getMonthName } from "@/lib/utils";

export default function MonthSelector({ month, year, onMonthChange, onYearChange }) {
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handlePrevMonth}
        data-testid="prev-month-btn"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <Select 
        value={month.toString()} 
        onValueChange={(v) => onMonthChange(parseInt(v))}
      >
        <SelectTrigger className="w-28" data-testid="month-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <SelectItem key={m} value={m.toString()}>
              {getMonthName(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={year.toString()} 
        onValueChange={(v) => onYearChange(parseInt(v))}
      >
        <SelectTrigger className="w-20" data-testid="year-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleNextMonth}
        data-testid="next-month-btn"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
