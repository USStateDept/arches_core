SELECT pg_terminate_backend(procpid) from pg_stat_activity where datname='arches';
SELECT pg_terminate_backend(pid) from pg_stat_activity where datname='arches';

DROP DATABASE arches;

CREATE DATABASE arches
  WITH ENCODING='UTF8'
       OWNER=postgres
       TEMPLATE=template_postgis_20
       CONNECTION LIMIT=-1;

