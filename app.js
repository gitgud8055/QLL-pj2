const express = require('express');
const url = require('url');
const path = require('path');
const parser = require('body-parser');
const ejs = require('ejs');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');

const app = express();
const db = new sqlite3.Database('data.db');

const { spawnSync, spawn} = require('child_process');
const { error, log } = require('console');

const ui = require('./module/upload-image');
const uf = require('./module/upload-file');
const {deleteFile} = require('./module/delete-uploaded')

app.use(parser.urlencoded({extended: true}));
app.use(parser.json());
app.use(session({
  secret: 'Welcome to a new 210 episode',
  resave: false,
  saveUninitialized: true
}));

app.use('/source', express.static('source'));
app.use('/views', express.static('views'));
app.use('/uf', express.static('user-file'))

const check_logged = (req) => {
  return req.session && req.session.logged;
}
const log_authorize = (req, res, next) => {
  if (check_logged(req)) {
    return next();
  }
  //res.render(`${__dirname}/views/login.ejs`, {root: __dirname});
  res.redirect('/login');
};

app.get('/login', function(req, res) {
  if (!check_logged(req)) res.render(`${__dirname}/views/login.ejs`, {root: __dirname});
  else res.redirect('/');
});

app.get('/', log_authorize, function(req, res) {
  res.render(`${__dirname}/views/main.ejs`, {root: __dirname, title: "Trang chủ", link: `/source/image/${req.session.avatar}`});
});

app.get('/account', log_authorize, function(req, res) {
  try {
    db.all("select * from information where id = ?", [req.session.key], (e, rows) => {
      if (e || rows.length !== 1) {
        res.status(502).json({message: "Something went wrong"});
      }
      res.render(`${__dirname}/views/account-manage.ejs`, {root: __dirname, title: "Quản lý tài khoản", link: `/source/image/${req.session.avatar}`, username: req.session.username,
      name: rows[0].name, phone_number: rows[0].phone, id: rows[0].id, email: rows[0].email, role: rows[0].role, position: rows[0].pos});
    });
  }
  catch (e) {
    res.status(502).json({message: e.message});
  }
});

app.get('/account/:target', log_authorize, function(req, res) {
  const targetID = req.params.target;
  try {
    db.serialize(function() {
      let account;
      db.all(`select * from account where id = ?`, [targetID],(e, rows) => {
        if (e || rows.length !== 1) {
          res.status(503).json({message: "Không tồn tại user này"});
        }
        account = rows[0];
      });
      db.all(`select * from information where id = ?`, [targetID], (e, rows) => {
        if (e || rows.length !== 1) {
          res.status(503).json({message: "Something went wrong"});
        }
        res.render(`${__dirname}/views/account-info.ejs`, {root: __dirname, title: "", link: `/source/image/${account.avatar}`, username: account.username,
        name: rows[0].name, phone_number: rows[0].phone, id: rows[0].id, email: rows[0].email, role: rows[0].role, position: rows[0].pos});
      })
    });
  } catch (e) {
    res.status(503).json({message: e.message});
  }
}); 

app.post('/api/login', async function(req, res) {
  const data = req.body;
  try {
    db.serialize(function() {
      db.all("select * from (select * from account where username = ?) a join information i where a.id = i.id", [data.username], (e, rows) => {
        if (e || rows.length !== 1 || rows[0].password != data.password) {
          res.status(500).json({message: "Wrong username or password"});
        }
        else {
          //res.render(`${__dirname}/views/main.ejs`, {root: __dirname});
          req.session.logged = true;
          req.session.authority = rows[0].authority;
          req.session.username = rows[0].username;
          req.session.key = rows[0].id;
          req.session.avatar = rows[0].avatar;
          res.json('/');
        }
      });
    });
  }
  catch (e) {
    res.status(500).json({message: e.message});
  }
});

app.post('/api/logout', function(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.log(`Logout error: ${err.message}`);
    }
    res.json('/login');
  });
});

app.get('/api/account', log_authorize, function(req, res) {
  res.render(`${__dirname}/views/account.ejs`, {root: __dirname, username: req.session.username, link: `/source/image/${req.session.avatar}`});
});

