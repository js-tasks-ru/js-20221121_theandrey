import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

export default class Page {
  /** @type {Object<String, HTMLElement>} */
  subElements = {};
  /** @type {Object<String, Object>} */
  components = {};

  /**
   * @param {CustomEvent} event
   */
  dateSelectHandler = event => {
    const {from, to} = event.detail;

    for (const component of Object.values(this.components)) {
      if (component instanceof ColumnChart) {
        component.loadData(from, to);

      } else if (component instanceof SortableTable) {
        component.url.searchParams.set('from', from.toISOString());
        component.url.searchParams.set('to', to.toISOString());
        component.loadData(component.sorted.id, component.sorted.order)
          .then(data => component.renderRows(data));
      }
    }
  };

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'dashboard';
    this.element.innerHTML = this.getTemplate();
    this.subElements = Page.findSubElements(this.element);

    this.initComponents();
  }

  initComponents() {
    const from = new Date();
    const to = new Date(from.getTime());
    from.setMonth(from.getMonth() - 1);

    const rangePicker = new RangePicker({from, to});

    const ordersChart = new ColumnChart({
      url: 'api/dashboard/orders',
      range: {from, to},
      label: 'orders',
      link: '#'
    });

    const salesChart = new ColumnChart({
      url: 'api/dashboard/sales',
      range: {from, to},
      label: 'sales',
      formatHeading: value => '$' + value,
    });

    const customersChart = new ColumnChart({
      url: 'api/dashboard/customers',
      range: {from, to},
      label: 'customers',
    });

    const sortableTable = new SortableTable(header, {
      url: `api/dashboard/bestsellers?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
    });

    document.addEventListener('date-select', this.dateSelectHandler);

    // Вставка на страницу
    this.components = {rangePicker, ordersChart, salesChart, customersChart, sortableTable};

    for (const [name, component] of Object.entries(this.components)) {
      this.subElements[name].append(component.element);
    }
  }

  async render() {
    return this.element;
  }

  remove() {
    for (const component of Object.values(this.components)) {
      if (typeof component.remove === 'function') { // ColumnChart не имеет метода
        component.remove();
      }
    }

    this.element.remove();
  }

  destroy() {
    this.remove();
    document.removeEventListener('date-select', this.dateSelectHandler);

    for (const component of Object.values(this.components)) {
      component.destroy();
    }

    this.element = null;
    this.subElements = {};
  }

  getTemplate() {
    return `<div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>
        <!-- RangePicker component -->
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <!-- column-chart components -->
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Best sellers</h3>

      <div data-element="sortableTable">
        <!-- sortable-table component -->
      </div>`;
  }

  static findSubElements(container) {
    return Object.fromEntries(
      [...container.querySelectorAll('[data-element]')]
        .map(el => [el.dataset.element, el])
    );
  }
}
