import os
import inspect
from django.template import Template
from django.conf import settings
from django.template import Context
from archesproject.build.management.commands import utils

context = Context(settings.DATABASES['default'])
context['POSTGIS_TEMPLATE'] = settings.POSTGIS_TEMPLATE

t = Template(
"SELECT pg_terminate_backend(procpid) from pg_stat_activity where datname='{{ NAME }}';\n"
"SELECT pg_terminate_backend(pid) from pg_stat_activity where datname='{{ NAME }}';\n"
"\n"

"DROP DATABASE {{ NAME }};\n"
"\n"

"CREATE DATABASE {{ NAME }}\n"
"  WITH ENCODING='UTF8'\n"
"       OWNER={{ USER }}\n"
"       TEMPLATE={{POSTGIS_TEMPLATE}}\n"
"       CONNECTION LIMIT=-1;\n"
"\n"
)

utils.WriteToFile(os.path.join(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe()))), "DatabaseCleanup.sql"), t.render(context));

