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

"""This module contains commands for building Arches."""
from optparse import make_option
from django.core.management.base import BaseCommand, CommandError
from django.core import management
from django.conf import settings
import os
import glob
import gzip
import utils
from jsmin import jsmin
from archesproject.arches.Utils.jsfiles import JsFiles
from StringIO import StringIO
from os.path import join
from django.contrib.staticfiles import finders
import staticfiles

class Command(BaseCommand):
    """A general command used in compiling all the required static data files and js file in Arches."""
    
    option_list = BaseCommand.option_list + (
        make_option('-o', '--operation', action='store', dest='operation', default='build',
            type='choice', choices=['build', 'install'],
            help='Operation Type; build=Compiles the files in just the P4 folder and compile all the js files, ' + 
            '\'install\'=Compiles all python files in just the Deployment Scripts folder, '),
    )
    
    def handle(self, *args, **options):
        print 'operation: '+ options['operation']
        rootpath = settings.ROOT_DIR
        if options['operation'] == 'install':
            utils.arches_version()
            self.compilePythonFilesByPath([os.path.join('archesproject', 'db','Deployment Scripts')], settings.ROOT_DIR.replace('archesproject', ''))
        if options['operation'] == 'build':
            utils.arches_version()
            staticfiles.generate_files(rootpath)
            self.compileJsFiles(rootpath)
            if settings.STATIC_ROOT != '':
                management.call_command('collectstatic', interactive=False)

    def compilePythonFilesByPath(self, paths, rootpath):
        for path in paths:
            dir = os.path.join(rootpath,path)    
            os.chdir(dir)
            for infile in glob.glob( os.path.join(rootpath, path, '*.py') ):
                print "current file is: " + infile
                p, f = os.path.split(infile)
                themod = __import__(os.path.normpath(os.path.join(path,f)).replace(os.path.sep, ".").replace(".py", ""))

    def compileJsFiles(self, rootpath):
        print "**Begin JS minification**"
        minDir = os.path.join(rootpath, 'arches', 'Media', 'js', 'min')

        print "minDir: " + minDir
        mf = os.path.join(minDir, '1231_11_Arches.min.js')
        utils.ensure_dir(mf)
        minfile = open(mf,'w')

        print "Minifying...."
        buildfiles = JsFiles(debug=False)
        mediapath = os.path.join(rootpath,'arches','Media')        
        mindata = self.getDataFromFiles(buildfiles, mediapath)
        mintext = jsmin(mindata.getvalue())

        print "Minification complete. Writing .js file"
        minfile.write(mintext)
        minfile.close()

        print "Writing .gzip file"
        gzipfile = gzip.open(os.path.join(minDir, '1231_11_Arches.min.js.gz'), 'wb')
        gzipfile.writelines(mintext)
        gzipfile.close()
        
        print "**End JS minification**"

    def getDataFromFiles(self, inputfiles, path):
        """Reads the inputfiles in the specified path and adds them together."""
        data = StringIO()
        for inputfile in inputfiles:
            try:
                result = finders.find(inputfile, all=True)
                f = file(result[0])
            except IOError:
                raise CommandError("Error reading %s" % inputfile)
            print "now reading: " + result[0]
            data.write(f.read())
            data.write('\n')
        return data
