:: delete all managed schemas
psql -h localhost -p 5433 -U postgres -d postgres -f "C:\inetpub\arches_staging\archesproject\db\Deployment Scripts\DatabaseCleanup.sql"

:: recreate the database
psql -h localhost -p 5433 -U postgres -d arches_staging -f "C:\inetpub\arches_staging\archesproject\db\Deployment Scripts\Restore.sql"
