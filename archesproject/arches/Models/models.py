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

# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.

from django.conf import settings
from django.contrib.gis.db import models
import uuid

class AppConfig(models.Model):
    name = models.TextField(primary_key=True)
    defaultvalue = models.TextField()
    datatype = models.TextField()
    notes = models.TextField()
    isprivate = models.BooleanField()
    class Meta:
        db_table = u'app_config'
    
    def __unicode__(self):
        return self.name

class AuthGroup(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(unique=True, max_length=80)
    class Meta:
        db_table = u'auth_group'

class AuthUser(models.Model):
    id = models.IntegerField(primary_key=True)
    username = models.CharField(unique=True, max_length=30)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.CharField(max_length=75)
    password = models.CharField(max_length=128)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    is_superuser = models.BooleanField()
    last_login = models.DateTimeField()
    date_joined = models.DateTimeField()
    class Meta:
        db_table = u'auth_user'

class Classes(models.Model):
    classid = models.TextField(primary_key=True)
    classname = models.TextField()
    isactive = models.BooleanField()
    defaultbusinesstable = models.TextField()
    class Meta:
        db_table = u'classes'

    def __unicode__(self):
        return self.classname

class Conceptschemes(models.Model):
    conceptschemeid = models.TextField(primary_key=True) # This field type is a guess.
    name = models.TextField()
    class Meta:
        db_table = u'conceptschemes'

class DLanguages(models.Model):
    languageid = models.TextField(primary_key=True)
    languagename = models.TextField()
    isdefault = models.BooleanField()
    class Meta:
        db_table = u'd_languages'

class DRelationtypes(models.Model):
    relationtype = models.TextField(primary_key=True)
    class Meta:
        db_table = u'd_relationtypes'

class DjangoAdminLog(models.Model):
    id = models.IntegerField(primary_key=True)
    action_time = models.DateTimeField()
    user_id = models.IntegerField()
    content_type_id = models.IntegerField()
    object_id = models.TextField()
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    class Meta:
        db_table = u'django_admin_log'

class DjangoContentType(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    class Meta:
        db_table = u'django_content_type'

class DjangoSession(models.Model):
    session_key = models.CharField(max_length=40, primary_key=True)
    session_data = models.TextField()
    expire_date = models.DateTimeField()
    class Meta:
        db_table = u'django_session'

class DjangoSite(models.Model):
    id = models.IntegerField(primary_key=True)
    domain = models.CharField(max_length=100)
    name = models.CharField(max_length=50)
    class Meta:
        db_table = u'django_site'

class Forms(models.Model):
    formid = models.IntegerField(primary_key=True)
    name_i18n_key = models.TextField()
    widgetname = models.TextField()
    class Meta:
        db_table = u'forms'

class GeographyColumns(models.Model):
    f_table_catalog = models.TextField() # This field type is a guess.
    f_table_schema = models.TextField() # This field type is a guess.
    f_table_name = models.TextField() # This field type is a guess.
    f_geography_column = models.TextField() # This field type is a guess.
    coord_dimension = models.IntegerField()
    srid = models.IntegerField()
    type = models.TextField()
    class Meta:
        db_table = u'geography_columns'

class GeometryColumns(models.Model):
    f_table_catalog = models.CharField(max_length=256)
    f_table_schema = models.CharField(max_length=256)
    f_table_name = models.CharField(max_length=256)
    f_geometry_column = models.CharField(max_length=256)
    coord_dimension = models.IntegerField()
    srid = models.IntegerField()
    type = models.CharField(max_length=30)
    class Meta:
        db_table = u'geometry_columns'

class I18N(models.Model):
    key = models.TextField()
    value = models.TextField()
    languageid = models.TextField()
    widgetname = models.TextField(blank=True)
    class Meta:
        db_table = u'i18n'

    def __unicode__(self):
        return self.widgetname + '-' + self.key + ': ' + self.value

class Maplayers(models.Model):
    id = models.IntegerField(primary_key=True)
    active = models.BooleanField()
    on_map = models.BooleanField()
    selectable = models.BooleanField()
    basemap = models.BooleanField()
    name_i18n_key = models.TextField()
    icon = models.TextField(blank=True)
    symbology = models.TextField(blank=True)
    description_i18n_key = models.TextField(blank=True)
    layergroup_i18n_key = models.TextField()
    layer = models.TextField()
    sortorder = models.IntegerField(blank=True)
    class Meta:
        db_table = u'maplayers'

    def __unicode__(self):
        return ('%s') % (self.name_i18n_key)

class RasterColumns(models.Model):
    r_table_catalog = models.TextField() # This field type is a guess.
    r_table_schema = models.TextField() # This field type is a guess.
    r_table_name = models.TextField() # This field type is a guess.
    r_raster_column = models.TextField() # This field type is a guess.
    srid = models.IntegerField()
    scale_x = models.FloatField()
    scale_y = models.FloatField()
    blocksize_x = models.IntegerField()
    blocksize_y = models.IntegerField()
    same_alignment = models.BooleanField()
    regular_blocking = models.BooleanField()
    num_bands = models.IntegerField()
    pixel_types = models.TextField() # This field type is a guess.
    nodata_values = models.TextField() # This field type is a guess.
    out_db = models.TextField() # This field type is a guess.
    extent = models.GeometryField(srid=0)
    objects = models.GeoManager()
    class Meta:
        db_table = u'raster_columns'

class RasterOverviews(models.Model):
    o_table_catalog = models.TextField() # This field type is a guess.
    o_table_schema = models.TextField() # This field type is a guess.
    o_table_name = models.TextField() # This field type is a guess.
    o_raster_column = models.TextField() # This field type is a guess.
    r_table_catalog = models.TextField() # This field type is a guess.
    r_table_schema = models.TextField() # This field type is a guess.
    r_table_name = models.TextField() # This field type is a guess.
    r_raster_column = models.TextField() # This field type is a guess.
    overview_factor = models.IntegerField()
    class Meta:
        db_table = u'raster_overviews'

class Reports(models.Model):
    reportid = models.IntegerField(primary_key=True)
    name_i18n_key = models.TextField()
    widgetname = models.TextField()
    class Meta:
        db_table = u'reports'

class ResourceGroups(models.Model):
    groupid = models.IntegerField(primary_key=True)
    name_i18n_key = models.TextField()
    displayclass = models.TextField()
    class Meta:
        db_table = u'resource_groups'

class SpatialRefSys(models.Model):
    srid = models.IntegerField(primary_key=True)
    auth_name = models.CharField(max_length=256)
    auth_srid = models.IntegerField()
    srtext = models.CharField(max_length=2048)
    proj4text = models.CharField(max_length=2048)
    class Meta:
        db_table = u'spatial_ref_sys'

class VwConcepts(models.Model):
    conceptid = models.TextField() # This field type is a guess.
    conceptlabel = models.TextField()
    legacyoid = models.TextField()
    conceptschemename = models.TextField()
    class Meta:
        db_table = u'vw_concepts'

class VwEdges(models.Model):
    source = models.TextField() # This field type is a guess.
    label = models.TextField()
    target = models.TextField() # This field type is a guess.
    class Meta:
        db_table = u'vw_edges'

class VwEntityTypes(models.Model):
    entitytypeid = models.TextField()
    entitytypename = models.TextField()
    description = models.TextField()
    languageid = models.TextField()
    reportwidget = models.TextField()
    icon = models.TextField()
    isresource = models.BooleanField()
    conceptid = models.TextField() # This field type is a guess.
    class Meta:
        db_table = u'vw_entity_types'

class VwNodes(models.Model):
    label = models.TextField()
    id = models.TextField(primary_key=True) # This field type is a guess.
    val = models.TextField()
    class Meta:
        db_table = u'vw_nodes'

class AuthMessage(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey('AuthUser')
    message = models.TextField()
    class Meta:
        db_table = u'auth_message'

class AuthPermission(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    content_type = models.ForeignKey('DjangoContentType')
    codename = models.CharField(max_length=100)
    class Meta:
        db_table = u'auth_permission'

class Concepts(models.Model):
    conceptid = models.TextField(primary_key=True) # This field type is a guess.
    conceptschemeid = models.ForeignKey('Conceptschemes', db_column='conceptschemeid')
    legacyoid = models.TextField()
    class Meta:
        db_table = u'concepts'

    def __unicode__(self):
        label = Values.objects.get(conceptid = self.conceptid, valuetype = 'prefLabel')
        return ('%s - %s') % (label.value, self.conceptid)

    class _concept(object):
        def __init__(self):
            self.id = ''
            self.relationshiptype = ''
            self.labels = []
            self.notes = []
            self.metadata = []
            self.subconcepts = []
            self.parentconcepts = []

    def toObject(self, full_graph=True, exclude_subconcepts=False, exclude_parentconcepts=False, 
            exclude_notes=False, exclude_labels=False, exclude_metadata=False):
        ret = self._concept()
        ret.id = self.conceptid

        if not (exclude_labels and exclude_notes and exclude_metadata):
            values = Values.objects.filter(conceptid = self.conceptid)
            for value in values:
                if not exclude_labels and value.valuetype.category == 'label':
                    ret.labels.append(value.toObject())
                if not exclude_notes and value.valuetype.category == 'note':
                    ret.notes.append(note.toObject())
                if not exclude_metadata and value.valuetype.category != 'note' and value.valuetype.category != 'label':
                    ret.metadata.append(value.toObject())

        if not exclude_subconcepts:
            conceptrealations = ConceptRelations.objects.filter(conceptidfrom = self.conceptid)
            for relation in conceptrealations:
                ret.relationshiptype = relation.relationtype
                if full_graph:
                    ret.subconcepts.append(relation.conceptidto.toObject(full_graph=full_graph, exclude_subconcepts=exclude_subconcepts, 
                        exclude_parentconcepts=exclude_parentconcepts, exclude_notes=exclude_notes, exclude_labels=exclude_labels, 
                        exclude_metadata=exclude_metadata))
                else:
                    ret.subconcepts.append(relation.conceptidto_id)

        if not exclude_parentconcepts:
            conceptrealations = ConceptRelations.objects.filter(conceptidto = self.conceptid)
            for relation in conceptrealations:
                ret.parentconcepts.append(relation.conceptidfrom_id)
            
        return ret

class ConceptRelations(models.Model):
    relationid = models.TextField(primary_key=True)
    conceptidfrom = models.ForeignKey('Concepts', db_column='conceptidfrom', related_name='concept_relation_from')
    conceptidto = models.ForeignKey('Concepts', db_column='conceptidto', related_name='concept_relation_to')
    relationtype = models.TextField()
    class Meta:
        db_table = u'concepts"."relations'

class ValueTypes(models.Model):
    valuetype = models.TextField(primary_key=True)
    category = models.TextField()
    description = models.TextField()
    class Meta:
        db_table = u'concepts"."d_valuetypes'

class Values(models.Model):
    valueid = models.TextField(primary_key=True) # This field type is a guess.
    conceptid = models.ForeignKey('Concepts', db_column='conceptid')
    valuetype = models.ForeignKey('ValueTypes', db_column='valuetype')
    datatype = models.TextField()
    value = models.TextField()
    languageid = models.ForeignKey('DLanguages', db_column='languageid')
    class Meta:
        db_table = u'values'

    class _value(object):
        def __init__(self, id='', datatype='', type='', category='', value='', language=''):
            self.id = id
            self.datatype = datatype
            self.type = type
            self.category = category
            self.value = value
            self.language = language

    def toObject(self):
        return self._value(id=self.valueid, datatype=self.datatype, type=self.valuetype.pk, category=self.valuetype.category, value=self.value, language=self.languageid_id)

class AuthGroupPermissions(models.Model):
    id = models.IntegerField(primary_key=True)
    group = models.ForeignKey('AuthGroup')
    permission = models.ForeignKey('AuthPermission')
    class Meta:
        db_table = u'auth_group_permissions'

class AuthUserGroups(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey('AuthUser')
    group = models.ForeignKey('AuthGroup')
    class Meta:
        db_table = u'auth_user_groups'

class AuthUserUserPermissions(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey('AuthUser')
    permission = models.ForeignKey('AuthPermission')
    class Meta:
        db_table = u'auth_user_user_permissions'

class ClassInheritance(models.Model):
    classid = models.ForeignKey('Classes', db_column='classid', related_name='classinheritance_classid')
    inheritsfrom = models.ForeignKey('Classes', db_column='inheritsfrom', related_name='classinheritance_inheritsfrom')
    class Meta:
        db_table = u'class_inheritance'

class Properties(models.Model):
    propertyid = models.TextField(primary_key=True)
    classdomain = models.ForeignKey('Classes', db_column='classdomain', related_name='properties_classdomain')
    classrange = models.ForeignKey('Classes', db_column='classrange', related_name='properties_classrange')
    propertydisplay = models.TextField()
    class Meta:
        db_table = u'properties'

class EntityTypes(models.Model):
    classid = models.ForeignKey('Classes', db_column='classid', related_name='entitytypes_classid')
    conceptid = models.ForeignKey('Concepts', db_column='conceptid', related_name='entitytypes_conceptid')
    businesstablename = models.TextField()
    publishbydefault = models.BooleanField()
    icon = models.TextField()
    defaultvectorcolor = models.TextField()
    entitytypeid = models.TextField(primary_key=True)
    isresource = models.BooleanField()
    groupid = models.ForeignKey('ResourceGroups', db_column='groupid')
    class Meta:
        db_table = u'data"."entity_types'

    def getcolumnname(self):
        ret = None
        #businesstablename = self.classid.defaultbusinesstable
        if self.businesstablename is not None and self.businesstablename != 'entities':
            if self.businesstablename == 'geometries':
                ret = 'geometry'
            else:
                ret = 'val'

        return ret     

    def __unicode__(self):
        return ('%s') % (self.entitytypeid)

class Entities(models.Model):
    entityid = models.TextField(primary_key=True) # This field type is a guess.
    createtms = models.DateTimeField()
    retiretms = models.DateTimeField()
    entitytypeid = models.ForeignKey('EntityTypes', db_column='entitytypeid')
    class Meta:
        db_table = u'data"."entities'

    def __unicode__(self):
        return ('%s of type %s') % (self.entityid, self.entitytypeid)

class Strings(models.Model):
    entityid = models.ForeignKey('Entities', primary_key=True, db_column='entityid')
    val = models.TextField()
    class Meta:
        db_table = u'strings'

class Dates(models.Model):
    entityid = models.ForeignKey('Entities', primary_key=True, db_column='entityid')
    val = models.DateTimeField()
    class Meta:
        db_table = u'dates'

    def __unicode__(self):
        return ('%s') % (self.val)

class Numbers(models.Model):
    entityid = models.ForeignKey('Entities', primary_key=True, db_column='entityid')
    val = models.DecimalField(max_digits=65535, decimal_places=65534)
    class Meta:
        db_table = u'numbers'

class Geometries(models.Model):
    entityid = models.ForeignKey('Entities', primary_key=True, db_column='entityid')
    geometry = models.GeometryField()
    objects = models.GeoManager()
    class Meta:
        db_table = u'geometries'

class InformationThemes(models.Model):
    informationthemeid = models.IntegerField(primary_key=True)
    name_i18n_key = models.TextField()
    displayclass = models.TextField()
    entitytypeid = models.ForeignKey('EntityTypes', db_column='entitytypeid')
    class Meta:
        db_table = u'information_themes'

class Log(models.Model):
    logid = models.IntegerField(primary_key=True)
    entityid = models.ForeignKey('Entities', db_column='entityid')
    logtype = models.TextField()
    userid = models.TextField() # This field type is a guess.
    createtms = models.DateTimeField()
    class Meta:
        db_table = u'log'

class Domains(models.Model):
    entityid = models.ForeignKey('Entities', primary_key=True, db_column='entityid')
    val = models.ForeignKey('Values', db_column='val', null=True)
    class Meta:
        db_table = u'domains'

    def getlabelid(self):
        if self.val_id != None:
            return self.val_id
        return ''

    def getlabelvalue(self):
        if self.val != None:
            return self.val.value   
        return ''

    # def __getattr__(self, name):
    #     print name        
    #     if name == 'val' and self.val_id != None:

    #         return self.val_id
    #     else:
    #         return super(Domains, self).__getattr__(name)

    def __setattr__(self, name, value):
        if name == 'val':
            if not isinstance(value, Values):
                try:
                    uuid.UUID(value)
                    value = Values.objects.get(valueid = value)
                except(ValueError, TypeError):
                    # print value, 'attr value'
                    concepts = Concepts.objects.filter(legacyoid = value, conceptschemeid__name = settings.DATA_CONCEPT_SCHEME)
                    if len(concepts) == 1:
                        value = Values.objects.get(conceptid = concepts[0], valuetype = 'prefLabel')
                    else:
                        # print 'unable to find, or found more then 1 Concept with legacyoid: %s' % (value)
                        value = None

        super(Domains, self).__setattr__(name, value)

class EntityTypeXReports(models.Model):
    reportid = models.ForeignKey('Reports', db_column='reportid')
    entitytypeid = models.ForeignKey('EntityTypes', db_column='entitytypeid')
    class Meta:
        db_table = u'entity_type_x_reports'

class InformationThemesXForms(models.Model):
    formid = models.ForeignKey('Forms', db_column='formid')
    sortorder = models.IntegerField()
    informationthemeid = models.ForeignKey('InformationThemes', db_column='informationthemeid')
    class Meta:
        db_table = u'information_themes_x_forms'

class Mappings(models.Model):
    mappingid = models.TextField(primary_key=True) # This field type is a guess.
    entitytypeidfrom = models.ForeignKey('EntityTypes', db_column='entitytypeidfrom', related_name='mappings_entitytypeidfrom')
    entitytypeidto = models.ForeignKey('EntityTypes', db_column='entitytypeidto', related_name='mappings_entitytypeidto')
    default = models.BooleanField()
    mergenodeid = models.TextField()
    class Meta:
        db_table = u'ontology"."mappings'

class Rules(models.Model):
    ruleid = models.TextField(primary_key=True) # This field type is a guess.
    entitytypedomain = models.ForeignKey('EntityTypes', db_column='entitytypedomain', related_name='rules_entitytypedomain')
    entitytyperange = models.ForeignKey('EntityTypes', db_column='entitytyperange', related_name='rules_entitytyperange')
    propertyid = models.ForeignKey('Properties', db_column='propertyid')
    class Meta:
        db_table = u'rules'

class MappingSteps(models.Model):
    mappingid = models.ForeignKey('Mappings', primary_key=True, db_column='mappingid')
    ruleid = models.ForeignKey('Rules', db_column='ruleid')
    order = models.IntegerField()
    defaultvalue = models.TextField()
    class Meta:
        db_table = u'mapping_steps'

class Relations(models.Model):
    relationid = models.AutoField(primary_key=True)
    ruleid = models.ForeignKey('Rules', db_column='ruleid')
    entityiddomain = models.ForeignKey('Entities', db_column='entityiddomain', related_name='rules_entityiddomain')
    entityidrange = models.ForeignKey('Entities', db_column='entityidrange', related_name='rules_entityidrange')
    notes = models.TextField()
    class Meta:
        db_table = u'data"."relations'

    def save(self, *args, **kwargs):
        relations = Relations.objects.filter(ruleid = self.ruleid, entityiddomain = self.entityiddomain, entityidrange = self.entityidrange)
        if len(relations) > 0:
            return # can't insert duplicate values
        else:
            super(Relations, self).save(*args, **kwargs) # Call the "real" save() method.
