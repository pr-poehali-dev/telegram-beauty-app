import { getTelegramUser } from './telegram';
import urls from '../../backend/func2url.json';

const API_URLS = {
  bookings: urls.bookings,
  notifications: urls.notifications,
  profile: urls.profile,
};

export interface Booking {
  id: number;
  date: string;
  time: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  masterName: string;
  serviceName: string;
  price: number;
  notes?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  telegramId: number;
  firstName: string;
  lastName: string;
  username: string;
  role: 'client' | 'master';
  phone: string;
  bookingsCount: number;
  createdAt: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const telegramUser = getTelegramUser();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Telegram-User': JSON.stringify(telegramUser),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const bookingsApi = {
  async getBookings(): Promise<Booking[]> {
    const data = await fetchWithAuth(API_URLS.bookings);
    return data.bookings;
  },

  async getAvailableSlots(masterId: number, date: string): Promise<string[]> {
    const url = `${API_URLS.bookings}?action=slots&master_id=${masterId}&date=${date}`;
    const data = await fetchWithAuth(url);
    return data.slots;
  },

  async createBooking(booking: {
    masterId: number;
    serviceId: number;
    date: string;
    time: string;
    duration: number;
    notes?: string;
  }): Promise<{ success: boolean; bookingId: number }> {
    const telegramUser = getTelegramUser();
    
    return fetchWithAuth(API_URLS.bookings, {
      method: 'POST',
      body: JSON.stringify({
        ...booking,
        telegramUser,
      }),
    });
  },

  async cancelBooking(bookingId: number): Promise<{ success: boolean }> {
    return fetchWithAuth(API_URLS.bookings, {
      method: 'PUT',
      body: JSON.stringify({
        bookingId,
        action: 'cancel',
      }),
    });
  },
};

export const notificationsApi = {
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return fetchWithAuth(API_URLS.notifications);
  },

  async markAsRead(notificationId: number): Promise<{ success: boolean }> {
    return fetchWithAuth(API_URLS.notifications, {
      method: 'PUT',
      body: JSON.stringify({ notificationId }),
    });
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    return fetchWithAuth(API_URLS.notifications, {
      method: 'POST',
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
  },
};

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    return fetchWithAuth(API_URLS.profile);
  },

  async updateProfile(data: {
    firstName: string;
    lastName?: string;
    phone?: string;
  }): Promise<{ success: boolean }> {
    return fetchWithAuth(API_URLS.profile, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
