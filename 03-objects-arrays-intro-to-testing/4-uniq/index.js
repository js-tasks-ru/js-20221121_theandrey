/**
 * uniq - returns array of uniq values:
 * @param {*[]} arr - the array of primitive values
 * @returns {*[]} - the new array with uniq values
 */
export function uniq(arr) {
  if (Array.isArray(arr)) {
    // Поскольку indexOf() возвращает индекс первого найденного элемента,
    // у дубликатов индекс не будет соответствовать индексу текущему их положения в массиве.
    return arr.filter((value, index) => arr.indexOf(value) === index);
  }

  return [];
}
