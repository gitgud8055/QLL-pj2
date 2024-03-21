const express = require('express');
const url = require('url');
const path = require('path');
const multer = require('multer');
const parser = require('body-parser');
const ejs = require('ejs');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');

const app = express();
const db = new sqlite3.Database('data.db');

const { spawnSync, spawn} = require('child_process');
const { error, log } = require('console');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, `${__dirname}/source/image/`);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({storage: storage});

app.use(parser.urlencoded({extended: true}));
app.use(parser.json());
app.use(session({
  secret: 'Welcome to a new hentai episode',
  resave: false,
  saveUninitialized: true
}));

app.use('/source', express.static('source'));
app.use('/views', express.static('views'));

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
    db.all(`select c.class_id as cid, c.class_name as cn, c.course_id as course from (select class_id from learn where id = ? union select class_id from teach where id = ?) l join class c on l.class_id = c.class_id`, [req.session.key, req.session.key], (e, rows) => {
      if (e) {
        res.status(504).json({message: e.message});
      }
      res.render(`${__dirname}/views/class.ejs`, {root: __dirname, link: `/source/image/${req.session.avatar}`, title: 'Danh sách lớp học',
      data: rows});
    });
  } catch(e) {
    res.status(504).json({message: e.message});
  }
});

app.get('/class/:classid', log_authorize, function(req, res) {
  const id = req.params.classid;
  console.log(id);
  try {
    db.serialize(function() {
      db.all(`select * from class where class_id = ?`, [id], (e, rows) => {
        if (e || rows.length !== 1) {
          res.status(505).json({message: "Something went wrong"});
        }
      });
      var student;
      db.all(`select id, name, role, pos as position from information where id in (select id from learn where class_id = ?)`, [id], (e, rows) => {
        if (e) {
          res.status(505).json({message: "Something went wrong"});
        }
        student = rows;
      });
      db.all(`select id, name, role, pos as position from information where id in (select id from teach where class_id = ?)`, [id], (e, rows) => {
        if (e) {
          res.status(505).json({message: "Something went wrong"});
        }
        console.log(rows);
        res.render(`${__dirname}/views/class-info.ejs`, {root: __dirname, link: `/source/image/${req.session.avatar}`, title: `Lớp học`, 
        dataS: student, dataT: rows});
      });
    });
  } catch (e) {
    res.status(505).json({message: e.message});
  }
});

app.post('/api/book', function(req, res) {
  const data = req.body;
  try {
    db.serialize(() => {
      db.all(`select * from calendar where date like '%${data.year}-${data.month}-%'`, (err, rows) => {
        rows.forEach(function(v) {
          v.date = v.date.split('-')[2];
        });
        res.json(rows);
      });
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

const convert = {'name': 'name', 'phone_number': 'phone', 'email': 'email', 'role': 'role', 'position': 'pos'};
app.post('/api/update-profile', log_authorize, upload.single('image'),function(req, res, next) {
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
    return res.json({message: "Đầu vào bị lỗi"});
  }
  if (data['new'] !== data['check']) {
    return res.json({message: "Mật khẩu mới không khớp"});
  }
  if (data['new'] === data['current']) {
    return res.json({message: "Mật khẩu mới phải khác mật khẩu cũ"});
  }
  db.serialize(function() {
    db.all(`select password from account where id = ${req.session.key}`, (e, rows) => {
      if (e) {
        return res.json({message: e.message});
      }
      if (rows[0].password !== data['current']) {
        return res.json({message: "Mật khẩu cũ không đúng"});
      }
    });
    db.run(`update account set password = ? where id = ${req.session.key}`, [data['new']], (e) => {
      if (e) {
        return res.json({message: e.message});
      }
    });
    return res.json({message: "Thành công"});
  });
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