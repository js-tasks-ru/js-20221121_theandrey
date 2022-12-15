class Tooltip {
  static _instance = new Tooltip();

  static haveTooltip = (el) => el.matches('[data-tooltip]');

  static getInstance() {
    return this._instance;
  }

  addedToPage = false;

  /**
   * @see getInstance
   * @return {Tooltip}
   */
  constructor() {
    // TODO: Создание singleton через new вводит в заблуждение
    return Tooltip._instance ?? this;
  }

  initialize() {
    this.element = document.createElement('div');
    this.element.className = 'tooltip';
    this.element.style.position = 'absolute';

    this._moveHandler = (event) => {
      this.tooltipX = event.pageX + 5;
      this.tooltipY = event.pageY + 5;
      this.render();
    };

    this._hoverHandler = (event) => {
      if (Tooltip.haveTooltip(event.target)) {
        this.tooltipText = event.target.dataset.tooltip;
        this.render();

        event.target.addEventListener('pointermove', this._moveHandler, {passive: true});
      }
    };

    this._leaveHandler = (event) => {
      if (Tooltip.haveTooltip(event.target)) {
        event.target.removeEventListener('pointermove', this._moveHandler);
        this.remove();
      }
    };

    document.body.addEventListener('pointerover', this._hoverHandler, {passive: true});
    document.body.addEventListener('pointerout', this._leaveHandler);
  }

  render() {
    if (!this.addedToPage) {
      document.body.append(this.element);
      this.addedToPage = true;
    }

    this.element.textContent = this.tooltipText;
    this.element.style.left = this.tooltipX + 'px';
    this.element.style.top = this.tooltipY + 'px';
  }

  remove() {
    if (this.element) {
      this.element.remove();
      this.addedToPage = false;
    }
  }

  destroy() {
    if (this.element) {
      this.remove();
      this.element = null;
      document.body.removeEventListener('pointerover', this._hoverHandler);
      document.body.removeEventListener('pointerout', this._leaveHandler);
    }
  }
}

export default Tooltip;
