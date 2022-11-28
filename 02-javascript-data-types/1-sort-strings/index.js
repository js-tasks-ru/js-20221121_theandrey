/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [order="asc"] - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, order = 'asc') {
  const collator = new Intl.Collator(['ru-RU', 'en-US'], {caseFirst: 'upper'});

  let comparator;
  if (order === 'asc') {
    comparator = collator.compare;
  } else if (order === 'desc') {
    comparator = (a, b) => collator.compare(b, a);
  } else {
    throw new Error('Unknown order: ' + order);
  }

  return [...arr].sort(comparator);
}
