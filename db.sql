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
  	build_week int
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