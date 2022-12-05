export default class ColumnChart {
  /** @type {string} */
  label = '';
  /** @type {number[]} */
  data = [];
  /** @type {number} */
  value = 0;
  /** @type {?string} */
  link = null;
  /** @type {?function} */
  headingFormatter = null;
  /** @type {number} */
  chartHeight = 50;

  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this.element = document.createElement('div');
    this.element.classList.add('column-chart');
    this.update(options);
  }

  /**
   * Updates component data
   * @param {Object} options
   */
  update(options = {}) {
    this.label = options.label ?? '';
    this.data = options.data ?? [];
    this.value = options.value ?? 0;
    this.link = options.link ?? null;
    this.headingFormatter = options.formatHeading ?? null;

    // Loading state
    if (this.data.length > 0) {
      this.element.classList.remove('column-chart_loading');
    } else {
      this.element.classList.add('column-chart_loading');
    }

    this.render();
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

  getTemplate() {
    const valueFormatted = typeof this.headingFormatter === 'function' ? this.headingFormatter(this.value) : this.value;
    const linkTemplate = this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : '';
    const chartsTemplate = this.getColumnProps(this.data)
      .map(item => `<div style="--value: ${item.value}" data-tooltip="${item.percent}"></div>`)
      .join('\n');

    return `<div class="column-chart__title">
        Total ${this.label}
        ${linkTemplate}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${valueFormatted}</div>
        <div data-element="body" class="column-chart__chart">
         ${chartsTemplate}
        </div>
      </div>`;
  }

  render() {
    this.element.style.setProperty('--chart-height', this.chartHeight.toString());
    this.element.innerHTML = this.getTemplate();
  }

  /**
   * @param {number[]} data
   * @return {Object[]}
   */
  getColumnProps(data) {
    const maxValue = Math.max(...data);
    const scale = this.chartHeight / maxValue;

    return data.map(item => {
      return {
        percent: (item / maxValue * 100).toFixed(0) + '%',
        value: String(Math.floor(item * scale))
      };
    });
  }

}
