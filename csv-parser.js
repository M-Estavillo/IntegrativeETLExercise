(function(root) {
'use strict';
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false, closed = false;
    const endField = () => { row.push(field); field = ''; closed = false; };
    const endRow = () => { endField(); if (row.some(value => value.trim() !== '')) rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { quoted = false; closed = true; }
        } else field += c;
      } else if (c === ',') endField();
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        endRow();
      } else if (c === '"' && field === '' && !closed) quoted = true;
      else {
        if (closed || c === '"') throw new Error('Invalid CSV quotation.');
        field += c;
      }
    }
    if (quoted) throw new Error('CSV contains an unclosed quoted field.');
    if (field !== '' || row.length || closed) endRow();
    return rows;
  }
const api = {parseCSV};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.CSVParser = api;
})(globalThis);
