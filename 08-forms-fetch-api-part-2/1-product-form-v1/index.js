import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  /** @type {Object<String, HTMLElement>} */
  subElements = {};

  /**
   * @param {?string} productId
   */
  constructor(productId) {
    this.productId = productId;

    this.element = document.createElement('div');
    this.element.className = 'product-form';
    this.element.innerHTML = this.getTemplate();

    this.element.querySelectorAll('[data-element]').forEach(el => {
      this.subElements[el.dataset.element] = el;
    });

    this.subElements.productForm.addEventListener('submit', event => {
      event.preventDefault();
      this.save();
    });
  }

  /**
   * @return {Promise<HTMLDivElement>} Компонент
   */
  async render() {
    await this.loadCategories();
    if (this.productId) {
      this.loadProduct();
    }

    return this.element;
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

  async loadCategories() {
    const url = new URL('api/rest/categories', BACKEND_URL);
    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');

    const json = await fetchJson(url);

    const categoryList = [];
    for (const category of json) {
      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          categoryList.push([subcategory.id, category.title + ' > ' + subcategory.title]);
        }
      } else {
        categoryList.push([category.id, category.title]);
      }
    }

    const select = this.subElements.categorySelect;
    select.innerHTML = '';

    categoryList.forEach(([id, title]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = title;
      select.append(option);
    });

    return json;
  }

  async loadProduct() {
    const url = new URL('api/rest/products', BACKEND_URL);
    url.searchParams.set('id', this.productId);

    const model = (await fetchJson(url)).shift();

    const formElements = this.subElements.productForm.elements;

    // Заполняем поля формы по name
    for (const [key, value] of Object.entries(model)) {
      if (formElements[key]) {
        formElements[key].value = value;
      }
    }

    // Загруженные изображения
    this.subElements.imageListContainer.innerHTML = this.getImageListTemplate(model.images);
  }

  async save() {
    const model = {};
    new FormData(this.subElements.productForm)
      .forEach(function (value, key) {
        model[key] = value;
      });

    let event;
    if (this.productId) {
      event = new CustomEvent('product-updated', {detail: model});
    } else {
      event = new CustomEvent('product-saved', {detail: model});
    }

    this.element.dispatchEvent(event);
  }

  getTemplate() {
    return `<form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input type="text" name="title" id="title" class="form-control" required />
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea class="form-control" name="description" id="description" required></textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortableListContainer">
        <label class="form-label">Фото</label>
        <div data-element="imageListContainer"></div>
        <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
      </div>
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select class="form-control" name="subcategory" id="subcategory" data-element="categorySelect"></select>
      </div>
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input type="number" name="price" id="price" class="form-control" required />
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input type="number" name="discount" id="discount" class="form-control" value="0" required />
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input type="number" class="form-control" name="quantity" id="quantity" value="1" required />
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select class="form-control" name="status" id="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">Сохранить товар</button>
      </div>
    </form>`;
  }

  getImageListTemplate(images = []) {
    const inner = images.map(({source, url}) => `<li class="products-edit__imagelist-item sortable-list__item">
          <input type="hidden" name="url[]" value="${escapeHtml(url)}" />
          <input type="hidden" name="source[]" value="${escapeHtml(source)}" />
          <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(url)}" />
            <span>${escapeHtml(source)}</span>
          </span>
          <button type="button"><img src="icon-trash.svg" data-delete-handle="" alt="delete"></button>
          </li>`)
      .join('\n');
    return `<ul class="sortable-list">${inner}</ul>`;
  }
}
