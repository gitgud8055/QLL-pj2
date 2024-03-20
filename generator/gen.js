const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('data.db');

function getv(l, r) {
  return Math.floor(Math.random() * (r - l + 1)) + l
}

function getc() {
  return String.fromCharCode('a'.charCodeAt(0) + getv(0, 25));
}

let maxH = 24*3600;
db.serialize(() => {
  const insert = db.prepare("insert into calendar (date, start, end, author, note) values (?, ?, ?, ?, ?)");
  for (let i = 0; i < 10; i++) {
    let day = getv(1, 90);
    let month = 2;
    if (day >= 29) {
      day -= 29;
      month++;
    }
    if (day >= 31) {
      day -= 31;
      month++;
    }
    let start = getv(0, maxH - 1);
    let end = getv(0, maxH - 1);
    if (start > end) {
      [start, end] = [end, start];
    }
    let author = "";
    for (let i = 0; i < 10; i++) author += getc();
    let note = "";
    for (let i = 0; i < 30; i++) note += getc();
    insert.run(`2024-${month}-${day}`, `${Math.floor(start/3600)}:${String(Math.floor((start % 3600) / 60)).padStart(2, '0')}`, `${Math.floor(end / 3600)}:${String(Math.floor((end%3600)/60)).padStart(2, '0')}`, author, note);
  }
  insert.finalize();
});
