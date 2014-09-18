:: delete all managed schemas
psql -h localhost -p 5432 -U postgres -d postgres -f "C:\arches-arches-6127ba016596\archesproject\db\Deployment Scripts\DatabaseCleanup.sql"

:: recreate the database
psql -h localhost -p 5432 -U postgres -d arches -f "C:\arches-arches-6127ba016596\archesproject\db\Deployment Scripts\Restore.sql"
