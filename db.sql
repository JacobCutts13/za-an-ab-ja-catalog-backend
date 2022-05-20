CREATE table recommendations(
	id serial primary key,
  	user_id int,
  	author text,
  	date timestamp not null default NOW(),
  	url text not null,
  	title text not null,
  	description text,
  	tags text[] not null,
  	content_type text not null,
  	rating text not null,
  	reason text,
  	build_week int,
  	CONSTRAINT recommendation_fk
  	FOREIGN KEY (user_id) 
  references users(user_id) ON DELETE CASCADE
)


INSERT INTO recommendations 
(
  	author,
  	url,
  	title,
  	description,
  	tags,
  	content_type,
  	rating,
  	reason,
  	build_week
)
VALUES(
	'test authro',
  	'test url',
  	'test title',
  	'test desr',
  	Array ['test tag'],
  	'test content',
  'test rating',
  'test reason',
  2	
)

CREATE TABLE users (
	user_id serial primary key,
  	name text,
  	is_faculty boolean,
  	saved_recommendations int[]
)

create table comments(
	comment_id serial primary key, 
  	user_id int, 
    post_id int, 
  	comment text, 
    CONSTRAINT user_fk
  	FOREIGN KEY (user_id) 
    references users(user_id) ON DELETE CASCADE,
  	CONSTRAINT post_fk
  	FOREIGN KEY (post_id) 
    references recommendations(id) ON DELETE CASCADE
  
)

create table likes(
	like_id serial primary key,
  	user_id int,
    post_id int,
  	likes int default 0 not null,
    check(likes >= -1 and likes <= 1),
    CONSTRAINT user_fk
  	FOREIGN KEY (user_id)
    references users(user_id) ON DELETE CASCADE,
  	CONSTRAINT post_fk
  	FOREIGN KEY (post_id)
    references recommendations(id) ON DELETE CASCADE
)
