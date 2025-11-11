import { useState, useEffect } from 'react';
import { profileApi, UserProfile } from '@/lib/api';
import { hapticFeedback } from '@/lib/telegram';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Icon from './ui/icon';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      hapticFeedback('error');
      return;
    }

    setIsSaving(true);
    try {
      await profileApi.updateProfile(formData);
      hapticFeedback('success');
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      hapticFeedback('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    hapticFeedback('light');
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
    }
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
        <Card className="w-full max-w-md animate-scale-in">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Загрузка профиля...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Мой профиль</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile.firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold">{profile.firstName} {profile.lastName}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Записей: {profile.bookingsCount}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Имя</Label>
                  <p className="font-medium">{profile.firstName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Фамилия</Label>
                  <p className="font-medium">{profile.lastName || 'Не указана'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Телефон</Label>
                  <p className="font-medium">{profile.phone || 'Не указан'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Дата регистрации</Label>
                  <p className="font-medium">
                    {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <Button onClick={() => setIsEditing(true)} className="w-full">
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Введите имя"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Введите фамилию"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileModal;
