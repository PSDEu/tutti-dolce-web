-- Esquema inicial de Tutti Dolce (PostgreSQL).
-- Los diseños y fichas se guardan en JSONB: el catálogo puede cambiar sin migraciones.

create sequence pedido_numero_seq start 1;

create table pedido (
    id                uuid primary key,
    codigo            varchar(20)   not null unique,
    estado            varchar(20)   not null,
    fecha_entrega     date          not null,
    entrega           varchar(12)   not null,
    direccion         varchar(300),
    nombre            varchar(120)  not null,
    email             varchar(200)  not null,
    telefono          varchar(40)   not null,
    notas             varchar(1000),
    precio_estimado   numeric(8, 2) not null,
    precio_confirmado numeric(8, 2),
    diseno            jsonb         not null,
    ficha             jsonb         not null,
    imagen            text,
    permite_publicar  boolean       not null default false,
    token_seguimiento varchar(64)   not null unique,
    creado            timestamptz   not null,
    actualizado       timestamptz   not null
);
create index pedido_estado_idx on pedido (estado, fecha_entrega);

create table cambio_estado (
    id        bigserial primary key,
    pedido_id uuid        not null references pedido (id) on delete cascade,
    estado    varchar(20) not null,
    nota      varchar(500),
    fecha     timestamptz not null
);
create index cambio_estado_pedido_idx on cambio_estado (pedido_id, fecha);

-- Diseños que el cliente permitió compartir. Solo salen en la galería si la pastelería los aprueba.
create table diseno_compartido (
    id        uuid primary key,
    codigo    varchar(20)  not null unique,
    pedido_id uuid references pedido (id) on delete set null,
    nombre    varchar(120) not null,
    diseno    jsonb        not null,
    imagen    text,
    aprobado  boolean      not null default false,
    creado    timestamptz  not null
);

create table miembro (
    id                      uuid primary key,
    email                   varchar(200) not null unique,
    nombre                  varchar(120) not null,
    cumple_dia              smallint check (cumple_dia between 1 and 31),
    cumple_mes              smallint check (cumple_mes between 1 and 12),
    estado                  varchar(12)  not null,
    acepta_newsletter       boolean      not null default false,
    consentimiento_fecha    timestamptz,
    privacidad_fecha        timestamptz  not null,
    token_confirmacion      varchar(64) unique,
    token_confirmacion_caduca timestamptz,
    token_baja              varchar(64)  not null unique,
    confirmado              timestamptz,
    ultimo_regalo_anio      integer,
    creado                  timestamptz  not null
);
create index miembro_cumple_idx on miembro (cumple_mes, cumple_dia) where estado = 'CONFIRMADO';

-- Textos para redes escritos por IA con la voz de la dueña. Nada se publica sin aprobación.
create table borrador (
    id            uuid primary key,
    diseno_codigo varchar(20)   not null,
    red           varchar(30)   not null,
    texto         varchar(4000) not null,
    estado        varchar(12)   not null,
    imagen        text,
    creado        timestamptz   not null,
    decidido      timestamptz
);
