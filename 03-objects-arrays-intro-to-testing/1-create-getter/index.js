/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const segments = path.split('.');

  return function(obj) {
    let result = obj;

    for (let key of segments) {
      if (typeof result === 'object') {
        result = result[key];
      }
    }

    return result;
  };
}
