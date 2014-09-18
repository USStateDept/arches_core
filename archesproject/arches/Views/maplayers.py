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

from django.http import HttpResponse
from archesproject.arches.Utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from archesproject.arches.Search.search_engine_factory import SearchEngineFactory
from django.contrib.auth.decorators import login_required

@login_required(login_url='/Arches/User/Login')
def MapLayers(request, entitytypeid):
	data = []
	bbox = request.GET['bbox']
	limit = request.GET.get('limit', 10000)
	try:
		se = SearchEngineFactory().create()
		data = se.search('', index="maplayers", type=entitytypeid, end_offset=limit)
	except:
		pass

	return HttpResponse(JSONSerializer().serialize(data, ensure_ascii=True, indent=4))
