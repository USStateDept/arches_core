'''
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
'''

import os
import version
import inspect
from django.utils.importlib import import_module
# Django settings for Arches project.

ARCHES_VERSION = version.__VERSION__
DEBUG = True
TEMPLATE_DEBUG = DEBUG
ENV = 'dev' # 'dev', 'prod', 'test'

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'arches',                      # Or path to database file if using sqlite3.
        'USER': 'postgres',                      # Not used with sqlite3.
        'PASSWORD': 'password',                  # Not used with sqlite3.
        'HOST': 'localhost',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '5432',                      # Set to empty string for default. Not used with sqlite3.
	    'SCHEMAS': 'public,data,app_metadata,ontology,concepts', # syncdb will put the admin tables in the first listed schema
    }
}

POSTGIS_TEMPLATE = 'template_postgis_20'

POSTGIS_VERSION = (2, 0, 0)

ROOT_DIR = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Chicago'
USE_TZ = False

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/Arches/Media/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "http://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = '/Arches/Media/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(ROOT_DIR, 'arches', 'Media'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'c7ky-mc6vdnv+avp0r@(a)8y^51ex=25nogq@+q5$fnc*mxwdi'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    'archesproject.arches',
    'archesproject.arches.Models',
    'archesproject.build',
    #'lockdown',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    #'lockdown.middleware.LockdownMiddleware',
)

LOCKDOWN_PASSWORDS = ('ecatest', 'admin', 'tester')

ROOT_URLCONF = 'archesproject.urls'

WSGI_APPLICATION = 'wsgi.application'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(ROOT_DIR, 'arches/Templates'),

    # Adding a reference to error page templates because of issues we were seeing in amazon aws instances
    # http://stackoverflow.com/questions/13284443/django-template-error-500-html-on-amazon-ec2?rq=1
    os.path.join(ROOT_DIR, 'virtualenv/ENV/Lib/site-packages/django/contrib/admin/templates/admin'),
)

ETL_USERNAME = 'ETL' # override this setting in your packages settings.py file

INSTALLED_PACKAGES = (
    # entries here should correspond to folders within the packages directory
	'cds',
)

ENTITY_MODEL = {
    # override this setting in your packages settings.py file
    # to set the default model for the system to use
    # Your model needs to inherit from 'arches.Models.entity.Entity' to work
    'default': 'archesproject.arches.Models.entity.Entity'
}

PRIMARY_DISPLAY_NAME_LOOKUPS = {
    # override this setting in your packages settings.py file
    'entity_type': '',
    'lookup_value': ''
}

SEARCH_CONNECTION = {
    # override this setting in your packages settings.py file
    'default': {
        'backend': 'archesproject.arches.Search.search.SearchEngine',
        'url': 'localhost:9200',
        'timeout': 30,
        'connection_type': 'http'
    }
}

SEARCHABLE_ENTITY_TYPES = (
    # override this setting in your packages settings.py file
    # entity types that are used to index terms for simple search
)

ADV_SEARCHABLE_ENTITY_TYPES = (
    # override this setting in your packages settings.py file
    # entity types to index for advanced search
)

DISPLAY_NAME_FOR_UNNAMED_ENTITIES = 'Unnamed Resource' # override this setting in your packages settings.py file

# override this setting in your packages settings.py file
# entity type that holds the spatial coordinates of resources
ENTITY_TYPE_FOR_MAP_DISPLAY = ''

LIMIT_ENTITY_TYPES_TO_LOAD = None #(
    # override this setting in your packages settings.py file
#    'ARCHAEOLOGICAL HERITAGE (ARTIFACT).E18',
#)

DATA_CONCEPT_SCHEME = ''

try:
    from settings_local import *
except ImportError:
    pass

for package_name in INSTALLED_PACKAGES:
    settingsfile = os.path.join(ROOT_DIR, 'packages', package_name, 'settings.py')
    if os.path.exists(settingsfile):
        mod = import_module("archesproject.packages.%s.settings" % package_name)
        package_settings = mod.get_settings(globals())
        for member_name in package_settings: 
            globals()[member_name] = package_settings[member_name]
