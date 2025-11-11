import { useState, useEffect } from 'react';
import { initTelegram, getTelegramUser, hapticFeedback } from '@/lib/telegram';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import BookingCalendar from '@/components/BookingCalendar';

const Index = () => {
  const [role, setRole] = useState<'client' | 'master'>('client');
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<{name: string, service: string, price: number} | null>(null);

  useEffect(() => {
    const tg = initTelegram();
    const user = getTelegramUser();
    if (user) {
      setTelegramUser(user);
    }
  }, []);

  const handleRoleChange = (newRole: 'client' | 'master') => {
    hapticFeedback('light');
    setRole(newRole);
  };

  const handleBooking = (masterName: string, serviceName: string, price: number) => {
    hapticFeedback('medium');
    setSelectedMaster({ name: masterName, service: serviceName, price });
    setShowBookingModal(true);
  };

  const handleBookingConfirm = (date: Date, time: string) => {
    hapticFeedback('success');
    console.log('Booking confirmed:', { date, time, master: selectedMaster });
    setShowBookingModal(false);
    setSelectedMaster(null);
  };

  const handleBookingCancel = () => {
    hapticFeedback('light');
    setShowBookingModal(false);
    setSelectedMaster(null);
  };

  const mockAppointments = [
    {
      id: 1,
      masterName: 'Анна Сергеева',
      service: 'Маникюр + покрытие гель-лак',
      date: '2025-11-15',
      time: '14:00',
      status: 'confirmed',
      price: 2500,
      avatar: 'АС'
    },
    {
      id: 2,
      masterName: 'Мария Волкова',
      service: 'Стрижка + укладка',
      date: '2025-11-18',
      time: '11:00',
      status: 'pending',
      price: 3500,
      avatar: 'МВ'
    },
    {
      id: 3,
      masterName: 'Елена Краснова',
      service: 'Окрашивание бровей',
      date: '2025-11-20',
      time: '16:30',
      status: 'confirmed',
      price: 1500,
      avatar: 'ЕК'
    }
  ];

  const mockClients = [
    {
      id: 1,
      name: 'Ольга Иванова',
      lastVisit: '2025-11-05',
      totalVisits: 12,
      avatar: 'ОИ',
      note: 'Предпочитает натуральные оттенки'
    },
    {
      id: 2,
      name: 'Светлана Петрова',
      lastVisit: '2025-11-08',
      totalVisits: 7,
      avatar: 'СП',
      note: 'Аллергия на акрил'
    },
    {
      id: 3,
      name: 'Татьяна Смирнова',
      lastVisit: '2025-11-10',
      totalVisits: 15,
      avatar: 'ТС',
      note: 'Любит яркие цвета'
    }
  ];

  const mockServices = [
    {
      id: 1,
      name: 'Маникюр классический',
      duration: '60 мин',
      price: 1500,
      description: 'Обработка кутикулы, форма, массаж рук'
    },
    {
      id: 2,
      name: 'Маникюр + гель-лак',
      duration: '90 мин',
      price: 2500,
      description: 'Покрытие гель-лаком любого цвета'
    },
    {
      id: 3,
      name: 'Педикюр + покрытие',
      duration: '120 мин',
      price: 3500,
      description: 'Комплексный уход за стопами'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-muted text-muted-foreground',
      pending: 'bg-secondary text-secondary-foreground',
      cancelled: 'bg-destructive/10 text-destructive'
    };
    const labels = {
      confirmed: '✅ Подтверждено',
      pending: '⏳ Ожидает',
      cancelled: '❌ Отменено'
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/30 via-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Icon name="Sparkles" size={32} className="text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              BeautyFlow
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Твоя бьюти-экосистема в Telegram
          </p>
        </header>

        <Tabs value={role} onValueChange={(v) => handleRoleChange(v as 'client' | 'master')} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="client" className="text-base">
              <Icon name="User" size={18} className="mr-2" />
              Клиент
            </TabsTrigger>
            <TabsTrigger value="master" className="text-base">
              <Icon name="Briefcase" size={18} className="mr-2" />
              Мастер
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Calendar" size={24} />
                  Мои записи
                </CardTitle>
                <CardDescription>Предстоящие визиты к мастерам</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAppointments.map((appointment) => (
                  <Card key={appointment.id} className="overflow-hidden border-2 hover:shadow-lg transition-all animate-scale-in">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {appointment.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{appointment.masterName}</h3>
                              <p className="text-sm text-muted-foreground">{appointment.service}</p>
                            </div>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Icon name="Calendar" size={16} />
                              <span>{new Date(appointment.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Icon name="Clock" size={16} />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-primary">
                              <Icon name="Wallet" size={16} />
                              <span>{appointment.price} ₽</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={24} />
                  Мои мастера
                </CardTitle>
                <CardDescription>Специалисты, к которым вы записываетесь</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {mockAppointments.map((master, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-all">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                            {master.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{master.masterName}</h4>
                          <p className="text-xs text-muted-foreground">Маникюр, педикюр</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleBooking(master.masterName, master.service, master.price)}
                        >
                          <Icon name="Calendar" size={18} />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="master" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <Icon name="Calendar" size={24} className="text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-1">12</div>
                  <p className="text-sm text-muted-foreground">Записей на неделю</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                    <Icon name="Users" size={24} className="text-secondary-foreground" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{mockClients.length}</div>
                  <p className="text-sm text-muted-foreground">Активных клиентов</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Icon name="Wallet" size={24} className="text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold mb-1">45,000 ₽</div>
                  <p className="text-sm text-muted-foreground">Доход за месяц</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="ClipboardList" size={24} />
                  Мои услуги
                </CardTitle>
                <CardDescription>Управление прайс-листом</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockServices.map((service) => (
                  <Card key={service.id} className="border-2 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Icon name="Clock" size={14} />
                              <span>{service.duration}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-primary">
                              <Icon name="Wallet" size={14} />
                              <span>{service.price} ₽</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Icon name="Settings" size={18} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button className="w-full" variant="outline">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить услугу
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={24} />
                  База клиентов
                </CardTitle>
                <CardDescription>История визитов и заметки</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockClients.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                            {client.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{client.name}</h4>
                              <p className="text-xs text-muted-foreground">Посещений: {client.totalVisits}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {new Date(client.lastVisit).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground italic">{client.note}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showBookingModal && selectedMaster && (
        <BookingCalendar
          masterName={selectedMaster.name}
          serviceName={selectedMaster.service}
          servicePrice={selectedMaster.price}
          onConfirm={handleBookingConfirm}
          onCancel={handleBookingCancel}
        />
      )}
    </div>
  );
};

export default Index;