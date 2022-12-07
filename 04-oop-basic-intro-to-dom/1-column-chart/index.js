export default class ColumnChart {
  chartHeight = 50;
  /** @type {Object<string, HTMLElement>} */
  elements = {};

  constructor(
    {
      label = '',
      data = [],
      value = 0,
      link = '',
      formatHeading = (val) => val
    } = {}
  ) {
    this.label = label;
    this.data = data;
    this.value = value;
    this.link = link;
    this.headingFormatter = formatHeading;

    this.render();
  }

  /**
   * Updates component data
   * @param {number[]} data
   */
  update(data = []) {
    this.data = data;
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
      this.elements = {};
    }
  }

  getTemplate() {
    const linkTemplate = this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : '';

    return `<div class="column-chart__title">
        Total ${this.label}
        ${linkTemplate}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header"><!-- {value} --></div>
        <div data-element="body" class="column-chart__chart"><!-- {charts} --></div>
      </div>`;
  }

  getChartsTemplate() {
    return this.getColumnProps(this.data)
      .map(item => `<div style="--value: ${item.value}" data-tooltip="${item.percent}"></div>`)
      .join('\n');
  }

  render() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.innerHTML = this.getTemplate();
      this.element.querySelectorAll('[data-element]').forEach((el) => {
        this.elements[el.dataset.element] = el;
      });
    }

    this.element.style.setProperty('--chart-height', this.chartHeight.toString());
    this.element.className = ColumnChart.filterClassList({
      'column-chart': true,
      'column-chart_loading': !this.data.length,
    }).join(' ');

    this.elements.header.innerHTML = this.headingFormatter(this.value);
    this.elements.body.innerHTML = this.getChartsTemplate();
  }

  /**
   * Filters CSS class list by condition
   * @param {Object<string, boolean>} list Class names
   * @return {string[]}
   */
  static filterClassList(list) {
    return Object.entries(list)
      .filter(([clazz, enabled]) => enabled)
      .map(([clazz]) => clazz);
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
