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

'''
This module provides an abstraction of controlled vocabularies.

By making this abstraction we enable Arches to work with both local vocabs and
external vocabs.

The basic idea is that we have vocab providers. Each provider is an instance of a
VocabularyProvider. The same class can thus be reused with different configurations
to handle different vocabs.

We also have a registry that collects all vocabularies. It's main purpose is to
give us a clear point during runtime for finding vocabs present. It also allows 
us to operate on all vocabs simultaneously.

Things to do or think about:
    * error handling: - what should a vocab provider return if a concept is unknown? 
                      - what should it return if something goes wrong with a query?
    * uniqueness: the vioe provider currently doens't guarantee a unique list. So a 
                  concept might be present twice because it matches both a preferred 
                  and a non preferred term. Should be easy to fix.
    * labels: currently the findConcepts and getAllConcepts methods do not return
              any label. It might be nice to include one. But that would mean that
              the query would also need to include a language to show the labels in.
              Is this something we would want to do here, or do we want to do that in
              the json service that services the frontend?
    * tree: if our UI needs to show a thesaurus tree, do we need a method here for
            building a quick tree? Currently this can be done by recursively calling
            getConceptById for a concept and it's narrower concepts.
    * caching: should this be done in the provider itself or in the layer that 
               talks to the providers? Eg. the json service that talks to the client
               layer could build the UI tree once, cache it and then serve that
               cache to the client. The same could be true for views that return
               all concepts or a query on concepts. Main problem would be figuring 
               out when a cached version is stale. That might be easier to 
               tackle on a per provider basis.
    * selective query: maybe allow the query to the registry to specify which vocabs 
                       should be searched. 
                       eg. {'label': 'en', 'vocabs': ['VIOE', 'FARALLON']}
    * collection: I haven't added skos:collections yet. Also know as guide terms 
                  or node labels. These are a bit of an edge case, but it's frequent 
                  enough to be needed. It's basically a concept that is used for 
                  organising the vocab structure, but can't be used for indexing 
                  or searching. Eg. <churches by form> is a collection of church 
                  concepts that is useful for organising the tree, but you can't 
                  say that something is a 'church by form'. Generally displayed 
                  between <> symbols.
'''

import abc

import urllib2
import urllib
import json

class VocabularyRegistry:
    '''A registery that collects all vocab providers.
    '''

    def __init__(self):
        self.providers = []

    def registerProvider(self, provider):
        self.providers.append(provider)

    def getProviders(self):
        '''Get all providers registered with the registery.
        '''
        return self.providers

    def findConcepts(self, query):
        '''Launch a query across all providers.

        Returns a list of dicts. Each dict has two keys: id and concepts.
        Id identifies the provider the concepts came from.
        '''
        return [{'id': p.getVocabularyId(), 'concepts': p.findConcepts(query)} for p in self.providers]

    def getAllConcepts(self):
        '''Get all concepts from all providers.

        Not sure if this is at all usefull, except maybe for testing.

        Returns a list of dicts. Each dict has two keys: id and concepts.
        Id identifies the provider the concepts came from.
        '''
        return [{'id': p.getVocabularyId(), 'concepts': p.getAllConcepts()} for p in self.providers]


class VocabularyProvider:
    '''An interface that all vocabulary providers must follow.
    '''

    __metaclass__ = abc.ABCMeta

    def __init__(self, metadata):
        self.metadata = metadata

    def getVocabularyId(self):
        '''Get an identifier for the vocabulary.

        Returns a string or number.
        '''
        return self.metadata.get('id')

    def getMetadata(self):
        '''Get some metadata on the provider or the vocab it represents.
        
        Returns a dict.
        '''
        return self.metadata

    @abc.abstractmethod
    def getConceptById(self, id):
        '''Get all information on a concept, based on id.

        Returns a dict that contains at least an id and one label.
        '''
        return {}

    @abc.abstractmethod
    def getAllConcepts(self):
        '''Returns all concepts in this provider.

        Returns a list of id's.
        '''
        return []

    @abc.abstractmethod
    def findConcepts(self,query):
        '''Find concepts that match a certain query.

        Currently query is expected to be a dict, so that complex queries can 
        be passed. Currently only searching on label (eg. {'label': 'tree'}) is
        expected.

        Returns a list of id's that match the query.
        '''
        return []

    def expandConcept(self,id):
        '''Expand a concept to the concept itself and all it's narrower concepts. 
        This method should recurse and also return narrower concepts of narrower concepts.

        Returns a list of all id's that are narrower concepts or the concept itself.
        '''
        return [id]