app.get('/class', log_authorize, function(req, res) {
  try {
    if (req.session.authority === "student") {
      db.serialize(async function() {
        try {
          let data;
          await new Promise((res, rej) => {
            db.all(`select i.id, c.class_id as cid, c.class_name as cn, c.course_id as course, i.name, i.email from (select class_id from learn where id = ?) l 
            join class c on l.class_id = c.class_id join teach t on c.class_id = t.class_id join information i where i.id = t.id`, 
            [req.session.key], (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              data = rows;
              res();
            });
          });
          
          let waiting, pending;
          await new Promise((res, rej) => {
            db.all(`select idx from date_set where id_owner = ?`, [req.session.key], (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              waiting = Array.from(rows, (x) => x.idx);
              res();
            });
          });
          let user_pend;
          await new Promise((res, rej) => {
            db.all(`select * from date_target where id = ?`, [req.session.key], (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              user_pend = rows;
              pending = Array.from(rows, (x) => x.idx);
              res();
            });
          });
          let total = waiting.concat(pending);
          let date_info = {};
          await new Promise((res, rej) => {
            db.all(`select * from (select * from date_set where idx in (${total.map(() => '?').join(', ')})) ds 
            join (select id, name from information) i on ds.id_owner = i.id`, 
            total, (e, rows) => {
              if (e) {
                console.log(e.message);
                rej("Lỗi database");
              }
              console.log(rows);
              rows.forEach((x) => {
                date_info[x.idx] = x;
              });
              res();
            });
          });
          await new Promise((res, rej) => {
            db.all(`select * from date_book where idx in (${total.map(() => '?').join(', ')})`,
            total, (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              rows.forEach((x) => {
                if (!('date' in date_info[x.idx])) {
                  date_info[x.idx].date = [];
                  date_info[x.idx].file = [];
                }
                date_info[x.idx].date.push([x.start, x.end]);
              });
              res();
            });
          });
          await new Promise((res, rej) => {
            db.all(`select * from date_file where idx in (${total.map(() => '?').join(', ')})`,
            total, (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              rows.forEach((x) => {
                if (!('file' in date_info[x.idx])) {
                  date_info[x.idx].file = [];
                }
                date_info[x.idx].file.push([x.PathName, x.url]);
              });
              res();
            });
          });

          let user_wait;
          await new Promise((res, rej) => {
            db.all(`select * from (select * from date_target where idx in (${waiting.map(() => '?').join(', ')})) dt join (select id, name from information) i on dt.id = i.id`, waiting, (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              user_wait = rows;
              res();
            });
          });
          res.render(`${__dirname}/views/class-student.ejs`, {root: __dirname, link: `/source/image/${req.session.avatar}`, title: 'Danh sách',
          data: data, info: date_info, wait: user_wait, pend: user_pend});
        } catch (e) {
          console.log(e);
          res.status(504).json({message: e});
        }
      });
    }
    else if (req.session.authority === "teacher") {
      db.serialize(async function() {
        try {
          let data;
          await new Promise((res, rej) => {
            db.all(`select i.id, c.class_id as cid, c.class_name as cn, c.course_id as course, i.role, i.pos as position, i.name
            from (select class_id from teach where id = ?) t join class c on t.class_id = c.class_id join learn l on l.class_id = c.class_id join information i on i.id = l.id`, 
            [req.session.key], (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              data = rows;
              res();
            });
          });

          let waiting, pending;
          await new Promise((res, rej) => {
            db.all(`select idx from date_set where id_owner = ?`, [req.session.key], (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              waiting = Array.from(rows, (x) => x.idx);
              res();
            });
          });
          let user_pend;
          await new Promise((res, rej) => {
            db.all(`select * from date_target where id = ?`, [req.session.key], (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              user_pend = rows;
              pending = Array.from(rows, (x) => x.idx);
              res();
            });
          });
          let total = waiting.concat(pending);
          let date_info = {};
          await new Promise((res, rej) => {
            db.all(`select * from (select * from date_set where idx in (${total.map(() => '?').join(', ')})) ds 
            join (select id, name from information) i on ds.id_owner = i.id`, 
            total, (e, rows) => {
              if (e) {
                console.log(e.message);
                rej("Lỗi database");
              }
              console.log(rows);
              rows.forEach((x) => {
                date_info[x.idx] = x;
              });
              res();
            });
          });
          await new Promise((res, rej) => {
            db.all(`select * from date_book where idx in (${total.map(() => '?').join(', ')})`,
            total, (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              rows.forEach((x) => {
                if (!('date' in date_info[x.idx])) {
                  date_info[x.idx].date = [];
                  date_info[x.idx].file = [];
                }
                date_info[x.idx].date.push([x.start, x.end]);
              });
              res();
            });
          });
          await new Promise((res, rej) => {
            db.all(`select * from date_file where idx in (${total.map(() => '?').join(', ')})`,
            total, (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              rows.forEach((x) => {
                if (!('file' in date_info[x.idx])) {
                  date_info[x.idx].file = [];
                }
                date_info[x.idx].file.push([x.PathName, x.url]);
              });
              res();
            });
          });

          let user_wait;
          await new Promise((res, rej) => {
            db.all(`select * from (select * from date_target where idx in (${waiting.map(() => '?').join(', ')})) dt join (select id, name from information) i on dt.id = i.id`, waiting, (e, rows) => {
              if (e) {
                console.error(e.message);
                rej("Lỗi database");
              }
              user_wait = rows;
              res();
            });
          });
          res.render(`${__dirname}/views/class-teacher.ejs`, {root: __dirname, link: `/source/image/${req.session.avatar}`, title: 'Danh sách',
          data: data, info: date_info, wait: user_wait, pend: user_pend});
        } catch (e) {
          console.log(e);
          res.status(504).json({message: e});
        }
      });
    }
  }
  catch(e) {
    res.status(504).json({message: e.message});
  }
});

