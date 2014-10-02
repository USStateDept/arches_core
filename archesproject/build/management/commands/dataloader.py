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

"""This module will load data"""
from optparse import make_option
from django.core.management.base import BaseCommand, CommandError
from django.core import management
from django.conf import settings

import os
import inspect
import sys
#import settings as package_settings
import subprocess
from archesproject.build.management.commands import index, build
from archesproject.packages.cds.install import resource_graphs
from archesproject.packages.cds.install import forms_and_information_themes
from archesproject.packages.cds.install import concepts
from archesproject.packages.cds.install import authority_files
from archesproject.packages.cds.install import test_data
from archesproject.packages.cds.install import map_layers
from setuptools import setup
from archesproject.db import utils
from time import time
from django.db import connection

# setup(
#     name='cds',
#     version='0.1.0',
#     author='Farallon Geographics',
#     author_email='dev@fargeo.com',
#     packages=['etl', 'formsjson'],
#     data_files=[('etl', ['etl/*.*']),
#                   ('formsjson', ['blah/*.*'])],
#     package_data={'formsjson': ['formsjson/*.*']},
#     scripts=[],
#     url='http://localhost/test',
#     license='LICENSE.txt',
#     description='CDS package for Arches.',
#     long_description=open('README.txt').read(),
#     install_requires=[],
# )
class Command(BaseCommand):
    """A general command used in compiling all the required static data files and js file in Arches."""
    
    option_list = BaseCommand.option_list + (
        make_option('-f', '--file', action='store', dest='filepath', default=None,
            help='Specify the full path to a csv file'),
        make_option('-t', '--truncate', action='store', dest='truncate', default=False,
            help='remove the entities table'),
    )
    
    def handle(self, *args, **options):
        print options['filepath']
        print options['truncate']
        rootpath = settings.ROOT_DIR
        if not options['filepath']:
            print "filepath is required"
            sys.exit(1)
        self.chunkLoader(options['filepath'], options['truncate'])


    def chunkLoader(self,filepath, truncate = False):
        start = time()
        resource_info = open(filepath, 'rb')
        fullrows = [line.split("|") for line in resource_info]
        
        ret = {'successfully_saved':0, 'successfully_indexed':0, 'failed_to_save':[], 'failed_to_index':[]}

        if truncate:
            print "*************truncating data.entities************************"
            cursor = connection.cursor()
            cursor.execute("""
                TRUNCATE data.entities CASCADE;
            """ )

            print "removing index"
            index.Command().handle('index', delete='term', index='', load='')
            index.Command().handle('index', delete='entity', index='', load='')
            index.Command().handle('index', delete='maplayers', index='', load='')

        ret = test_data.DataLoader().load(fullrows, ret)

        

        # lastchunk = 0
        # for startchunk in range(1000,len(fullrows)+1,1000):
        #     tempdataloader = test_data.DataLoader()
        #     print str(int((float(startchunk)/float(totalcount)*100))), "%"
        #     rows = fullrows[lastchunk:startchunk]
        #     ret = test_data.DataLoader().load(rows, ret)
        #     del tempdataloader

        elapsed = (time() - start)
        print 'time to parse csv = %s' % (elapsed)
        print ret
        return






