import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  /** @type {Object<String, HTMLElement>} */
  subElements = {};
  /** @type {Object[]} */
  images = [];

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

    this.initListeners();
  }

  initListeners() {
    this.subElements.productForm.addEventListener('submit', event => {
      event.preventDefault();
      this.save();
    });

    this.subElements.imageListContainer.addEventListener('click', event => {
      const buttonDelete = event.target.closest('[data-delete-handle]');

      if (buttonDelete) {
        event.preventDefault();

        const item = event.target.closest('.products-edit__imagelist-item');
        if (item) {
          const image = this.images.find(obj => obj.url === item.dataset.url);
          this.images = this.images.filter(obj => obj.url !== item.dataset.url);
          this.subElements.imageListContainer.innerHTML = this.getImageListTemplate();

          if (image && image.deletehash) {
            ProductForm.imgurDelete(image.deletehash);
          }
        }
      }
    });

    this.subElements.buttonUpload.addEventListener('click', event => {
      event.preventDefault();
      this.subElements.fileInput.click();
    });

    this.subElements.fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      const result = await ProductForm.imgurUpload(file);

      if (result.success) {
        this.images.push({
          source: file.name,
          url: result.data.link,
          deletehash: result.data.deletehash
        });
        this.subElements.imageListContainer.innerHTML = this.getImageListTemplate();
      }
    });
  }

  /**
   * @return {Promise<HTMLDivElement>} ??????????????????
   */
  async render() {
    const promises = [this.loadCategories()];
    if (this.productId) {
      promises.push(this.loadProduct());
    }

    await Promise.all(promises);

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

    // ?????????????????? ???????? ?????????? ???? name
    for (const [key, value] of Object.entries(model)) {
      if (formElements[key]) {
        formElements[key].value = value;
      }
    }

    // ?????????????????????? ??????????????????????
    this.images = model.images;
    this.subElements.imageListContainer.innerHTML = this.getImageListTemplate();
  }

  async save() {
    const formData = new FormData(this.subElements.productForm);

    // ???????????????????????????? ?? ??????????
    const numericFields = [...this.subElements.productForm.elements]
      .filter(input => input.type === 'number' || input.name === 'status')
      .map(input => input.name);

    const model = Object.fromEntries(
      [...formData.entries()].map(item => numericFields.includes(item[0]) ? [item[0], Number(item[1])] : item)
    );

    // ?????????????????????? ???? ???????????? ??????????????????, ?????????????? ???? ?????????? ????????
    model.images = this.images.map(({url, source}) => {
      return {url, source};
    });

    let eventName;
    let methodName;
    if (this.productId) {
      model.id = this.productId;
      eventName = 'product-updated';
      methodName = 'PATCH';
    } else {
      eventName = 'product-saved';
      methodName = 'POST';
    }

    const url = new URL('api/rest/products', BACKEND_URL);
    const result = await fetchJson(url, {
      method: methodName,
      headers: {'Content-Type': 'application/json;charset=UTF-8'},
      body: JSON.stringify(model)
    });

    this.element.dispatchEvent(new CustomEvent(eventName, {detail: result}));
  }

  getTemplate() {
    return `<form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">???????????????? ????????????</label>
          <input type="text" name="title" id="title" class="form-control" required />
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">????????????????</label>
        <textarea class="form-control" name="description" id="description" required></textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortableListContainer">
        <label class="form-label">????????</label>
        <div data-element="imageListContainer"></div>
        <button type="button" class="button-primary-outline" data-element="buttonUpload"><span>??????????????????</span></button>
        <input type="file" data-element="fileInput" hidden="hidden" />
      </div>
      <div class="form-group form-group__half_left">
        <label class="form-label">??????????????????</label>
        <select class="form-control" name="subcategory" id="subcategory" data-element="categorySelect"></select>
      </div>
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">???????? ($)</label>
          <input type="number" name="price" id="price" class="form-control" required />
        </fieldset>
        <fieldset>
          <label class="form-label">???????????? ($)</label>
          <input type="number" name="discount" id="discount" class="form-control" value="0" required />
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">????????????????????</label>
        <input type="number" class="form-control" name="quantity" id="quantity" value="1" required />
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">????????????</label>
        <select class="form-control" name="status" id="status">
          <option value="1">??????????????</option>
          <option value="0">??????????????????</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">?????????????????? ??????????</button>
      </div>
    </form>`;
  }

  getImageListTemplate() {
    const inner = this.images.map(({source, url}) => `<li class="products-edit__imagelist-item sortable-list__item" data-url="${escapeHtml(url)}">
          <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(url)}" />
            <span>${escapeHtml(source)}</span>
          </span>
          <button type="button" data-delete-handle><img src="icon-trash.svg" alt="delete"></button>
          </li>`)
      .join('\n');
    return `<ul class="sortable-list">${inner}</ul>`;
  }

  /**
   * @param {File} file
   * @return {Promise<Object>}
   */
  static async imgurUpload(file) {
    const formData = new FormData();
    formData.append('image', file);

    return await fetchJson('https://api.imgur.com/3/upload', {
      method: 'POST',
      headers: {'Authorization': 'Client-ID ' + IMGUR_CLIENT_ID},
      body: formData,
      referrer: ''
    });
  }

  /**
   * @param {string} deleteHash
   * @return {Promise<Object>}
   */
  static async imgurDelete(deleteHash) {
    return await fetchJson('https://api.imgur.com/3/image/' + encodeURI(deleteHash), {
      method: 'DELETE',
      headers: {'Authorization': 'Client-ID ' + IMGUR_CLIENT_ID},
      referrer: ''
    });
  }
}
