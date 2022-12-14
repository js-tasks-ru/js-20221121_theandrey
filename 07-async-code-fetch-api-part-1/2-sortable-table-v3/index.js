import fetchJson from './utils/fetch-json.js';
import escapeHtml from './utils/escape-html.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  /** @type {Object<string, function>} */
  static sortMethods = {
    string: (a, b) => a.localeCompare(b, ['ru-RU', 'en-US'], {caseFirst: 'upper'}),
    number: (a, b) => a - b,
  };

  /** @type {Object<string, number>} */
  static sortOrders = {asc: 1, desc: -1};

  /** @type {number} Кол-во запрашиваемых записей с сервера */
  static limit = 30;

  /** @type {number} С какой позиции запрашивать данные с сервера */
  offset = 0;

  /** @type {Object<string, HTMLElement>} */
  subElements = {};

  data = [];
  isLoadingData = false;
  isEndReached = false;

  /**
   * @param {Event} event
   */
  scrollHandler = async (event) => {
    const {bottom} = this.element.getBoundingClientRect();
    const windowHeight = document.documentElement.clientHeight;
    const bottomOffset = 100;

    if (windowHeight > bottom - bottomOffset && !this.isEndReached && !this.isLoadingData) {
      this.isLoadingData = true;
      this.offset += SortableTable.limit;

      try {
        const data = await this.loadData(false);

        if (data.length > 0) {
          this.data.push(...data);
          this.render();
        } else if (this.offset > 0) {
          this.isEndReached = true; // BackEnd никак не сообщает о достижении конца списка, будем считать пустой за конец данных
        }

      } finally {
        this.isLoadingData = false;
      }
    }
  }

  constructor(headersConfig, {
    url = '',
    isSortLocally = false,
    sorted = {}
  } = {}) {
    this.headersConfig = headersConfig;
    this.isSortLocally = isSortLocally;
    this.url = new URL(url, BACKEND_URL);
    this.sorted = sorted;

    this.render();
    this.loadData();

    window.addEventListener('scroll', this.scrollHandler, {passive: true});
  }

  /**
   * @param {string} id Column ID
   * @param {'asc'|'desc'} order Sort direction
   */
  sort(id, order) {
    if (this.isSortLocally) {
      this.sortOnClient(id, order);
    } else {
      this.sortOnServer(id, order);
    }
  }

  /**
   * @param {string} id Column ID
   * @param {'asc'|'desc'} order Sort direction
   */
  sortOnClient(id, order) {
    const column = this.getColumn(id);

    const mod = SortableTable.sortOrders[order];
    const provider = SortableTable.sortMethods[column.sortType];
    this.data.sort((a, b) => provider(a[id], b[id]) * mod);

    this.sorted.id = id;
    this.sorted.order = order;

    this.render();
  }

  /**
   * @param {string} id Column ID
   * @param {'asc'|'desc'} order Sort direction
   */
  async sortOnServer(id, order) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);
    this.offset = 0;
    this.isEndReached = false;

    this.data = await this.loadData(false);
    this.sorted.id = id;
    this.sorted.order = order;
    this.render();
  }

  /**
   * @param {string} field
   * @return {Object}
   */
  getColumn(field) {
    const config = this.headersConfig.find(cfg => cfg.id === field);
    if (!config) {
      throw new Error('Unknown field: ' + field);
    }

    return config;
  }

  render() {
    /* Init elements */
    if (!this.element) {
      this.init();
    }

    /* Show/hide order arrow */
    this.subElements.sortArrow.remove();

    if (this.sorted && this.sorted.id && this.sorted.order) {
      const cell = this.subElements['header_' + this.sorted.id];
      cell.dataset.order = this.sorted.order;
      cell.append(this.subElements.sortArrow);
    }

    /* Update data order */
    this.subElements.body.innerHTML = this.data
      .map(row => this.getRowTemplate(row))
      .join('\n');
  }

  init() {
    this.element = document.createElement('div');
    this.element.classList.add('sortable-table');

    const header = this.subElements.header = document.createElement('div');
    header.classList.add('sortable-table__header', 'sortable-table__row');

    header.append(...this.headersConfig.map(({id, title, sortable}) => {
      const div = document.createElement('div');
      div.className = 'sortable-table__cell';
      div.innerHTML = `<span>${title}</span>`;

      if (sortable) {
        // Добавляем атрибут только там где включена сортировка, чтобы курсор мыши лишний раз не менялся.
        div.dataset.sortable = String(sortable);

        div.addEventListener('pointerdown', event => {
          event.preventDefault(); // Предотвращает выделение текста

          const order = SortableTable.nextOrder(div.dataset.order ?? 'asc'); // Исключительно для прохождения desc-теста
          this.sort(id, order);
        });
      }

      this.subElements['header_' + id] = div;

      return div;
    }));

    const body = this.subElements.body = document.createElement('div');
    body.className = 'sortable-table__body';
    this.element.append(header, body);

    const sortArrow = this.subElements.sortArrow = document.createElement('span');
    sortArrow.classList.add('sortable-table__sort-arrow');
    sortArrow.innerHTML = '<span class="sort-arrow"></span>';
  }

  getRowTemplate(row) {
    const defaultTemplate = (data) => `<div class="sortable-table__cell">${escapeHtml(String(data))}</div>`;

    const cells = this.headersConfig
      .map(({id, template}) => template ? template(row[id]) : defaultTemplate(row[id]))
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

    window.removeEventListener('scroll', this.scrollHandler);
  }

  /**
   * Запрашивает данные с сервера, обновляя всю таблицу
   * @param {boolean} updateTable Автоматически обновить данные таблицы (перезапись)
   * @return {Promise<Array>}
   */
  async loadData(updateTable = true) {
    this.url.searchParams.set('_start', String(this.offset));
    this.url.searchParams.set('_end', String(this.offset + SortableTable.limit)); // Все БД используют offset & limit, никаких end

    const data = await fetchJson(this.url);

    if (updateTable) {
      this.data = data;
      this.render();
    }

    return data;
  }

  /**
   * Возвращает следующий вариант направления сортировки по кругу
   * @param {string} current
   * @return {string}
   */
  static nextOrder(current) {
    const orders = Object.keys(this.sortOrders);
    let i = orders.indexOf(current) + 1;

    if (i >= orders.length) {
      i = 0;
    }

    return orders[i];
  }
}
