SELECT pg_terminate_backend(procpid) from pg_stat_activity where datname='arches_staging';
SELECT pg_terminate_backend(pid) from pg_stat_activity where datname='arches_staging';

DROP DATABASE arches_staging;

CREATE DATABASE arches_staging
  WITH ENCODING='UTF8'
       OWNER=postgres
       TEMPLATE=template_postgis_20
       CONNECTION LIMIT=-1;

