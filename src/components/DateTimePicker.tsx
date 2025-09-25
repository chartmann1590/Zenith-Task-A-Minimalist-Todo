import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { setHours, setMinutes, getHours, getMinutes, isValid } from 'date-fns';
interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}
export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value || undefined);
  const [time, setTime] = useState({
    hours: value ? getHours(value).toString().padStart(2, '0') : '09',
    minutes: value ? getMinutes(value).toString().padStart(2, '0') : '00',
  });
  useEffect(() => {
    if (value) {
      setDate(value);
      setTime({
        hours: getHours(value).toString().padStart(2, '0'),
        minutes: getMinutes(value).toString().padStart(2, '0'),
      });
    } else {
      setDate(undefined);
    }
  }, [value]);
  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      updateDateTime(selectedDate, time.hours, time.minutes);
    } else {
      onChange(null);
    }
  };
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newTime = { ...time, [name]: value };
    setTime(newTime);
    if (date) {
      updateDateTime(date, newTime.hours, newTime.minutes);
    }
  };
  const updateDateTime = (currentDate: Date, hoursStr: string, minutesStr: string) => {
    let newDate = currentDate;
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (!isNaN(hours) && hours >= 0 && hours <= 23) {
      newDate = setHours(newDate, hours);
    }
    if (!isNaN(minutes) && minutes >= 0 && minutes <= 59) {
      newDate = setMinutes(newDate, minutes);
    }
    if (isValid(newDate)) {
      onChange(newDate);
    }
  };
  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateChange}
        initialFocus
      />
      <div className="flex items-center gap-2 mt-4">
        <div className="grid gap-1.5">
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            name="hours"
            type="number"
            min="0"
            max="23"
            value={time.hours}
            onChange={handleTimeChange}
            className="w-20"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="minutes">Minutes</Label>
          <Input
            id="minutes"
            name="minutes"
            type="number"
            min="0"
            max="59"
            value={time.minutes}
            onChange={handleTimeChange}
            className="w-20"
          />
        </div>
      </div>
       <div className="flex justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Clear</Button>
      </div>
    </div>
  );
}