class FlatDictionaryProvider(VocabularyProvider):
    '''A simple vocab provider that use a python list of dicts.

    The provider expects a list with elements that are dicts that represent 
    the concepts. This provider assume there is no hierarchy (broader/narrower).
    '''

    def __init__(self, metadata, list):
        self.list = list
        self.metadata = metadata

    def getConceptById(self, id):
        for c in self.list:
            if c['id'] == id:
                return c

    def findConcepts(self, query):
        return [c['id'] for c in self.list if any([l['label'].find(query['label']) >= 0 for l in c['labels']])]

    def getAllConcepts(self):
        return [c['id'] for c in self.list]

class TreeDictionaryProvider(FlatDictionaryProvider):
    '''An extension of the FlatDictionaryProvider that can handle hierarchical data.

    This provider can check if a concept has narrower concepts and use that to
    expand a certain concept.
    '''

    def expandConcept(self,id):
        ret = [id]
        for c in self.list:
            if c['id'] == id:
                if 'narrower' in c:
                    for cid in c['narrower']:
                        ret = ret + self.expandConcept(cid)
                return ret

class VioeThesaurusProvider(VocabularyProvider):
    '''A provider that can work with the REST-services of https://inventaris.onroerenderfgoed.be/thesaurus

    This is a simple and somewhat naive implementation. It's main purpose is to
    demonstrate the use of vocab providers. It also show that a provider can be
    used to make the switch from a term based thesaurus (VIOE) to a concept based
    thesaurus (Arches).

    This code is experimental and foregoes a lot of error checking and error
    handling.
    '''

    def __init__(self, metadata, url):
        self.metadata = metadata
        self.url = url

    def getConceptById(self,id): 
        url = (self.url + '/%s.json') %  id
        y = urllib2.urlopen(url)
        result = json.loads(y.read())
        if result['term_type'] == 'ND':
            return self.getConceptById(result['use'])
        concept = {}
        concept['id'] = result['id']
        concept['labels'] = []
        concept['labels'].append({'type': 'pref', 'lang': result['language'], 'label': result['term']})
        concept['broader'] = [result['broader_term']]
        if 'narrower_terms' in result:
            concept['narrower'] = result['narrower_terms']
        if 'use_for' in result:
            for t in result['use_for']:
                term = self._getTermById(t)
                concept['labels'].append({'type': 'alt', 'lang': term['language'], 'label': term['term']})
        if 'related_terms' in result:
            concept['related'] = result['related_terms']
        y.close()
        return concept

    def _getTermById(self,id):
        '''Simple utility function to load a term.
        '''
        url = (self.url + '/%s.json') %  id
        y = urllib2.urlopen(url)
        result = json.loads(y.read())
        y.close()
        return result

    def findConcepts(self,query):
        args = {'term': query['label']}
        url = self.url + '/lijst.json?' + urllib.urlencode(args)
        y = urllib2.urlopen(url)
        result = json.loads(y.read())
        concepts = []
        for x in result['items']:
            '''If term is a non descriptor, return the preferred term.'''
            if x['type'] == 'ND':
                concepts.append({'id': x['use']})
            else:
                concepts.append({'id': x['id']})
        y.close()
        return concepts

    def getAllConcepts(self):
        y = urllib2.urlopen(self.url + '/lijst.json')
        result = json.loads(y.read())
        concepts = []
        for x in result['items']:
            if x['type'] == 'ND':
                '''If term is a non descriptor, return the preferred term.'''
                concepts.append({'id': x['use']})
            else:
                concepts.append({'id': x['id']})
        y.close()
        return concepts

    def expandConcept(self,id):
        url = (self.url + '/%s/subtree.json') %  id
        y = urllib2.urlopen(url)
        result = json.loads(y.read())
        y.close()
        return result

