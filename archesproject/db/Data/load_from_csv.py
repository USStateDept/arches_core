import os
import csv
import types
import sys
from time import time
from django.conf import settings
from django.db import connection
from archesproject.arches.Models.entity import Entity

class Row(object):
    def __init__(self, *args):
        if len(args) == 0:
            self.resource_id = ''
            self.resourcetype = ''
            self.attributename = ''
            self.attributevalue = ''
            self.group_id = ''
        elif isinstance(args[0], list):
            self.resource_id = args[0][0].strip()
            self.resourcetype = args[0][1].strip()
            self.attributename = args[0][2].strip()
            self.attributevalue = args[0][3].strip()
            self.group_id = args[0][4].strip()

    def __repr__(self):
        return ('"%s, %s, %s, %s"') % (self.resource_id, self. resourcetype, self. attributename, self.attributevalue)

class Group(object):
    def __init__(self, *args):
        if len(args) == 0:
            self.resource_id = ''
            self.group_id = ''
            self.rows = []
        elif isinstance(args[0], list):
            self.resource_id = args[0][0].strip()
            self.group_id = args[0][4].strip()
            self.rows = []   

class Resource(object):
    def __init__(self, *args):
        if len(args) == 0:
            self.resource_id = ''
            self.entitytypeid = ''
            self.groups = []
            self.nongroups = []
        elif isinstance(args[0], list):
            self.entitytypeid = args[0][1].strip()
            self.resource_id = args[0][0].strip()
            self.nongroups = []  
            self.groups = []
    def appendrow(self, row, group_id=None):
        if group_id != None:
            for group in self.groups:
                if group.group_id == group_id:
                    group.rows.append(row)
        else:
           self.nongroups.append(row) 

class DataLoader(object): 
    def load(self, filepath, truncate=True):
        start = time()
        resource_info = open(filepath, 'rb')
        fullrows = [line.split("|") for line in resource_info]
        
        ret = {'successfully_saved':0, 'successfully_indexed':0, 'failed_to_save':[], 'failed_to_index':[]}
        resource_id = ''
        group_id = ''

        if truncate:
            cursor = connection.cursor()
            cursor.execute("""
                TRUNCATE data.entities CASCADE;
            """ )

        lastchunk = 0
        for startchunk in range(1000,len(fullrows)+1,1000):
            print str(startchunk), "out of", str(len(fullrows))
            resourceList = []

            rows = fullrows[lastchunk:startchunk]

            for row in rows:
                if rows.index(row) != 0:
                    if (settings.LIMIT_ENTITY_TYPES_TO_LOAD == None or row[1].strip() in settings.LIMIT_ENTITY_TYPES_TO_LOAD):
                        if row[0].strip() != resource_id:
                            resourceList.append(Resource(row))
                            resource_id = row[0].strip()
                        
                        if row[4].strip() != '-1' and row[4].strip() != group_id:
                            resourceList[len(resourceList)-1].groups.append(Group(row))
                            group_id = row[4].strip()

                        if row[4].strip() == group_id:
                            resourceList[len(resourceList)-1].appendrow(Row(row), group_id=group_id)
                            #resourceList[len(resourceList)-1].groups[len(resourceList[len(resourceList)-1].groups)-1].rows.append(Row(row))

                        if row[4].strip() == '-1':
                            resourceList[len(resourceList)-1].appendrow(Row(row))
                            #resourceList[len(resourceList)-1].nongroups.append(Row(row))

            elapsed = (time() - start)
            print 'time to parse csv = %s' % (elapsed)
            ret = self.resourceListToEntities(resourceList, ret)
        return ret

    def resourceListToEntities(self, resourceList, ret):
        totalcount = len(resourceList)
        counter =0
        start = time()
        
        schema = None
        curententitytype = None
        for resource in resourceList:
            counter += 1
            print str(int((float(counter)/float(totalcount)*100)))
            masterGraph = None
            entityData = []
            if curententitytype != resource.entitytypeid:
                curententitytype = resource.entitytypeid
                schema = Entity.get_mapping_schema(resource.entitytypeid)

            for row in resource.nongroups:
                entity = Entity()
                entity.create_from_mapping(row.resourcetype, schema[row.attributename]['steps'], row.attributename, row.attributevalue)
                entityData.append(entity)

            if len(entityData) > 0:
                masterGraph = entityData[0]
                for mapping in entityData[1:]:
                    masterGraph.merge(mapping)

            for group in resource.groups:
                entityData2 = []
                for row in group.rows:
                    entity = Entity()
                    entity.create_from_mapping(row.resourcetype, schema[row.attributename]['steps'], row.attributename, row.attributevalue)
                    entityData2.append(entity)  

                mappingGraph = entityData2[0]
                for mapping in entityData2[1:]:
                    mappingGraph.merge(mapping)

                if masterGraph == None:
                    masterGraph = mappingGraph
                else:
                    nodetypetomergeat = schema[row.attributename]['mergenodeid']
                    masterGraph.merge_at(mappingGraph, nodetypetomergeat)
                    
            try:
                masterGraph.save(username=settings.ETL_USERNAME)
                ret['successfully_saved'] += 1
                print 'successfully_saved'
                try:
                    masterGraph.index()
                    ret['successfully_indexed'] += 1
                except Exception, e:
                    print "index Failed index!!!!!!!!!!!!!!!!!!!", e
                    ret['failed_to_index'].append(resource.resource_id)        
            except:
                print "Failed to save!!!!!!!!!!!!!!"
                ret['failed_to_save'].append(resource.resource_id)    
                sys.stdout.write('.')
            
        elapsed = (time() - start)
        print 'total time to etl = %s' % (elapsed)
        print 'average time per entity = %s' % (elapsed/len(resourceList))
        print ret
        #return masterGraph
        return ret


    def findmergenode(self, graph):
        """
        Logic to try and determine the proper node to merge multiple instances of the same types of data. Like address info.
        Currently unused.  

        """

        rank = None
        highestnodewithvalue = None
        entitieswithvalues = []
        def findentitieswithvalues(entity):
            if entity.value != '':
                entitieswithvalues.append(entity)
        graph.traverse(findentitieswithvalues)

        if len(entitieswithvalues) == 0:
            raise Exception("Entity graph has no values")
        for entity in entitieswithvalues:
            if rank == None:
                rank = entity.get_rank()
            if entity.get_rank() <= rank:
                rank = entity.get_rank()
                highestnodewithvalue = entity

        rank = None
        highestforkingnode = None
        entitiesthatfork = []
        def findentitiesthatfork(entity):
            if len(entity.relatedentities) > 1:
                entitiesthatfork.append(entity)
        graph.traverse(findentitiesthatfork)

        for entity in entitiesthatfork:
            if rank == None:
                rank = entity.get_rank()
            if entity.get_rank() <= rank:
                rank = entity.get_rank()
                highestforkingnode = entity


        # LOGIC SECTION
        if highestforkingnode == None or highestnodewithvalue.get_rank() >= highestforkingnode.get_rank():
            if highestnodewithvalue.get_parent().get_rank() == 0:
                return highestnodewithvalue.get_parent()
            else:
                return highestnodewithvalue.get_parent().get_parent()

        if highestnodewithvalue.get_rank() < highestforkingnode.get_rank():
            if highestforkingnode.get_rank() == 0:
                return highestforkingnode
            else:
                return highestforkingnode.get_parent()

        return None

        #     groupNode =



        # 1.) Identify highest node with value;
        # 2.) Identify node at which the group has a common parent;

        # 3.) Take the node that is closer to the root
        #     a.) if that is that is the node with a value: split two parents up or root
        #     b.) else: split one parent up