function verify_date(s) {
  return !isNaN(Date.parse(s));
}

app.post('/api/set-user-date', log_authorize, function(req, res) {
  const data = req.body;
  console.log(data);
  if (!(data.id && data.start && data.end)) {
    return res.status(509).json({message: "Dữ liệu đầu vào bị thiếu"});
  }
  if (!verify_date(data.start) || !verify_date(data.end)) {
    return res.status(509).json({message: "Thời gian không hợp lệ"});
  }
  if (data.start > data.end) {
    return res.status(509).json({message: "Thời điểm bắt đầu phải trước thời điểm kết thúc"});
  }
  db.serialize(async function() {
    try {
      await new Promise((res, rej) => {
        db.all(`select * from date_target where idx = ? and id = ?`, [data.id, req.session.key], (e, rows) => {
          if (e) {
            console.error("add ", e);
            rej("Không có quyền sửa đổi");
          }
          res();
        });
      });
      await new Promise((res, rej) => {
        db.all(`select * from date_book where idx = ?`, [data.id], (e, rows) => {
          if (e) {
            console.error("check ", e) ;
            rej("Lỗi database");
          }
          rows.forEach((x) => {
            if (x.start <= data.start && data.end <= x.end) {
              res();
            }
          });
          rej("Thời gian chọn không nằm trong lịch rảnh");
        });
      });
      await new Promise((res, rej) => {
        db.run(`update date_target set start = ?, end = ? where idx = ? and id = ?`, [data.start, data.end, data.id, req.session.key], (e) => {
          if (e) {
            console.error("update ", e);
            rej("Lỗi database");
          }
          res();
        });
      });
      res.json({message: "success"});
    }
    catch (e) {
      console.log(e);
      res.status(509).json({message: e});
    }
  });
});

