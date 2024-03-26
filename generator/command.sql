create table calendar(
  Mid integer primary key autoincrement,
  id text not NULL,
  date text not NULL,
  start text not NULL,
  end text not NULL,
  note text
);
create index calendar_id on calendar(id);
create index calendar_date on calendar(date);

create table account (
  id text PRIMARY key, 
  username text not NULL,
  password text not NULL,
  authority text not NULL,
  avatar text DEFAULT 'default.png'
);

create table information (
  id text PRIMARY key,
  name text default '',
  phone text default '',
  email text default '', 
  role text default '', 
  pos text default ''
);

create table class (
  class_id text PRIMARY key, 
  class_name text,
  course_id text
);

create table learn (
  id text not NULL,
  class_id text not NULL,
  gr_number text
);

create table teach (
  id text not NULL,
  class_id text not NULL
);

create table fileData (
  id text,
  PathName text,
  url text
);

create index filedata_url on fileData(url)