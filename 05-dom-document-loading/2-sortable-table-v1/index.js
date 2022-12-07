const HEADER_DEFAULTS = {
  id: '',
  title: '',
  sortable: false,
  template: data => `<div class="sortable-table__cell">${escapeHtml(String(data))}</div>`,
  sortType: 'string'
};

/**
 * @param {string} input
 * @return {string}
 */
const escapeHtml = (input) => {
  return input.replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

export default class SortableTable {
  /** @type {Object<string, function>} */
  static sortMethods = {
    string: (a, b) => a.localeCompare(b, ['ru-RU', 'en-US'], {caseFirst: 'upper'}),
    number: (a, b) => a - b,
  };

  /** @type {Object<string, number>} */
  static sortOrders = {
    asc: 1,
    desc: -1,
  };

  /** @type {Object<string, HTMLElement>} */
  subElements = {};

  sortBy = '';
  sortOrder = '';

  /**
   * @param {Object[]} headerConfig
   * @param {Object[]} data
   */
  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig.map(cfg => Object.assign({...HEADER_DEFAULTS}, cfg));
    this.data = data;
    this.render();
  }

  /**
   * @param {string} field
   * @param {'asc'|'desc'} order
   */
  sort(field, order) {
    const column = this.getColumn(field);

    const mod = SortableTable.sortOrders[order];
    const provider = SortableTable.sortMethods[column.sortType];
    this.data.sort((a, b) => provider(a[field], b[field]) * mod);

    this.sortBy = field;
    this.sortOrder = order;

    this.render();
  }

  /**
   * @param {string} field
   * @return {Object}
   */
  getColumn(field) {
    const config = this.headerConfig.find(cfg => cfg.id === field);
    if (!config) {
      throw new Error('Unknown field: ' + field);
    }

    return config;
  }

  render() {
    /* Init elements */
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.classList.add('sortable-table');

      const header = this.subElements.header = document.createElement('div');
      header.classList.add('sortable-table__header', 'sortable-table__row');
      header.innerHTML = this.headerConfig.map(({id, title, sortable}) => {
        return `<div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}"><span>${title}</span></div>`;
      }).join('\n');

      const body = this.subElements.body = document.createElement('div');
      body.classList.add('sortable-table__body');

      this.element.appendChild(header);
      this.element.appendChild(body);

      header.querySelectorAll('[data-id]').forEach(el => {
        this.subElements['header_' + el.dataset.id] = el;
      });

      const sortArrow = this.subElements.sortArrow = document.createElement('span');
      sortArrow.classList.add('sortable-table__sort-arrow');
      sortArrow.innerHTML = '<span class="sort-arrow"></span>';
    }

    /* Show/hide order arrow */
    this.subElements.sortArrow.remove();

    if (this.sortBy) {
      const column = this.subElements['header_' + this.sortBy];
      column.dataset.order = this.sortOrder;
      column.appendChild(this.subElements.sortArrow);
    }

    /* Update data order */
    this.subElements.body.innerHTML = this.data
      .map(row => this.getRowTemplate(row))
      .join('\n');
  }

  getRowTemplate(row) {
    const cells = this.headerConfig
      .map(({id, template}) => template(row[id]))
      .join('\n');

    return `<a href="/products/${row.id}" class="sortable-table__row">${cells}</a>`;
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
      this.subElements = {};
    }
  }
}

