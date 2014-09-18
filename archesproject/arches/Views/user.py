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

from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.contrib.auth import authenticate, login, logout
from archesproject.arches.Utils.betterJSONSerializer import JSONSerializer
from archesproject.arches.Classes.generic_response import GenericResponse
from django.shortcuts import render_to_response
from django.template import RequestContext


@csrf_exempt
@never_cache
def Login(request):
    context = RequestContext(request)


    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)

        if request.POST['noajax']:
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return HttpResponseRedirect('/Arches/')

            return render_to_response('archlogin.html', {"error":"Invalid User Name or Password."}, context)

        else:
            GR = GenericResponse()
            GR.returnObj = user
            if user is not None:
                if user.is_active:
                    login(request, user)
                    GR.success = True
                    GR.status_code = 0
                else:
                    # Return a 'disabled account' error message
                    GR.message = 'account disabled'

                # don't send the password even if it is hashed
                user.password = ''
            else:
                # Return an 'invalid login' error message.
                GR.message = 'invalid login'

            return HttpResponse(JSONSerializer().serialize(GR))
    else:
        return render_to_response('archlogin.html', {}, context)


@never_cache
def Logout(request):
    GR = GenericResponse()
    logout(request)
    GR.status_code = 0
    GR.success = True
    GR.message = "Logout successful"

    return HttpResponse(JSONSerializer().serialize(GR))


@never_cache
def GetUser(request):
    GR = GenericResponse()

    if request.user.is_authenticated():
        GR.returnObj = request.user
        GR.status_code = 0
        GR.success = True
        GR.message = ""

    else:
        GR.status_code = 1
        GR.message = "User not authenticated"

    return HttpResponse(JSONSerializer().serialize(GR))
