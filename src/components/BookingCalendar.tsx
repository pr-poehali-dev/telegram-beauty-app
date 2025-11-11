import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { hapticFeedback } from '@/lib/telegram';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingCalendarProps {
  masterName: string;
  serviceName: string;
  servicePrice: number;
  onConfirm: (date: Date, time: string) => void;
  onCancel: () => void;
}

const BookingCalendar = ({ masterName, serviceName, servicePrice, onConfirm, onCancel }: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const availableSlots: TimeSlot[] = [
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: false },
    { time: '12:00', available: true },
    { time: '13:00', available: false },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: false },
    { time: '18:00', available: true },
    { time: '19:00', available: true },
  ];

  const disabledDays = [
    { before: new Date() },
    { dayOfWeek: [0] },
  ];

  const handleDateSelect = (date: Date | undefined) => {
    hapticFeedback('light');
    setSelectedDate(date);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    hapticFeedback('medium');
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      hapticFeedback('success');
      onConfirm(selectedDate, selectedTime);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-1">Выберите дату и время</CardTitle>
              <CardDescription>
                {masterName} • {serviceName}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              Выберите дату
            </h3>
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={disabledDays}
                locale={ru}
                className="border rounded-lg p-3"
                modifiersStyles={{
                  selected: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                  },
                }}
              />
            </div>
          </div>

          {selectedDate && (
            <div className="animate-fade-in">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="Clock" size={20} />
                Выберите время на {format(selectedDate, 'd MMMM', { locale: ru })}
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? 'default' : 'outline'}
                    disabled={!slot.available}
                    onClick={() => handleTimeSelect(slot.time)}
                    className="h-12"
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <Card className="bg-muted animate-fade-in">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Дата:</span>
                    <span className="font-semibold">
                      {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Время:</span>
                    <span className="font-semibold">{selectedTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Услуга:</span>
                    <span className="font-semibold">{serviceName}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Итого:</span>
                    <span className="text-lg font-bold text-primary">{servicePrice} ₽</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>

        <div className="border-t p-4 flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            className="flex-1"
          >
            <Icon name="Check" size={18} className="mr-2" />
            Подтвердить запись
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BookingCalendar;
