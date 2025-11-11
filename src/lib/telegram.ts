import WebApp from '@twa-dev/sdk';

export const initTelegram = () => {
  if (typeof window !== 'undefined') {
    WebApp.ready();
    WebApp.expand();
    
    WebApp.setHeaderColor('#ffffff');
    WebApp.setBackgroundColor('#ffffff');
    
    return WebApp;
  }
  return null;
};

export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
    return {
      id: WebApp.initDataUnsafe.user.id,
      firstName: WebApp.initDataUnsafe.user.first_name,
      lastName: WebApp.initDataUnsafe.user.last_name,
      username: WebApp.initDataUnsafe.user.username,
      photoUrl: WebApp.initDataUnsafe.user.photo_url,
    };
  }
  return null;
};

export const showMainButton = (text: string, onClick: () => void) => {
  WebApp.MainButton.setText(text);
  WebApp.MainButton.show();
  WebApp.MainButton.onClick(onClick);
};

export const hideMainButton = () => {
  WebApp.MainButton.hide();
};

export const showBackButton = (onClick: () => void) => {
  WebApp.BackButton.show();
  WebApp.BackButton.onClick(onClick);
};

export const hideBackButton = () => {
  WebApp.BackButton.hide();
};

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
  if (type === 'success' || type === 'warning' || type === 'error') {
    WebApp.HapticFeedback.notificationOccurred(type);
  } else {
    WebApp.HapticFeedback.impactOccurred(type);
  }
};

export default WebApp;
