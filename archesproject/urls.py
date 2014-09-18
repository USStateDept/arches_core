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
from django.conf.urls import patterns, include, url
from django.conf import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.utils import importlib

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',)

for package_name in settings.INSTALLED_PACKAGES:
    urlsfile = os.path.join(settings.ROOT_DIR, 'packages', package_name, 'urls.py')
    if os.path.exists(urlsfile):
        package_urls = importlib.import_module("archesproject.packages.%s.urls" % package_name)
        package_patterns = package_urls.get_urlpatterns()
        urlpatterns += package_patterns

urlpatterns += patterns('',
    url(r'^Arches/$', 'archesproject.arches.Views.main.index'),
    url(r'^Arches/index.htm', 'archesproject.arches.Views.main.index'),
    url(r'^Arches/JsGzip', 'archesproject.arches.Views.main.JsGzip'),
    
    url(r'^Arches/Entities/(?P<entityid>.*)$', 'archesproject.arches.Views.entity.Entities'),
    url(r'^Arches/Entities/(?P<entityid>.*)/(?P<labeled>.*)/$', 'archesproject.arches.Views.entity.Entities'),
    url(r'^Arches/EntityTypes/(?P<entitytypeid>.*)$', 'archesproject.arches.Views.entity.EntityTypes'),
    url(r'^Arches/Concepts/(?P<ids>.*)$', 'archesproject.arches.Views.concept.Concept'),
    url(r'^Arches/MapLayers/(?P<entitytypeid>.*)$', 'archesproject.arches.Views.maplayers.MapLayers'),
    url(r'^Arches/Search', 'archesproject.arches.Views.search.Search'),
    url(r'^Arches/TermSearch', 'archesproject.arches.Views.search.search_terms'),

    url(r'^Arches/User/Login', 'archesproject.arches.Views.user.Login'),
    url(r'^Arches/User/Logout', 'archesproject.arches.Views.user.Logout'),
    url(r'^Arches/User/GetUser', 'archesproject.arches.Views.user.GetUser'),

    
    # url(r'^Arches/', include('Arches.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
