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
from django.views.decorators.csrf import csrf_exempt
import archesproject.arches.Models.models as archesmodels
from archesproject.arches.Search.search_engine_factory import SearchEngineFactory
from archesproject.arches.Utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from django.contrib.auth.decorators import login_required

@csrf_exempt
@login_required(login_url='/Arches/User/Login')
def Concept(request, ids):
    full_graph = request.GET.get('full_graph', 'true') == 'true'
    exclude_subconcepts = request.GET.get('exclude_subconcepts', 'false') == 'true'
    exclude_parentconcepts = request.GET.get('exclude_parentconcepts', 'false') == 'true'
    exclude_notes = request.GET.get('exclude_notes', 'false') == 'true'
    exclude_labels = request.GET.get('exclude_labels', 'false') == 'true'
    exclude_metadata = request.GET.get('exclude_metadata', 'false') == 'true'
    emulate_elastic_search = request.GET.get('emulate_elastic_search', 'true') == 'true'
    fromdb = request.GET.get('fromdb', 'false') == 'true'

    ret = []
    if request.method == 'GET':
        if fromdb:
            for id in ids.split(','):
                if ".E" in id:
                    entitytype = archesmodels.EntityTypes.objects.get(pk = id)
                    concept = entitytype.conceptid
                else:
                    concept = archesmodels.Concepts.objects.get(conceptid = id)

                concept_graph = concept.toObject(full_graph=full_graph, exclude_subconcepts=exclude_subconcepts, 
                    exclude_parentconcepts=exclude_parentconcepts, exclude_notes=exclude_notes, 
                    exclude_labels=exclude_labels, exclude_metadata=exclude_metadata)

                if emulate_elastic_search:
                    ret.append({'_type': id, '_source': concept_graph})
                else:
                    ret.append(concept_graph)       

            if emulate_elastic_search:
                ret = {'hits':{'hits':ret}}    

        else:
            se = SearchEngineFactory().create()
            ret = se.search('', index='concept', type=ids, search_field='value', use_wildcard=True)

    return HttpResponse(JSONSerializer().serialize(ret, ensure_ascii=True, indent=4))
