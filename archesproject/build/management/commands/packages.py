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
from django.conf import settings
from django.utils.importlib import import_module
import os

class Command(BaseCommand):
    """A general command used in compiling all the required static data files and js file in Arches."""
    
    option_list = BaseCommand.option_list + (
        make_option('-o', '--operation', action='store', dest='operation', default='install',
            type='choice', choices=['install'],
            help='Operation Type; ' +
            '\'install\'=Installs all packages defined in settings.py'),
    )
    
    def handle(self, *args, **options):
        print 'operation: '+ options['operation']

        if options['operation'] == 'install':
            for package in settings.INSTALLED_PACKAGES:
                self.load_package(package)
                
    def load_package(self, package_name):
        module = import_module('archesproject.packages.%s.setup' % package_name)
        install = getattr(module, 'install')
        install(settings.ROOT_DIR)
