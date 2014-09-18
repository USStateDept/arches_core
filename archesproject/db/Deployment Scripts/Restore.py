import inspect
import posixpath
import os
import glob
from django.template import Template
from django.conf import settings
from django.template import Context
from archesproject.build.management.commands import utils

cwd = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
rootpath = cwd.replace(os.path.sep + os.path.join("db","Deployment Scripts"), "")

context = Context(settings.DATABASES['default'])
context['DB_CLEAN_FILE'] = os.path.join(cwd, "DatabaseCleanup.sql")
context['DB_RESTORE_FILE'] = os.path.join(cwd, "Restore.sql")

def source(file):
    return "\i \'" + file + "\'\n"

# Generate a sql file that sources all necessary sql files into one file
buffer = ''
buffer = buffer + "\n-- Run all the sql scripts in the Install folder\n"
for infile in glob.glob(posixpath.join(rootpath, 'db', 'Deployment Scripts', 'Install', '*.sql') ):
	buffer = buffer + source(infile.replace("\\", posixpath.sep))
	    
buffer = buffer + "\n-- Reload all managed schemas\n"
for infile in glob.glob( posixpath.join(rootpath, 'db', 'Schema', '*.sql') ):
    buffer = buffer + source(infile.replace("\\", posixpath.sep))

buffer = buffer + "\n-- Add all the data in the Data Folder\n"
for infile in glob.glob( posixpath.join(rootpath, 'db', 'Data', '*.sql') ):
    buffer = buffer + source(infile.replace("\\", posixpath.sep))
        
buffer = buffer + "\n-- Apply post deplyment scripts and mock data\n"
buffer = buffer + source(posixpath.join(rootpath, 'db','Deployment Scripts','LocalUpdates','PostDeployment.sql').replace("\\", posixpath.sep))
buffer = buffer + source(posixpath.join(rootpath, 'db','Deployment Scripts','LocalUpdates','MockData.sql').replace("\\", posixpath.sep))

buffer = buffer + "\n-- Spring cleaning\n"
buffer = buffer + "VACUUM ANALYZE;\n"

utils.WriteToFile(os.path.join(cwd, "Restore.sql"), buffer)

#Write a caller for windows
t = Template(
":: delete all managed schemas\n"
"psql -h {{ HOST }} -p {{ PORT }} -U {{ USER }} -d postgres -f \"{{ DB_CLEAN_FILE }}\"\n"
"\n"
":: recreate the database\n"
"psql -h {{ HOST }} -p {{ PORT }} -U {{ USER }} -d {{ NAME }} -f \"{{ DB_RESTORE_FILE }}\"\n"
)
utils.WriteToFile(os.path.join(cwd, "Restore.bat"), t.render(context));

#Write a caller for nix
t = Template(
"#!/bin/bash\n"
"# delete all managed schemas\n"
"psql -h {{ HOST }} -p {{ PORT }} -U {{ USER }} -d postgres -f \"{{ DB_CLEAN_FILE }}\"\n"
"\n"
"# recreate the database\n"
"psql -h {{ HOST }} -p {{ PORT }} -U {{ USER }} -d {{ NAME }} -f \"{{ DB_RESTORE_FILE }}\"\n"
)
utils.WriteToFile(os.path.join(cwd, "Restore.sh"), t.render(context));
