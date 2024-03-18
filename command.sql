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