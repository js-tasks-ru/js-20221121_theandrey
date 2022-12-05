export default class NotificationMessage {
  /** @type {HTMLElement} */
  static element;
  static timeoutId = 0;

  /**
   * @param {string} message
   * @param {number} duration
   * @param {string} type
   */
  constructor(message = '', {
    duration = 8000,
    type = ''
  } = {}) {
    this.duration = duration;
    this.element = NotificationMessage.element ?? (NotificationMessage.element = document.createElement('div'));
    this.element.className = 'notification ' + type;
    this.element.innerHTML = this.getTemplate(type, message);
  }

  /**
   * @param {string} type
   * @param {string} message
   * @return {string}
   */
  getTemplate(type, message) {
    return `<div class="timer"></div>
    <div class="inner-wrapper">
      <div class="notification-header">${type}</div>
      <div class="notification-body">${message}</div>
    </div>`;
  }

  /**
   * @param {HTMLElement} container
   */
  show(container = document.body) {
    clearTimeout(NotificationMessage.timeoutId);
    this.remove();
    container.appendChild(this.element);

    this.element.style.setProperty('--value', this.duration + 'ms');
    NotificationMessage.timeoutId = setTimeout(() => this.remove(), this.duration);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    if (this.element) {
      this.remove();
      this.element = null;
    }
  }
}
