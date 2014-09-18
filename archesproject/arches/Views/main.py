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
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.conf import settings
from archesproject.arches.Utils.jsfiles import JsFiles

from django.contrib.auth.decorators import login_required

@login_required(login_url='/Arches/User/Login')
def index(request):
    #lang = request.GET.get('lang') if request.GET.get('lang') != '' and request.GET.get('lang') != None else settings.LANGUAGE_CODE
    debug = True if request.GET.get('debug') != '' and request.GET.get('debug') != None else False
    nodebug = True if request.GET.get('nodebug') != '' and request.GET.get('nodebug') != None else False 

    #print 'debug: %s' % debug
    #print 'nodebug: %s' %  nodebug
    if settings.DEBUG == False:
        return render_to_response('index.htm', {'scripts':['JsGzip/']},
            context_instance=RequestContext(request))
    else:
        if nodebug:
            return render_to_response('index.htm', {'scripts':['JsGzip/']},
                context_instance=RequestContext(request))
        else:
            return render_to_response('index.htm', {'scripts': (settings.STATIC_URL + file for file in JsFiles(debug=True))},
                context_instance=RequestContext(request))

@login_required(login_url='/Arches/User/Login')
def splash(request):
    #lang = request.GET.get('lang') if request.GET.get('lang') != '' and request.GET.get('lang') != None else settings.LANGUAGE_CODE
    if settings.DEBUG == False:
        return render_to_response('splash.htm', context_instance=RequestContext(request))
    else:
        return render_to_response('splash.htm', context_instance=RequestContext(request))

def JsGzip(request):
    zfile = file(os.path.join(settings.ROOT_DIR, 'Arches', 'Media', 'js','min','1231_11_Arches.min.js.gz'), 'rb')
    compressed_content = zfile.read()
    zfile.close()
    response = HttpResponse(compressed_content)
    response['Content-Encoding'] = 'gzip'
    response['Content-Length'] = str(len(compressed_content))
    return response
