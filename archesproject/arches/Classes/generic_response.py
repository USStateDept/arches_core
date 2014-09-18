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

class GenericResponse(object):

    def __init__(self):
        self.success = False
        self.status_code = -1
        self.message = ''
        self.internalErrorMessage = ''
        self.returnObj = None

    #@property
    #def success(self):
    #    return self.success

    #@success.setter
    #def success(self, value):
    #    if (value == True):
    #        self.status_code = 0