if __name__ == '__main__':
    p = FlatDictionaryProvider({'id': 'VIOE'},
            [{'id': 1, 'labels': [{'type': 'pref', 'lang': 'nl', 'label': 'Maarten Vermeyen'}]},
             {'id': 2, 'labels': [{'type': 'pref', 'lang': 'nl', 'label': 'Koen Van Daele'},
                                  {'type': 'pref', 'lang': 'en', 'label': 'Bunny Van Daele'},
                                  {'type': 'alt', 'lang': 'nl', 'label': 'Koen'}, 
                                  {'type': 'alt', 'lang': 'en', 'label': 'Keun'}], 
                       'related': [4]},
             {'id': 3, 'labels': [{'type': 'pref', 'lang': 'nl', 'label': 'Wouter'}]},
             {'id': 4, 'labels': [{'type': 'pref', 'lang': 'nl', 'label': 'Leen Meganck'}], 
                       'related': [2]}
             ])
    f = FlatDictionaryProvider({'id': 'FARALLON'},
            [{'id': 1, 'labels': [{'label': 'Dennis'}]},
             {'id': 2, 'labels': [{'label': 'Alexei'}]},
             {'id': 3, 'labels': [{'label': 'Adam'}]}])
    t = TreeDictionaryProvider({'id': 'Geography'},
                         [{'id': 1, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'World'}], 
                                    'narrower': [2,3]},
                          {'id': 2, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'Europe'}], 
                                    'narrower': [4,5], 'broader': [1]},
                          {'id': 3, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'North-America'}], 
                                    'narrower': [6], 'broader': [1]},
                          {'id': 4, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'Belgium'}], 
                                    'narrower': [7,8,9], 'broader': [2]},
                          {'id': 5, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'United Kingdom'}],
                                    'broader': [2]},
                          {'id': 6, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'United States of America'}],
                                    'broader': [3]},
                          {'id': 7, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'Flanders'}],
                                    'broader': [4]},
                          {'id': 8, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'Brussels'}],
                                    'broader': [4]},
                          {'id': 9, 'labels': [{'type': 'pref', 'lang': 'en', 'label': 'Wallonie'}],
                                    'broader': [4]}
                         ])
    vt = VioeThesaurusProvider({'id': 'VIOETYPOLOGY'}, 'http://inventaris.onroerenderfgoed.be/thesaurus/typologie')
    vs = VioeThesaurusProvider({'id': 'VIOESTYLES'}, 'http://inventaris.onroerenderfgoed.be/thesaurus/stijl')
    vd = VioeThesaurusProvider({'id': 'VIOEPERIODS'}, 'http://inventaris.onroerenderfgoed.be/thesaurus/datering')
    vm = VioeThesaurusProvider({'id': 'VIOEMATERIALS'}, 'http://inventaris.onroerenderfgoed.be/thesaurus/materiaal')
    vspc = VioeThesaurusProvider({'id': 'VIOESPECIES'}, 'http://inventaris.onroerenderfgoed.be/thesaurus/soort')
    vg = VioeThesaurusProvider({'id': 'VIOEVENTTYPES'}, 'http://inventaris.onroerenderfgoed.be/thesaurus/gebeurtenis')
    r = VocabularyRegistry()
    r.registerProvider(p)
    r.registerProvider(f)
    r.registerProvider(t)
    r.registerProvider(vt)
    r.registerProvider(vs)
    r.registerProvider(vd)
    r.registerProvider(vm)
    r.registerProvider(vspc)
    r.registerProvider(vg)
    print r.getProviders()
    print 'Concepts that have a label that contains "oen"'
    print r.findConcepts({'label': 'oen'})
    print 'VIOE 1'
    print p.getConceptById(1)
    print 'Find a concept with label Maarten in the VIOE thesaurus.'
    print p.findConcepts({'label': 'Maarten'})
    print 'All concepts in the FARALLON thesaurus'
    print f.getAllConcepts()
    print 'The world consists of: '
    print t.expandConcept(1)
    print 'Belgium consists of: '
    print t.expandConcept(4)
    print 'Dennis consists of: '
    print f.expandConcept(1)
    print 'All concepts in VIOETYPOLOGY with a label like kastelen'
    castles = vt.findConcepts({'label':'kastelen'})
    print castles
    print 'Landhuizen (country houses):'
    print vt.getConceptById(262)
    print 'Find all the children of bijgebouwen (auxiliary buildings)'
    print vt.expandConcept(63)
    print 'Mammoetboom (dutch) redirects to Sequoiadendron giganteum (latin)'
    print vspc.getConceptById(1596)
    print 'All concepts in VIOEPERIODS with a label like 20'
    periods = vd.findConcepts({'label':'20'})
    print periods
