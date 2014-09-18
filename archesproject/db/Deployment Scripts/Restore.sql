
-- Run all the sql scripts in the Install folder
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/Install/batch_index.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/Install/django_authentication.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/Install/isstring.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/Install/PostDeployment.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/Install/postgis_backward_compatibility.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/Install/uuid-ossp.sql'

-- Reload all managed schemas
\i 'C:/inetpub/arches_staging/archesproject/db/Schema/db_ddl.sql'

-- Add all the data in the Data Folder
\i 'C:/inetpub/arches_staging/archesproject/db/Data/db_data.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Data/db_metadata.sql'

-- Apply post deplyment scripts and mock data
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/LocalUpdates/PostDeployment.sql'
\i 'C:/inetpub/arches_staging/archesproject/db/Deployment Scripts/LocalUpdates/MockData.sql'

-- Spring cleaning
VACUUM ANALYZE;
