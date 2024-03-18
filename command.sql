create table calendar(
  date text not NULL,
  start text not NULL,
  end text not NULL,
  author text,
  note text
);

create table account (
  id text PRIMARY key, 
  username text not NULL,
  password text not NULL,
  authority text not NULL,
  avatar text DEFAULT 'default.png'
);

create table information (
  id text PRIMARY key,
  name text ,
  phone text,
  email text, 
  role text, 
  pos text
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