app.post('/api/change-date', log_authorize, uf.upload.array('file-document'), function(req, res) {
  const data = req.body;
  // console.log(data);
  // console.log(req.files);
  if (data.desc && data.pl && data.pl.length > 0) {
    let id = data.pl[0];
    data.pl.shift();
    db.serialize(async function() {
      try {
        await new Promise((sol, rej) => {
          db.run("begin transaction", (e) => {
            if (e) {
              console.error("begin ", e.message);
              rej("Lỗi database");
            }
            sol();
          })
        });
        await new Promise((sol, rej) => {
          db.all("select * from date_set where idx = ? and id_owner = ?", [id, req.session.key], (e, rows) => {
            if (e) {
              console.error("verify ", e.message);
              rej("Lỗi database");
            }
            if (rows.length !== 1) {
              rej("Không có quyền sửa đổi thông tin");
            }
            sol();
          });
        });
        await new Promise((sol, rej) => {
          db.run("update date_set set note = ? where idx = ?", [data.desc, id], (e) => {
            if (e) {
              console.error("desc ", e.message);
              rej("Lỗi database");
            }
            sol();
          });
        });
        if (data.pl.length > 0) {
          await new Promise((res, rej) => {
            db.run(`delete from date_file where idx = ? and url in (${`?,`.repeat(data.pl.length).slice(0, -1)})`, [id].concat(data.pl), (e) => {
              if (e) {
                console.error("delete ", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
        }
        if (req.files.length > 0) {
          await new Promise((res, rej) => {
            db.run(`insert into date_file values ${`(${id}, ?, ?),`.repeat(req.files.length).slice(0, -1)}`, req.files.flatMap(x => [x.originalname, x.filename]), (e) => {
              if (e) {
                console.error("date_file", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
        }
        await new Promise((sol, rej) => {
          db.run("commit", (e) => {
            if (e) {
              console.error("commit ", e.message);
              rej("Lỗi database");
            }
          });
          sol();
        });
        res.json({message: "Success"});
      }
      catch (e) {
        deleteFile(req.files);
        await new Promise((res, rej) => {
          db.run("rollback", (e) => {
            if (e) {
              console.error("rollback", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        res.status(510).json({message: e});
      }
    });
  }
  else {
    deleteFile(req.files);
    res.status(510).json({message: "Thông tin thiếu hoặc không hợp lệ"});
  }
});

app.post('/api/set-date', log_authorize, uf.upload.array('file-document'),function(req, res) {
  // console.log(req.body);
  // console.log(req.files);
  if (req.body.time && req.body.desc && req.body.target) {
    for (let i = 0; i < req.body.time.length; i += 2) {
      if (!(req.body.time[i] && req.body.time[i+1] && req.body.time[i] <= req.body.time[i + 1])) {
        req.body.time[i] = req.body.time[i+1] = '';
      }
    }
    req.body.time = req.body.time.filter(x => x);
    if (req.body.time.length === 0) {
      deleteFile(req.files);
      return res.status(508).json({message: "Không tồn tại thời gian hợp lệ"});
    }
    db.serialize(async function() {
      try {
        await new Promise((res, rej) => {
          db.run("begin transaction", (e) => {
            if (e) {
              console.error("begin transaction", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        await new Promise((res, rej) => {
          db.run(`insert into date_set (id_owner, note) values(?, ?)`, [req.session.key, req.body.desc], (e) => {
            if (e) {
              console.error("date_set", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        let id;
        await new Promise((res, rej) => {
          db.all(`select idx from date_set where idx = last_insert_rowid()`, (e, rows) => {
            if (e || rows.length !== 1) {
              rej("Lỗi database");
            }
            id = rows[0].idx;
            res();
          });
        });
        await new Promise((res, rej) => {
          db.run(`insert into date_target(idx, id) values ${`(${id}, ?),`.repeat(req.body.target.length).slice(0, -1)}`, req.body.target, (e) => {
            if (e) {
              console.error("date_target", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        await new Promise((res, rej) => {
          db.run(`insert into date_book values ${`(${id}, ?, ?),`.repeat(req.body.time.length/2).slice(0, -1)}`, req.body.time, (e) => {
            if (e) {
              console.error("date_book", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        if (req.files.length > 0) {
          await new Promise((res, rej) => {
            db.run(`insert into date_file values ${`(${id}, ?, ?),`.repeat(req.files.length).slice(0, -1)}`, req.files.flatMap(x => [x.originalname, x.filename]), (e) => {
              if (e) {
                console.error("date_file", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
        }
        await new Promise((res, rej) => {
          db.run("commit", (e) => {
            if (e) {
              console.error("commit", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        res.json({message: "Success"});
      }catch (e) {
        deleteFile(req.files);
        await new Promise((res, rej) => {
          db.run("rollback", (e) => {
            if (e) {
              console.error("rollback", e.message);
              rej("Lỗi database");
            }
            res();
          });
        });
        res.status(508).json({message: e});
      }
    });
  }
  else {
    deleteFile(req.files);
    res.status(508).json({message: "Thông tin thiếu hoặc không hợp lệ"});
  }
});

app.post('/api/book', function(req, res) {
  const data = req.body;
  try {
    new Promise(function(suc, rej) {
      db.all(`select * from calendar where id = ? and date like '%${data.year}-${data.month.toString().padStart(2, "0")}-%'`, [req.session.key],(err, rows) => {
        if (err) {
          rej(err.message);
        }
        rows.forEach(function(v) {
          v.date = v.date.split('-')[2];
        });
        res.json(rows);
        suc();
      });
    });
  } catch (err) {
    res.status(500).json({message: err});
  }
});

app.get('/api/book/:idx', log_authorize, function(req, res) {
  const data = req.params.idx;
  console.log(data);
  db.serialize(async function() {
    try {
      await new Promise((res, rej) => {
        db.all(`select id from calendar where mid = ?`, [data], (e, rows) => {
          if (e || rows.length !== 1 || rows[0].id !== req.session.key) {
            rej("Invalid");
          }
          res();
        });
      });
      await new Promise((suc, rej) => {
        db.all(`select pathname as name, url as path from filedata where id = ?`, [data], (e, rows) => {
          if (e) {
            console.error(e.message);
            rej("Lỗi database");
          }
          res.json({data: rows});
          suc();
        });
      });
    } catch (err) {
      res.status(507).json({message: err});
    }
  });
});

app.get('/api/download', log_authorize, function(req, res) {
  return res.download(`./user-file/${req.query.l}`, req.query.n);
  const data = req.params.url;
  const idx = req.query.id;
  db.serialize(async function() {
    try {
      await new Promise((res, rej) => {
        db.all(`select id from calendar where mid = ?`, [data.id], (e, rows) => {
          if (e || rows.length !== 1 || rows[0].id !== req.session.key) {
            console.error(e.message);
            rej("Invalid");
          }
          res();
        });
      });
      await new Promise((suc, rej) => {
        db.all(`select pathname as name, url as path from filedata where id = ?`, [data], (e, rows) => {
          if (e) {
            console.error(e.message);
            rej("Lỗi database");
          }
          res.json({data: rows});
          suc();
        });
      });
    } catch (err) {
      res.status(507).json({message: err});
    }
  });
});

const convert = {'name': 'name', 'phone_number': 'phone', 'email': 'email', 'role': 'role', 'position': 'pos'};
app.post('/api/update-profile', log_authorize, ui.upload.single('image'),function(req, res, next) {
  console.log(req.body);
  const data = JSON.parse(req.body.data);
  for (const [key, value] of Object.entries(data)) {
    if (!(key in convert)) {
      delete data[key];
    }
  }
  db.serialize(function() {
    if (Object.keys(data).length > 0) {
      const command = `update information set ${Object.keys(data).map(v => ` ${convert[v]} = ?`)} where id = ${req.session.key}`;
      db.run(command, Object.values(data), function(err) {
        if (err) {
          console.log(err);
        }
      });
    }

    if (req.file) {
      db.run(`update account set avatar = ? where id = ${req.session.key}`, [req.file.filename], err => {
        if (err) {
          console.log(err);
        }
      });
      req.session.avatar = req.file.filename;
    }
  });
  res.json({message: "Success"});
});

app.post('/api/change-pass', log_authorize, function(req, res) {
  const data = req.body;
  if (!data['current'] || !data['new'] || !data['check']) {
    return res.status(505).json({message: "Đầu vào bị lỗi"});
  }
  if (data['new'] !== data['check']) {
    return res.status(505).json({message: "Mật khẩu mới không khớp"});
  }
  if (data['new'] === data['current']) {
    return res.status(505).json({message: "Mật khẩu mới phải khác mật khẩu cũ"});
  }
  db.serialize(async function() {
    try {
      await new Promise((res, rej) => {
        db.all(`select password from account where id = ${req.session.key}`, (e, rows) => {
          if (e) {
            rej(e.message);
          }
          if (rows[0].password !== data['current']) {
            rej("Mật khẩu cũ không đúng");
          }
          res();
        });
      });
      await new Promise((res, rej) => {
        db.run(`update account set password = ? where id = ${req.session.key}`, [data['new']], (e) => {
          if (e) {
            reject(e.message);
          }
          res();
        });
      });
      res.json({message: "Success"});
    }
    catch (e) {
      res.status(505).json({message: e});
    }
  });
});

app.post('/api/change-c', log_authorize, uf.upload.array('file-document'),function(req, res) {
  const data = req.body;
  console.log("backend",data);
  // console.log(req.files);
  if (data.cdate && data.stime && data.etime && data.desc) {
    if (data.stime > data.etime) {
      deleteFile(req.files);
      return res.status(506).json({message: "Thời điểm bắt đầu và kết thúc không hợp lệ"});
    }
    if (data.mid) {
      db.serialize(async function() {
        try {
          await new Promise((res, rej) => {
            db.run("begin transaction", (e) => {
              if (e) {
                console.error("begin transaction", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          await new Promise((res, rej) => {
            db.run(`update calendar set date = ?, start = ?, end = ?, note = ? where mid = ?`, [data.cdate, data.stime, data.etime, data.desc, data.mid], (e) => {
              if (e) {
                rej("Lỗi database");
              }
              res();
            });
          });
          if (data.pl && data.pl.length > 0) {
            await new Promise((res, rej) => {
              db.run(`delete from filedata where id = ? and url in (${`?,`.repeat(data.pl.length).slice(0, -1)})`, [data.mid].concat(data.pl), (e) => {
                if (e) {
                  rej("Lỗi database");
                }
                res();
              });
            });
          }
          if (req.files.length > 0) {
            await new Promise((res, rej) => {
              db.run(`insert into filedata values ${`(${data.mid}, ?, ?),`.repeat(req.files.length).slice(0, -1)}`, req.files.flatMap(x => [x.originalname, x.filename]), (e) => {
                if (e) {
                  console.error(e.message);
                  rej("Lỗi database");
                }
                res();
              });
            });
          }
          await new Promise((res, rej) => {
            db.run("commit", (e) => {
              if (e) {
                console.error("commit", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          res.json({message: "Success"});
        } catch (e) {
          deleteFile(req.files);
          await new Promise((res, rej) => {
            db.run("rollback", (e) => {
              if (e) {
                console.error("rollback", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          res.status(506).json({message: e});
        }

      });
    } else {
      db.serialize(async function() {
        try {
          await new Promise((res, rej) => {
            db.run("begin transaction", (e) => {
              if (e) {
                console.error("begin transaction", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          await new Promise((res, rej) => {
            db.run(`insert into calendar(id, date, start, end, note) values (?, ?, ?, ?, ?)`, [req.session.key, data.cdate, data.stime, data.etime, data.desc], (err) => {
              if (err) {
                console.error(err.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          if (req.files.length > 0) {
            let idx;
            await new Promise((res, rej) => {
              db.all(`select mid from calendar where mid = last_insert_rowid()`, (e, rows) => {
                if (e || rows.length !== 1) {
                  console.error(e.message);
                  rej("Lỗi database 400");
                }
                idx = rows[0].Mid;
                res();
              });
            });
            console.log(idx);
            await new Promise((res, rej) => {
              db.run(`insert into filedata values ${`(${idx}, ?, ?),`.repeat(req.files.length).slice(0, -1)}`, req.files.flatMap(x => [x.originalname, x.filename]), (e) => {
                if (e) {
                  console.error(e.message);
                  rej("Lỗi database");
                }
                res();
              });
            });
          }
          await new Promise((res, rej) => {
            db.run("commit", (e) => {
              if (e) {
                console.error("commit", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          res.json({message: "Success"});
        } catch (e) {
          deleteFile(req.files);
          await new Promise((res, rej) => {
            db.run("rollback", (e) => {
              if (e) {
                console.error("rollback", e.message);
                rej("Lỗi database");
              }
              res();
            });
          });
          res.status(506).json({message: e});
        }
      });
    }
  }
  else {
    deleteFile(req.files);
    return res.status(506).json({message: "Thông tin không hợp lệ"});
  }
});

app.post('/api/search', async function(req, res) {
  const command = req.body.command;
  console.log(command);
  res.json(command);
}); 

var server = app.listen(5000, function() {
  const host = server.address().address;
  const port = server.address().port;
  console.log("Running at " + host + ":" + port);
})