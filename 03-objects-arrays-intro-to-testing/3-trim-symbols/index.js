/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {?number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  // Если параметр не передан
  if (typeof size !== 'number') {
    return string;
  }

  let repeats = 0;
  let result = '';

  for (let i = 0; i < string.length; i++) {
    const repeatPrevious = i > 0 && string[i - 1] === string[i];

    if (repeatPrevious) {
      repeats++;
    } else {
      repeats = 0;
    }

    if (repeats < size) {
      result += string[i];
    }
  }

  return result;
}
