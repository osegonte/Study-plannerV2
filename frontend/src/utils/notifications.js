export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.nextId = 1;
  }

  show(message, type = 'info', duration = 5000) {
    const notification = {
      id: this.nextId++,
      message,
      type,
      timestamp: Date.now(),
      duration
    };
    this.notifications.push(notification);
    this.notifyListeners();
    
    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }
    return notification.id;
  }

  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }
}

export const notificationManager = new NotificationManager();
window.showNotification = (message, type, duration) => {
  return notificationManager.show(message, type, duration);
};
