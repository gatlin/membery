create table if not exists members (
    id bigserial primary key,
    first_name text not null,
    last_name text not null,
    active boolean not null default false,
    notes text,
    email text,
    created timestamp without time zone default now(),
    updated timestamp without time zone default now()
);

create table if not exists committees (
    id bigserial primary key,
    name text unique not null
);

create table if not exists meetings (
    id bigserial primary key,
    committee bigint not null references committees(id),
    name text not null,
    start_time timestamp without time zone not null,
    end_time timestamp without time zone not null
);

create table if not exists attendance (
    id bigserial primary key,
    meeting bigint not null references meetings(id),
    member bigint not null references members(id)
);

create table if not exists interest_topics (
    id bigserial primary key,
    name text not null
);

create table if not exists interests (
    id bigserial primary key,
    member bigint not null references members(id),
    topic bigint not null references interest_topics(id)
);

create table if not exists permissions (
    name text unique primary key
);

create table if not exists roles (
    id bigserial primary key, name text unique not null, description text
);

create table if not exists roles_perms (
    role bigint not null references roles(id),
    permission text not null references permissions(name)
);

create table if not exists members_roles (
    member bigint references members(id),
    role bigint references roles(id)
);
