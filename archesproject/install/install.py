import sys
import os
import subprocess
import shutil

env_name = 'ENV'

here = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(here)
virtualenv_dir = os.path.join(root_dir, 'virtualenv')
virtualenv_working_dir = os.path.join(virtualenv_dir, env_name)


# CHECK PYTHON VERSION
py_version = 'python%s.%s' % (sys.version_info[0], sys.version_info[1])
if sys.version_info < (2, 7) or sys.version_info >= (3, 0):
    print('ERROR: Arches requires Python 2.7.x')
    sys.exit(101)
else:
    pass

# CHECK POSTGRES VERSION
try:
    postgres_version = subprocess.check_output(["psql", "--version"])
except OSError:
    print('ERROR: Arches requires psql. Please install and then rerun this file again.')
    sys.exit(101)
if postgres_version.find("9.") == -1:
    print('ERROR: Arches requires Postgres 9.0 or greater')
    print('Version detected: %s\n' % (postgres_version))
    postgres_override = raw_input('Would like to continue anyway?\nPress Y for Yes or N for No:')
    if(postgres_override == 'Y' or postgres_override == 'y'):
        pass
    else:
        sys.exit(101)
else:
    pass

# INSTALL THE VIRTUAL ENV
os.system("python %s %s" % (os.path.join(virtualenv_dir, 'virtualenv.py'), virtualenv_working_dir))


# ACIVATE THE VIRTUAL ENV
if sys.platform == 'win32':
    activate_this = os.path.join(virtualenv_working_dir, 'Scripts', 'activate_this.py')
else:
    activate_this = os.path.join(virtualenv_working_dir, 'bin', 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))



# INSTALL DJANGO, RAWES, SPHINX AND OTHER DEPENDENCIES
tmpinstalldir = '%s/tmp' % (virtualenv_working_dir)
os.system("pip install -b %s setuptools --no-use-wheel --upgrade" % (tmpinstalldir))
os.system("pip install -b %s -r %s" % (tmpinstalldir, os.path.join(here, 'requirements.txt')))
shutil.rmtree(tmpinstalldir, True)

#INSTALLING CUSTOM DJANGO EDITS/PATCHES
if sys.platform == 'win32':
    shutil.copy2(os.path.join(here, 'base.py'), os.path.join(virtualenv_working_dir, 'Lib', 'site-packages', 'django', 'db', 'backends', 'postgresql_psycopg2'))
    shutil.copy2(os.path.join(here, 'inspectdb.py'), os.path.join(virtualenv_working_dir, 'Lib', 'site-packages', 'django', 'core', 'management', 'commands'))
else:
    shutil.copy2(os.path.join(here, 'base.py'), os.path.join(virtualenv_working_dir, 'lib', py_version, 'site-packages', 'django', 'db', 'backends', 'postgresql_psycopg2'))
    shutil.copy2(os.path.join(here, 'inspectdb.py'), os.path.join(virtualenv_working_dir, 'lib', py_version, 'site-packages', 'django', 'core', 'management', 'commands'))

# INSTALL PSYCOPG2
if sys.platform == 'win32':
    is_64bit_python = sys.maxsize > 2**32

    #print "Downloading Psycopg2 for python 2.7"
    if py_version == "python2.7":
        if os.path.exists('C:\Program Files (x86)') and is_64bit_python:
            os.system("easy_install http://www.stickpeople.com/projects/python/win-psycopg/psycopg2-2.4.5.win-amd64-py2.7-pg9.1.3-release.exe")
        else:
            os.system("easy_install http://www.stickpeople.com/projects/python/win-psycopg/psycopg2-2.4.5.win32-py2.7-pg9.1.3-release.exe")
else:
    # SYSTEM IS ASSUMED LINUX/OSX ETC...
    # Install psycopg2 through pip - Works fine if the correct header files are present
    # See http://goshawknest.wordpress.com/2011/02/16/how-to-install-psycopg2-under-virtualenv/
    os.system("pip install psycopg2")
    pass
