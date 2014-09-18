--
-- PostgreSQL database dump
--

-- Dumped from database version 9.1.4
-- Dumped by pg_dump version 9.1.4
-- Started on 2014-01-31 13:29:27

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET escape_string_warning = off;

--
-- TOC entry 8 (class 2615 OID 15662926)
-- Name: app_metadata; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA app_metadata;


ALTER SCHEMA app_metadata OWNER TO postgres;

--
-- TOC entry 9 (class 2615 OID 15662927)
-- Name: concepts; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA concepts;


ALTER SCHEMA concepts OWNER TO postgres;

--
-- TOC entry 10 (class 2615 OID 15662928)
-- Name: data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA data;


ALTER SCHEMA data OWNER TO postgres;

--
-- TOC entry 11 (class 2615 OID 15662930)
-- Name: ontology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA ontology;


ALTER SCHEMA ontology OWNER TO postgres;

SET search_path = app_metadata, pg_catalog;

--
-- TOC entry 1250 (class 1255 OID 15662931)
-- Dependencies: 8 1844
-- Name: add_form_relationship(text, text, text, integer, text); Type: FUNCTION; Schema: app_metadata; Owner: postgres
--

CREATE FUNCTION add_form_relationship(entity_type_id text, information_theme_name text, form_widget text, sort_order integer, lang text) RETURNS text
    LANGUAGE plpgsql
    AS $$

Declare
information_theme_name_i18n_key text := (replace(information_theme_name, ' ', '') || 'InformationTheme');
information_theme_display_class text := lower(replace(information_theme_name, ' ', ''));
form_id integer;
informationtheme_id integer;

BEGIN
  IF (SELECT COUNT(*) FROM app_metadata.forms WHERE widgetname = form_widget) > 0
  THEN
    IF (SELECT COUNT(*) FROM app_metadata.information_themes WHERE name_i18n_key = information_theme_name_i18n_key AND entitytypeid = entity_type_id) = 0
    THEN
      INSERT INTO app_metadata.i18n(key, value, languageid, widgetname)
      SELECT information_theme_name_i18n_key, information_theme_name, lang, ''
      WHERE NOT EXISTS (SELECT * from app_metadata.i18n where key=information_theme_name_i18n_key);

      INSERT INTO app_metadata.information_themes(name_i18n_key, displayclass, entitytypeid)
          VALUES (information_theme_name_i18n_key, information_theme_display_class, entity_type_id);

    END IF; 

    form_id = (SELECT formid 
            FROM app_metadata.forms
            WHERE widgetname = form_widget);

    informationtheme_id = (SELECT informationthemeid 
            FROM app_metadata.information_themes
            WHERE name_i18n_key = information_theme_name_i18n_key
            AND entitytypeid = entity_type_id);

    IF (SELECT COUNT(*) FROM app_metadata.information_themes_x_forms WHERE form_id = formid AND informationtheme_id = informationthemeid) = 0 THEN
	INSERT INTO app_metadata.information_themes_x_forms(formid, sortorder, informationthemeid) VALUES 
	    (form_id, sort_order, informationtheme_id);
    END IF;
  ELSE
    Return 'WARNING: Form "' || form_widget || '" does not exist; No metadata records will be added for this entry. Resource: "' || entity_type_id || '", Theme: "' || information_theme_name || '"';
  END IF; 

Return 'SUCCESS: "' || form_widget || '" has been associated to "' || entity_type_id || '" under the "' || information_theme_name || '" theme.';

End;

$$;


ALTER FUNCTION app_metadata.add_form_relationship(entity_type_id text, information_theme_name text, form_widget text, sort_order integer, lang text) OWNER TO postgres;

--
-- TOC entry 1251 (class 1255 OID 15662932)
-- Dependencies: 1844 8
-- Name: get_default_language(); Type: FUNCTION; Schema: app_metadata; Owner: postgres
--

CREATE FUNCTION get_default_language() RETURNS text
    LANGUAGE plpgsql
    AS $$

BEGIN
    Return (
        SELECT defaultvalue 
        FROM app_metadata.app_config
        WHERE "name" = 'default_language'
        LIMIT 1
    );
End;

  $$;


ALTER FUNCTION app_metadata.get_default_language() OWNER TO postgres;

--
-- TOC entry 1252 (class 1255 OID 15662933)
-- Dependencies: 8 1844
-- Name: get_i18n_value(text, text, text); Type: FUNCTION; Schema: app_metadata; Owner: postgres
--

CREATE FUNCTION get_i18n_value(p_key text, p_language text, p_widgetname text) RETURNS text
    LANGUAGE plpgsql
    AS $$

BEGIN
IF p_widgetname = '' THEN
    IF EXISTS (SELECT value FROM app_metadata.i18n WHERE key = p_key AND languageid = p_language LIMIT 1) THEN
        Return (
            SELECT value
            FROM app_metadata.i18n
            WHERE key = p_key AND
            languageid = p_language
            LIMIT 1
        );
    ELSE
        Return (
            SELECT value
            FROM app_metadata.i18n
            WHERE key = p_key AND
            languageid = app_metadata.get_default_language()
            LIMIT 1
        );
    END IF;
ELSE
    IF EXISTS (SELECT value FROM app_metadata.i18n WHERE key = p_key AND languageid = p_language AND widgetname = p_widgetname LIMIT 1) THEN
        Return (
            SELECT value
            FROM app_metadata.i18n
            WHERE key = p_key AND
            languageid = p_language AND
            widgetname = p_widgetname
            LIMIT 1
        );
    ELSE
        Return (
            SELECT value
            FROM app_metadata.i18n
            WHERE key = p_key AND
            languageid = app_metadata.get_default_language() AND
            widgetname = p_widgetname
            LIMIT 1
        );
    END IF;
END IF;

End;

  $$;


ALTER FUNCTION app_metadata.get_i18n_value(p_key text, p_language text, p_widgetname text) OWNER TO postgres;

SET search_path = concepts, pg_catalog;

--
-- TOC entry 1267 (class 1255 OID 15662935)
-- Dependencies: 1844 9
-- Name: delete_conceptscheme(text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION delete_conceptscheme(p_conceptscheme text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    Declare 
	deletecount int = (select count(*) from concepts.concepts 
			where conceptschemeid in 
				(select conceptschemeid 
				from concepts.conceptschemes 
				where name = p_conceptscheme));
    
BEGIN


delete from concepts.values
where conceptid in (
   select conceptid from concepts.concepts
   where conceptschemeid in (
	select conceptschemeid from concepts.conceptschemes
	where name = p_conceptscheme));

delete from concepts.relations
where 
   conceptidfrom in (
   select conceptid from concepts.concepts
   where conceptschemeid in (
	select conceptschemeid from concepts.conceptschemes
	where name = p_conceptscheme))
   or
   conceptidto in (
   select conceptid from concepts.concepts
   where conceptschemeid in (
	select conceptschemeid from concepts.conceptschemes
	where name = p_conceptscheme));

delete from concepts.concepts
where conceptschemeid in (select conceptschemeid from concepts.conceptschemes
	where name = p_conceptscheme);


    return deletecount::text||' concepts deleted from concept schema!';
END;
$$;


ALTER FUNCTION concepts.delete_conceptscheme(p_conceptscheme text) OWNER TO postgres;

--
-- TOC entry 1256 (class 1255 OID 15662936)
-- Dependencies: 9 1844
-- Name: get_conceptid(text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION get_conceptid(p_label text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$

Declare
v_return text;

BEGIN

 v_return = (
select a.conceptid 
from concepts.concepts a, concepts.values b
where 1=1
and b.valuetype = 'prefLabel'
and b.value = p_label
and b.conceptid = a.conceptid
LIMIT 1
);

Return v_return;

End;

  $$;


ALTER FUNCTION concepts.get_conceptid(p_label text) OWNER TO postgres;

--
-- TOC entry 1253 (class 1255 OID 15662937)
-- Dependencies: 1844 9
-- Name: get_conceptscheme_name(uuid); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION get_conceptscheme_name(p_conceptid uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$

Declare
v_return text;

BEGIN

 v_return = (
select b.name 
from concepts.concepts a, concepts.conceptschemes b
where 1=1
and a.conceptid = p_conceptid
and a.conceptschemeid = b.conceptschemeid
);

Return v_return;

End;

  $$;


ALTER FUNCTION concepts.get_conceptscheme_name(p_conceptid uuid) OWNER TO postgres;

--
-- TOC entry 1254 (class 1255 OID 15662938)
-- Dependencies: 1844 9
-- Name: get_datatype(text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION get_datatype(value text) RETURNS text
    LANGUAGE plpgsql
    AS $$
Declare v_isnumeric numeric :=0;

BEGIN
 v_isnumeric = Value::numeric;
 return 'numeric';

Exception 
	when data_exception then
	 if (select st_astext(st_geomfromtext(value)) = value) then
	 return 'geometry';

	 else return 'text';
	 
	 end if;

	  
	
End;

  $$;


ALTER FUNCTION concepts.get_datatype(value text) OWNER TO postgres;

--
-- TOC entry 1255 (class 1255 OID 15662939)
-- Dependencies: 1844 9
-- Name: get_legacyoid_from_entitytypeid(text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION get_legacyoid_from_entitytypeid(p_entitytypeid text) RETURNS text
    LANGUAGE plpgsql
    AS $$

Declare
v_return text;

BEGIN

 v_return = (
	select b.legacyoid
	from data.entity_types a, concepts.concepts b
	where 1=1
	 and a.entitytypeid = p_entitytypeid
	 and a.conceptid = b.conceptid
);

Return v_return;

End;

  $$;


ALTER FUNCTION concepts.get_legacyoid_from_entitytypeid(p_entitytypeid text) OWNER TO postgres;

--
-- TOC entry 1284 (class 1255 OID 15662940)
-- Dependencies: 1844 9
-- Name: get_preferred_label(uuid); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION get_preferred_label(p_conceptid uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$

Declare
v_return text;

BEGIN

 v_return = (
select b.value
 
from concepts.values b, concepts.d_languages c
where 1=1
and b.conceptid = p_conceptid
and b.valuetype = 'prefLabel'
and b.languageid = c.languageid
and c.isdefault = true
);

Return v_return;

End;

  $$;


ALTER FUNCTION concepts.get_preferred_label(p_conceptid uuid) OWNER TO postgres;

--
-- TOC entry 1277 (class 1255 OID 15662941)
-- Dependencies: 1844 9
-- Name: get_preferred_label(uuid, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION get_preferred_label(p_conceptid uuid, p_languageid text) RETURNS text
    LANGUAGE plpgsql
    AS $$

Declare
v_return text;

BEGIN

 v_return = (
select b.label 
from concepts.values b
where 1=1
and b.conceptid = p_conceptid
and b.valuetype = 'prefLabel'
and b.languageid = p_languageid
);

Return v_return;

End;

  $$;


ALTER FUNCTION concepts.get_preferred_label(p_conceptid uuid, p_languageid text) OWNER TO postgres;

--
-- TOC entry 1287 (class 1255 OID 15662942)
-- Dependencies: 9 1844
-- Name: insert_concept(text, text, text, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION insert_concept(p_conceptschemename text, p_label text, p_note text, p_legacyid text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    Declare 
    v_conceptschemeid uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename);
    v_conceptid uuid = public.uuid_generate_v1mc();
    v_valueid uuid = public.uuid_generate_v1mc();
    --user does not pass in languageid - default language used
	v_languageid text = (select languageid from concepts.d_languages where isdefault = TRUE);
    
BEGIN

  INSERT INTO concepts.concepts(conceptid, conceptschemeid, legacyoid)
  VALUES (v_conceptid,v_conceptschemeid, p_legacyid);

  INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
  VALUES (v_valueid, v_conceptid, 'prefLabel', 'text', p_label, v_languageid);

  INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
  VALUES (v_valueid, v_conceptid, 'scopeNote', 'text', p_note, v_languageid);

  return v_conceptid;
    
END;
$$;


ALTER FUNCTION concepts.insert_concept(p_conceptschemename text, p_label text, p_note text, p_legacyid text) OWNER TO postgres;

--
-- TOC entry 1258 (class 1255 OID 15662943)
-- Dependencies: 1844 9
-- Name: insert_concept(text, text, text, text, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION insert_concept(p_conceptschemename text, p_label text, p_note text, p_languageid text, p_legacyid text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    Declare 
    v_conceptschemeid uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename);
    v_conceptid uuid = public.uuid_generate_v1mc();
    v_valueid uuid = public.uuid_generate_v1mc();
    --user passes in the language for label and note language
  v_languageid text = p_languageid;
    
BEGIN

  INSERT INTO concepts.concepts(conceptid, conceptschemeid, legacyoid)
  VALUES (v_conceptid,v_conceptschemeid, p_legacyid);

IF trim(p_label) is not null and p_label<>'' then
  INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
  VALUES (v_valueid, v_conceptid, 'prefLabel', 'text', trim(initcap(p_label)), v_languageid);
END IF;

IF trim(p_note) is not null and p_note <> '' then 
  INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
  VALUES (v_valueid, v_conceptid, 'scopeNote', 'text', p_note, v_languageid);
END IF;  

  return v_conceptid;
-- END IF;
    
END;
$$;


ALTER FUNCTION concepts.insert_concept(p_conceptschemename text, p_label text, p_note text, p_languageid text, p_legacyid text) OWNER TO postgres;

--
-- TOC entry 1260 (class 1255 OID 15662944)
-- Dependencies: 9 1844
-- Name: insert_label(text, text, text, text, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION insert_label(p_conceptschemename text, p_legacyid text, p_label text, p_labeltype text, p_languageid text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    Declare 
    v_conceptschemeid uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename);
    v_conceptid uuid = (select conceptid from concepts.concepts a where conceptschemeid = v_conceptschemeid and a.legacyoid = p_legacyid) ;
    v_valueid uuid = public.uuid_generate_v1mc();
    --user passes in the language for label and note language
    v_languageid text = p_languageid;
    
BEGIN

If v_languageid = '' then v_languageid = (select languageid from concepts.d_languages
            where isdefault = true);
end if;

    INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
    VALUES (v_valueid, v_conceptid, p_labeltype, 'text', trim(initcap(p_label)), v_languageid);

    return v_labelid;
    
END;
$$;


ALTER FUNCTION concepts.insert_label(p_conceptschemename text, p_legacyid text, p_label text, p_labeltype text, p_languageid text) OWNER TO postgres;

--
-- TOC entry 1257 (class 1255 OID 15662947)
-- Dependencies: 1844 9
-- Name: insert_relation(text, text, text, text, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION insert_relation(p_conceptschemename1 text, p_legacyid1 text, p_relationtype text, p_conceptschemename2 text, p_legacyid2 text) RETURNS text
    LANGUAGE plpgsql
    AS $$

--!!! USE THIS FUNCTION WHEN EACH CONCEPT LIVE IN SEPERATE CONCEPTSCHEMES

    Declare 
    v_conceptschemeid1 uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename1);
    v_conceptschemeid2 uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename2);
    v_conceptidfrom uuid = null;
    v_conceptidto uuid = null;
    
BEGIN

    v_conceptidfrom = (select conceptid from concepts.concepts c
         where trim(legacyoid) = trim(p_legacyid1)
           and c.conceptschemeid = v_conceptschemeid1);
    v_conceptidto = (select conceptid from concepts.concepts c
         where trim(legacyoid) = trim(p_legacyid2)
           and c.conceptschemeid = v_conceptschemeid2);

  IF v_conceptidfrom is not null and v_conceptidto is not null and v_conceptidto <> v_conceptidfrom then
    INSERT INTO concepts.relations(relationid, conceptidfrom, conceptidto, relationtype)
    VALUES (uuid_generate_v1mc(), v_conceptidfrom, v_conceptidto, p_relationtype);
    
    return 'success!';
  
  ELSE
    return 'fail! no relation inserted.';
  END IF;

END;
$$;


ALTER FUNCTION concepts.insert_relation(p_conceptschemename1 text, p_legacyid1 text, p_relationtype text, p_conceptschemename2 text, p_legacyid2 text) OWNER TO postgres;

--
-- TOC entry 1286 (class 1255 OID 15662948)
-- Dependencies: 9 1844
-- Name: insert_value(text, text, text, text, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION insert_value(p_conceptschemename text, p_legacyid text, p_value text, p_valuetype text, p_datatype text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    Declare 
    v_conceptschemeid uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename);
    v_conceptid uuid = (select conceptid from concepts.concepts a where conceptschemeid = v_conceptschemeid and a.legacyoid = p_legacyid) ;
    v_valueid uuid = public.uuid_generate_v1mc();
    v_languageid text = (select languageid from concepts.d_languages where isdefault = TRUE limit 1);
    
BEGIN

IF p_valuetype in ('altLabel','changeNote','definition','editorialNote','example','hiddenLabel','historyNote','prefLabel','scopeNote') THEN

    INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
    VALUES (v_valueid, v_conceptid, p_valuetype, p_datatype, p_value, v_languageid);

    return v_valueid;

ELSE

    INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value)
    VALUES (v_valueid, v_conceptid, p_valuetype, p_datatype, p_value);

    return v_valueid;
    
END IF;  

END;
$$;


ALTER FUNCTION concepts.insert_value(p_conceptschemename text, p_legacyid text, p_value text, p_valuetype text, p_datatype text) OWNER TO postgres;

--
-- TOC entry 1285 (class 1255 OID 15664388)
-- Dependencies: 9 1844
-- Name: insert_value(text, text, text, text, text, text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION insert_value(p_conceptschemename text, p_legacyid text, p_value text, p_valuetype text, p_datatype text, languageid text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    Declare 
    v_conceptschemeid uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename);
    v_conceptid uuid = (select conceptid from concepts.concepts a where conceptschemeid = v_conceptschemeid and a.legacyoid = p_legacyid) ;
    v_valueid uuid = public.uuid_generate_v1mc();
        
BEGIN

    

    INSERT INTO concepts.values (valueid, conceptid, valuetype, datatype, value, languageid)
    VALUES (v_valueid, v_conceptid, p_valuetype, p_datatype, p_value, p_languageid);

    return v_valueid;
    
END;
$$;


ALTER FUNCTION concepts.insert_value(p_conceptschemename text, p_legacyid text, p_value text, p_valuetype text, p_datatype text, languageid text) OWNER TO postgres;

--
-- TOC entry 1261 (class 1255 OID 15662949)
-- Dependencies: 1844 9
-- Name: is_timestamp(text); Type: FUNCTION; Schema: concepts; Owner: postgres
--

CREATE FUNCTION is_timestamp(p_value text) RETURNS text
    LANGUAGE plpgsql
    AS $$
Declare v_istimestamp timestamp;
BEGIN
 v_istimestamp = p_value::timestamp;
 return 'Y';
Exception
  when data_exception then
  return 'N';
End;

  $$;


ALTER FUNCTION concepts.is_timestamp(p_value text) OWNER TO postgres;

SET search_path = data, pg_catalog;

--
-- TOC entry 1262 (class 1255 OID 15662950)
-- Dependencies: 1844 10
-- Name: get_attribute(uuid, text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_attribute(p_entityid uuid, p_entitytypeid text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
  relations uuid;
  ret text := '';
    BEGIN
  FOR relations IN SELECT r.entityidrange FROM data.relations r WHERE r.entityiddomain = p_entityid
  LOOP
    IF EXISTS(SELECT * FROM data.strings a JOIN data.entities e ON e.entityid = a.entityid WHERE a.entityid = relations AND e.entitytypeid = p_entitytypeid) THEN
      ret = (select val FROM data.strings a JOIN data.entities e ON e.entityid = a.entityid WHERE a.entityid = relations AND e.entitytypeid = p_entitytypeid LIMIT 1);
      EXIT;
    ELSE
      ret = (SELECT data.get_attribute(relations, p_entitytypeid));
      IF ret != '' THEN 
        EXIT;
      END IF;
    END IF;
  END LOOP;
  RETURN ret;

End;
$$;


ALTER FUNCTION data.get_attribute(p_entityid uuid, p_entitytypeid text) OWNER TO postgres;

--
-- TOC entry 1268 (class 1255 OID 15662951)
-- Dependencies: 1844 10
-- Name: get_conceptid(text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_conceptid(p_label text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$

BEGIN

Return (
select conceptid from concepts.values
where 1=1
and value = p_label
and valuetype in ('prefLabel', 'altLabel'));

End;

  $$;


ALTER FUNCTION data.get_conceptid(p_label text) OWNER TO postgres;

--
-- TOC entry 1263 (class 1255 OID 15662952)
-- Dependencies: 1844 10
-- Name: get_entitytypeid(uuid); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_entitytypeid(p_entityid uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$

BEGIN

return (select entitytypeid 
	from data.entities
	where 1=1
	and entityid = p_entityid);

End;

  $$;


ALTER FUNCTION data.get_entitytypeid(p_entityid uuid) OWNER TO postgres;

--
-- TOC entry 1264 (class 1255 OID 15662953)
-- Dependencies: 10 1844
-- Name: get_geometry(uuid); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_geometry(p_entityid uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
  relations uuid;
  ret text := '';
    BEGIN
  FOR relations IN SELECT r.entityidrange FROM data.relations r WHERE r.entityiddomain = p_entityid
  LOOP
    IF EXISTS(SELECT * FROM data.geometries g WHERE g.entityid = relations) THEN
      ret = (select st_astext(st_multi(st_collect(g.geometry))) FROM data.geometries g WHERE g.entityid = relations);
      EXIT;
    ELSE
      ret = (SELECT data.get_geometry(relations));
      IF ret != '' THEN 
        EXIT;
      END IF;
    END IF;
  END LOOP;
  RETURN ret;

End;

$$;


ALTER FUNCTION data.get_geometry(p_entityid uuid) OWNER TO postgres;

--
-- TOC entry 1269 (class 1255 OID 15662954)
-- Dependencies: 10 1844
-- Name: get_label(uuid); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_label(p_labelid uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$

BEGIN

Return (
select label from concepts.values
where 1=1
and valueid = p_labelid
and languageid = (SELECT languageid
		    FROM concepts.d_languages
                    WHERE isdefault = True));

End;

  $$;


ALTER FUNCTION data.get_label(p_labelid uuid) OWNER TO postgres;

--
-- TOC entry 1270 (class 1255 OID 15662955)
-- Dependencies: 1844 10
-- Name: get_label(uuid, text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_label(p_labelid uuid, p_language text) RETURNS text
    LANGUAGE plpgsql
    AS $$

BEGIN

Return (
select label from concepts.values
where 1=1
and valueid = p_labelid
and languageid = p_language);

End;

  $$;


ALTER FUNCTION data.get_label(p_labelid uuid, p_language text) OWNER TO postgres;

--
-- TOC entry 1259 (class 1255 OID 15664391)
-- Dependencies: 10 1844
-- Name: get_labelid(text, text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_labelid(p_label text, p_languageid text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$

BEGIN

Return (
select labelid from concepts.values
where 1=1
and value = p_label
and languageid = p_languageid
and valuetype = 'prefLabel');

End;

  $$;


ALTER FUNCTION data.get_labelid(p_label text, p_languageid text) OWNER TO postgres;

--
-- TOC entry 1271 (class 1255 OID 15662957)
-- Dependencies: 1844 10
-- Name: get_labelid(text, text, text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_labelid(p_label text, p_languageid text, p_labeltype text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$

BEGIN

Return (
select labelid from concepts.values
where 1=1
and value = p_label
and languageid = p_languageid
and labeltype = p_labeltype);

End;

  $$;


ALTER FUNCTION data.get_labelid(p_label text, p_languageid text, p_labeltype text) OWNER TO postgres;

--
-- TOC entry 1265 (class 1255 OID 15662958)
-- Dependencies: 1844 10
-- Name: get_languageid(text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_languageid(p_languagename text) RETURNS integer
    LANGUAGE plpgsql
    AS $$

BEGIN
	Return
	(select languageid 
	from concepts.d_languages
	where 1=1
	and languagename = p_languagename);
	

End;

  $$;


ALTER FUNCTION data.get_languageid(p_languagename text) OWNER TO postgres;

--
-- TOC entry 1266 (class 1255 OID 15662959)
-- Dependencies: 10 1844
-- Name: get_primaryname(uuid); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION get_primaryname(p_entityid uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
  relations uuid;
  ret text := '';
    BEGIN
  FOR relations IN SELECT r.entityidrange FROM data.relations r WHERE r.entityiddomain = p_entityid
  LOOP
    IF EXISTS(SELECT * FROM data.strings a JOIN data.entities e ON e.entityid = a.entityid WHERE a.entityid = relations AND e.entitytypeid = 'NAME.E41') THEN
      ret = (select val FROM data.strings a JOIN data.entities e ON e.entityid = a.entityid WHERE a.entityid = relations AND e.entitytypeid = 'NAME.E41' LIMIT 1);
      EXIT;
    ELSE
      ret = (SELECT data.get_primaryname(relations));
      IF ret != '' THEN 
        EXIT;
      END IF;
    END IF;
  END LOOP;
  RETURN ret;

End;
$$;


ALTER FUNCTION data.get_primaryname(p_entityid uuid) OWNER TO postgres;

--
-- TOC entry 1278 (class 1255 OID 15662960)
-- Dependencies: 10 1844
-- Name: insert_entitytype(text, text, boolean, text, text, text, text, text, text, text, text, text); Type: FUNCTION; Schema: data; Owner: postgres
--



CREATE FUNCTION insert_entitytype(p_entitytypeid text, p_businesstablename text, p_publishbydefault boolean, p_icon text, p_defaultvectorcolor text, p_asset_entity text, p_conceptschemename text, p_note text, p_notelanguage text, p_entitynamelanguage text, p_entitynametype text, p_parentconceptlabel text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    Declare 
    v_conceptid uuid = null;
    v_parentconceptid uuid = (select concepts.get_conceptid(p_parentconceptlabel));
    v_isresource boolean = FALSE;
    
BEGIN

    IF p_entitytypeid = p_asset_entity
    THEN v_isresource = TRUE;
    END IF;
    
    IF split_part(p_entitytypeid, '.', 1) != '' and split_part(p_entitytypeid, '.', 2) != '' THEN
        IF NOT EXISTS(SELECT entitytypeid FROM data.entity_types WHERE entitytypeid = p_entitytypeid) THEN

        v_conceptid = (select concepts.insert_concept (p_conceptschemename, split_part(p_entitytypeid, '.', 1), p_note, p_notelanguage, upper(p_entitytypeid)));

        IF v_parentconceptid in (select conceptid from concepts.concepts) then
            INSERT INTO concepts.relations (conceptidfrom, conceptidto, relationtype, relationid)
            VALUES (v_parentconceptid, v_conceptid, 'has narrower concept', public.uuid_generate_v1mc());
        END IF;
        
            INSERT INTO data.entity_types(
                    classid, conceptid, businesstablename, publishbydefault, icon, 
                    defaultvectorcolor, entitytypeid, isresource)
            VALUES (btrim(split_part(p_entitytypeid, '.', 2)), v_conceptid, p_businesstablename, p_publishbydefault, p_icon, 
                    p_defaultvectorcolor, p_entitytypeid, v_isresource);


        
            return p_entitytypeid;

        ELSE
            return 'Entity type already exists: ' || p_entitytypeid;
        END IF;
    ELSE
        return 'Invalid entity type id: ' || p_entitytypeid;
    END IF;    

END;
$$;


ALTER FUNCTION data.insert_entitytype(p_entitytypeid text, p_businesstablename text, p_publishbydefault boolean, p_icon text, p_defaultvectorcolor text, p_asset_entity text, p_conceptschemename text, p_note text, p_notelanguage text, p_entitynamelanguage text, p_entitynametype text, p_parentconceptlabel text) OWNER TO postgres;

--
-- TOC entry 1272 (class 1255 OID 15662961)
-- Dependencies: 10
-- Name: is_primary_key(text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION is_primary_key(tablename text) RETURNS name
    LANGUAGE sql
    AS $_$
  
SELECT               
  pg_attribute.attname
FROM pg_index, pg_class, pg_attribute 
WHERE 
  pg_class.oid = ($1)::regclass AND
  indrelid = pg_class.oid AND
  pg_attribute.attrelid = pg_class.oid AND 
  pg_attribute.attnum = any(pg_index.indkey)
  AND indisprimary;
  
$_$;


ALTER FUNCTION data.is_primary_key(tablename text) OWNER TO postgres;

--
-- TOC entry 1273 (class 1255 OID 15662962)
-- Dependencies: 1844 10
-- Name: legacyid_2_resourceid(text); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION legacyid_2_resourceid(p_legacyid text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$

DECLARE
v_entityid uuid = (select id from data.vw_nodes
			where val = p_legacyid
			 and label = 'EXTERNAL XREF.E42');

BEGIN

if v_entityid is not null then
  RETURN (SELECT data.recurse_up_relations(v_entityid));

else
  RETURN null;

end if;



END
  $$;


ALTER FUNCTION data.legacyid_2_resourceid(p_legacyid text) OWNER TO postgres;

--
-- TOC entry 1274 (class 1255 OID 15662963)
-- Dependencies: 10 1844
-- Name: recurse_up_relations(uuid); Type: FUNCTION; Schema: data; Owner: postgres
--

CREATE FUNCTION recurse_up_relations(p_entityidrange uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$

DECLARE
v_entityiddomain uuid = (select entityiddomain
			from data.relations
			where entityidrange = p_entityidrange);

BEGIN

IF v_entityiddomain in (select entityid from data.entities 
			where entitytypeid in (select entitytypeid from data.entity_types
						where isresource = true)) THEN
	RETURN v_entityiddomain;

ELSE 
	RETURN (SELECT data.recurse_up_relations(v_entityiddomain));

End if;

END
  $$;


ALTER FUNCTION data.recurse_up_relations(p_entityidrange uuid) OWNER TO postgres;

SET search_path = ontology, pg_catalog;

--
-- TOC entry 1275 (class 1255 OID 15662967)
-- Dependencies: 11 1844
-- Name: check_entitytypeid(text); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION check_entitytypeid(p_entitytypeid text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE 

BEGIN 
if 
	p_entitytypeid in (select entitytypeid from data.entity_types where isresource = true)
	then  
	  RETURN 'ASSET';
else
	RETURN 'ELEMENT';

END IF;
END;
$$;


ALTER FUNCTION ontology.check_entitytypeid(p_entitytypeid text) OWNER TO postgres;

--
-- TOC entry 1276 (class 1255 OID 15662968)
-- Dependencies: 11 1844
-- Name: check_entitytypeid(text, text); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION check_entitytypeid(p_entitytypeidfrom text, p_entitytypeidto text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE 

BEGIN 
if 
	p_entitytypeidfrom in (select entitytypeid from data.entity_types where isresource = true)
	and
	p_entitytypeidto in (select entitytypeid from data.entity_types where isresource = false)
  THEN
  RETURN 'OK';
  
else
	RETURN 'NOT OK!';

END IF;
END;
$$;


ALTER FUNCTION ontology.check_entitytypeid(p_entitytypeidfrom text, p_entitytypeidto text) OWNER TO postgres;

--
-- TOC entry 1279 (class 1255 OID 15662969)
-- Dependencies: 11 1844
-- Name: insert_mapping(text, text, text, boolean, text); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION insert_mapping(p_mapping text, p_entitytypefrom text, p_entitytypeto text, p_default boolean, p_mergenodeid text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE 
  v_domain text;
  v_property text;
  v_range text;
  v_mappingid text;
  v_index integer := 0;
  v_steps text[] := regexp_split_to_array(p_mapping, ',');
BEGIN 

    p_entitytypefrom = btrim(p_entitytypefrom);
    p_entitytypeto = btrim(p_entitytypeto);
    PERFORM data.insert_entitytype(p_entitytypefrom, '', 'True', '', '', p_entitytypefrom, 'CORE DATA STANDARD', '', 'en-us', 'en-us', 'UNK', '');
    PERFORM data.insert_entitytype(p_entitytypeto, '', 'True', '', '', p_entitytypefrom, 'CORE DATA STANDARD', '', 'en-us', 'en-us', 'UNK', '');
    v_mappingid = (SELECT ontology.populate_mappings(p_entitytypefrom, p_entitytypeto, p_default, p_mergenodeid));

    WHILE v_index < ((array_length(v_steps,1)-1)/2)
    LOOP
        v_domain = btrim(v_steps[(v_index*2)+1]);
        v_property = btrim(v_steps[(v_index*2+1)+1]);
        v_range = btrim(v_steps[(v_index*2+2)+1]);
        
        PERFORM data.insert_entitytype(v_domain, '', 'True', '', '', p_entitytypefrom, 'CORE DATA STANDARD', '', 'en-us', 'en-us', 'UNK', '');
        PERFORM data.insert_entitytype(v_range, '', 'True', '', '', p_entitytypefrom, 'CORE DATA STANDARD', '', 'en-us', 'en-us', 'UNK', '');
        PERFORM ontology.populate_rules(v_domain, v_property, v_range);
        PERFORM ontology.populate_mapping_steps(v_mappingid, v_domain, v_property, v_range, p_entitytypefrom, p_entitytypeto, v_index+1);  

        raise notice 'mapping step: % % %',v_domain, v_property, v_range;
        v_index := v_index + 1;

    END LOOP;
  
    RETURN v_index;

END;
$$;


ALTER FUNCTION ontology.insert_mapping(p_mapping text, p_entitytypefrom text, p_entitytypeto text, p_default boolean, p_mergenodeid text) OWNER TO postgres;

--
-- TOC entry 1280 (class 1255 OID 15662970)
-- Dependencies: 11 1844
-- Name: populate_mapping_steps(text, text, text, text, text, text, integer); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION populate_mapping_steps(p_mappingid text, p_domain text, p_property text, p_range text, p_entitytypefrom text, p_entitytypeto text, p_order integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE 
        ret text = '';
        v_ruleid uuid = (SELECT ruleid FROM ontology.rules WHERE entitytypedomain = p_domain AND entitytyperange = p_range AND propertyid = p_property);
BEGIN
    IF (SELECT COUNT(*) FROM ontology.mapping_steps WHERE mappingid = p_mappingid::uuid AND ruleid = v_ruleid AND "order" = p_order) > 0
    THEN
        RETURN 'Failed';
    ELSE
      INSERT INTO ontology.mapping_steps(mappingid, ruleid, "order")VALUES(p_mappingid::uuid, v_ruleid, p_order);
      RETURN ret;    
    END IF;    

END;
$$;


ALTER FUNCTION ontology.populate_mapping_steps(p_mappingid text, p_domain text, p_property text, p_range text, p_entitytypefrom text, p_entitytypeto text, p_order integer) OWNER TO postgres;

--
-- TOC entry 1281 (class 1255 OID 15662971)
-- Dependencies: 1844 11
-- Name: populate_mappings(text, text, boolean, text); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION populate_mappings(p_entityfrom text, p_entityto text, p_default boolean, p_mergenodeid text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE v_newmappingid uuid = uuid_generate_v1mc();
BEGIN

    IF (SELECT COUNT(*) FROM ontology.mappings WHERE entitytypeidfrom = p_entityfrom AND entitytypeidto = p_entityto) > 0
    THEN
        RETURN (SELECT mappingid FROM ontology.mappings WHERE entitytypeidfrom = p_entityfrom AND entitytypeidto = p_entityto);
    ELSE
        INSERT INTO ontology.mappings (mappingid, entitytypeidfrom, entitytypeidto, "default", mergenodeid)
        VALUES(v_newmappingid, p_entityfrom, p_entityto, p_default, p_mergenodeid);

        RETURN v_newmappingid;
    END IF; 

END;
$$;


ALTER FUNCTION ontology.populate_mappings(p_entityfrom text, p_entityto text, p_default boolean, p_mergenodeid text) OWNER TO postgres;

--
-- TOC entry 1282 (class 1255 OID 15662972)
-- Dependencies: 1844 11
-- Name: populate_rules(text, text, text); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION populate_rules(p_domain text, p_property text, p_range text) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE 
        v_newruleid uuid = uuid_generate_v1mc();
BEGIN
    IF (SELECT COUNT(*) FROM ontology.rules WHERE entitytypedomain = p_domain AND entitytyperange = p_range AND propertyid = p_property) > 0
    THEN
        RETURN (SELECT ruleid FROM ontology.rules WHERE entitytypedomain = p_domain AND entitytyperange = p_range AND propertyid = p_property);
    ELSE
        INSERT INTO ontology.rules (ruleid, propertyid, entitytypedomain, entitytyperange)
        VALUES(v_newruleid, p_property, p_domain, p_range);
        
        RETURN v_newruleid;
    END IF; 
END;
$$;


ALTER FUNCTION ontology.populate_rules(p_domain text, p_property text, p_range text) OWNER TO postgres;

--
-- TOC entry 1283 (class 1255 OID 15662973)
-- Dependencies: 1844 11
-- Name: tgr_mappings_validation(); Type: FUNCTION; Schema: ontology; Owner: postgres
--

CREATE FUNCTION tgr_mappings_validation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
IF 
	new.entitytypeidfrom in (select entitytypeid from data.entity_types where isresource = true)
	and
	new.entitytypeidto in (select entitytypeid from data.entity_types where isresource = false)
  THEN
  RETURN NEW;

ELSE  
	IF new.entitytypeidfrom not in (select entitytypeid from data.entity_types where isresource = true) THEN
	RAISE EXCEPTION 'Invalid entitytypeidfrom. (%) needs to be an asset.', new.entitytypeidfrom;
	END IF;


	IF new.entitytypeidto not in (select entitytypeid from data.entity_types where isresource = false) THEN
	RAISE EXCEPTION 'Invalid entitytypeidto. (%) Needs to be an element.', new.entitytypeidto;
	END IF;

END IF;

END;
$$;


ALTER FUNCTION ontology.tgr_mappings_validation() OWNER TO postgres;

SET search_path = app_metadata, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 206 (class 1259 OID 15662974)
-- Dependencies: 8
-- Name: app_config; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE app_config (
    name text NOT NULL,
    defaultvalue text NOT NULL,
    datatype text NOT NULL,
    notes text,
    isprivate boolean NOT NULL
);


ALTER TABLE app_metadata.app_config OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 15662980)
-- Dependencies: 8
-- Name: entity_type_x_reports; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE entity_type_x_reports (
    reportid integer NOT NULL,
    entitytypeid text
);


ALTER TABLE app_metadata.entity_type_x_reports OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 15662986)
-- Dependencies: 8
-- Name: forms; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE forms (
    formid integer NOT NULL,
    name_i18n_key text NOT NULL,
    widgetname text
);


ALTER TABLE app_metadata.forms OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 15662992)
-- Dependencies: 208 8
-- Name: forms_formid_seq; Type: SEQUENCE; Schema: app_metadata; Owner: postgres
--

CREATE SEQUENCE forms_formid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE app_metadata.forms_formid_seq OWNER TO postgres;

--
-- TOC entry 3445 (class 0 OID 0)
-- Dependencies: 209
-- Name: forms_formid_seq; Type: SEQUENCE OWNED BY; Schema: app_metadata; Owner: postgres
--

ALTER SEQUENCE forms_formid_seq OWNED BY forms.formid;


--
-- TOC entry 210 (class 1259 OID 15662994)
-- Dependencies: 8
-- Name: i18n; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE i18n (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    languageid text NOT NULL,
    widgetname text NOT NULL
);


ALTER TABLE app_metadata.i18n OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 15663000)
-- Dependencies: 8 210
-- Name: i18n_id_seq; Type: SEQUENCE; Schema: app_metadata; Owner: postgres
--

CREATE SEQUENCE i18n_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE app_metadata.i18n_id_seq OWNER TO postgres;

--
-- TOC entry 3446 (class 0 OID 0)
-- Dependencies: 211
-- Name: i18n_id_seq; Type: SEQUENCE OWNED BY; Schema: app_metadata; Owner: postgres
--

ALTER SEQUENCE i18n_id_seq OWNED BY i18n.id;


--
-- TOC entry 212 (class 1259 OID 15663002)
-- Dependencies: 8
-- Name: information_themes; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE information_themes (
    informationthemeid integer NOT NULL,
    name_i18n_key text NOT NULL,
    displayclass text,
    entitytypeid text
);


ALTER TABLE app_metadata.information_themes OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 15663008)
-- Dependencies: 212 8
-- Name: information_themes_informationthemeid_seq; Type: SEQUENCE; Schema: app_metadata; Owner: postgres
--

CREATE SEQUENCE information_themes_informationthemeid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE app_metadata.information_themes_informationthemeid_seq OWNER TO postgres;

--
-- TOC entry 3447 (class 0 OID 0)
-- Dependencies: 213
-- Name: information_themes_informationthemeid_seq; Type: SEQUENCE OWNED BY; Schema: app_metadata; Owner: postgres
--

ALTER SEQUENCE information_themes_informationthemeid_seq OWNED BY information_themes.informationthemeid;


--
-- TOC entry 214 (class 1259 OID 15663010)
-- Dependencies: 8
-- Name: information_themes_x_forms; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE information_themes_x_forms (
    formid integer NOT NULL,
    sortorder integer NOT NULL,
    informationthemeid integer NOT NULL
);


ALTER TABLE app_metadata.information_themes_x_forms OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 15663013)
-- Dependencies: 3311 3312 3313 3314 8
-- Name: maplayers; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE maplayers (
    id integer NOT NULL,
    active boolean DEFAULT false NOT NULL,
    on_map boolean DEFAULT false NOT NULL,
    selectable boolean DEFAULT false NOT NULL,
    basemap boolean DEFAULT false NOT NULL,
    name_i18n_key text NOT NULL,
    icon text,
    symbology text,
    thumbnail text,
    description_i18n_key text,
    layergroup_i18n_key text,
    layer text NOT NULL,
    sortorder integer
);


ALTER TABLE app_metadata.maplayers OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 15663023)
-- Dependencies: 215 8
-- Name: maplayers_id_seq; Type: SEQUENCE; Schema: app_metadata; Owner: postgres
--

CREATE SEQUENCE maplayers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE app_metadata.maplayers_id_seq OWNER TO postgres;

--
-- TOC entry 3448 (class 0 OID 0)
-- Dependencies: 216
-- Name: maplayers_id_seq; Type: SEQUENCE OWNED BY; Schema: app_metadata; Owner: postgres
--

ALTER SEQUENCE maplayers_id_seq OWNED BY maplayers.id;


--
-- TOC entry 217 (class 1259 OID 15663025)
-- Dependencies: 8
-- Name: reports; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE reports (
    reportid integer NOT NULL,
    name_i18n_key text NOT NULL,
    widgetname text
);


ALTER TABLE app_metadata.reports OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 15663031)
-- Dependencies: 217 8
-- Name: reports_reportid_seq; Type: SEQUENCE; Schema: app_metadata; Owner: postgres
--

CREATE SEQUENCE reports_reportid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE app_metadata.reports_reportid_seq OWNER TO postgres;

--
-- TOC entry 3449 (class 0 OID 0)
-- Dependencies: 218
-- Name: reports_reportid_seq; Type: SEQUENCE OWNED BY; Schema: app_metadata; Owner: postgres
--

ALTER SEQUENCE reports_reportid_seq OWNED BY reports.reportid;


--
-- TOC entry 219 (class 1259 OID 15663033)
-- Dependencies: 8
-- Name: resource_groups; Type: TABLE; Schema: app_metadata; Owner: postgres; Tablespace: 
--

CREATE TABLE resource_groups (
    groupid integer NOT NULL,
    name_i18n_key text NOT NULL,
    displayclass text
);


ALTER TABLE app_metadata.resource_groups OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 15663039)
-- Dependencies: 219 8
-- Name: resource_groups_groupid_seq; Type: SEQUENCE; Schema: app_metadata; Owner: postgres
--

CREATE SEQUENCE resource_groups_groupid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE app_metadata.resource_groups_groupid_seq OWNER TO postgres;

--
-- TOC entry 3450 (class 0 OID 0)
-- Dependencies: 220
-- Name: resource_groups_groupid_seq; Type: SEQUENCE OWNED BY; Schema: app_metadata; Owner: postgres
--

ALTER SEQUENCE resource_groups_groupid_seq OWNED BY resource_groups.groupid;


SET search_path = concepts, pg_catalog;

--
-- TOC entry 221 (class 1259 OID 15663041)
-- Dependencies: 3318 9
-- Name: concepts; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE concepts (
    conceptid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    conceptschemeid uuid NOT NULL,
    legacyoid text
);


ALTER TABLE concepts.concepts OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 15663048)
-- Dependencies: 3319 9
-- Name: conceptschemes; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE conceptschemes (
    conceptschemeid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    name text NOT NULL
);


ALTER TABLE concepts.conceptschemes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 15663061)
-- Dependencies: 9
-- Name: d_languages; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE d_languages (
    languageid text NOT NULL,
    languagename text NOT NULL,
    isdefault boolean NOT NULL
);


ALTER TABLE concepts.d_languages OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 15663073)
-- Dependencies: 9
-- Name: d_relationtypes; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE d_relationtypes (
    relationtype text NOT NULL
);


ALTER TABLE concepts.d_relationtypes OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 15664364)
-- Dependencies: 9
-- Name: d_valuetypes; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE d_valuetypes (
    valuetype text NOT NULL,
    category text,
    description text
);


ALTER TABLE concepts.d_valuetypes OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 15663079)
-- Dependencies: 9
-- Name: geometries_geometryid_seq; Type: SEQUENCE; Schema: concepts; Owner: postgres
--

CREATE SEQUENCE geometries_geometryid_seq
    START WITH 101
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE concepts.geometries_geometryid_seq OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 15663095)
-- Dependencies: 9
-- Name: relations; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE relations (
    conceptidfrom uuid NOT NULL,
    conceptidto uuid NOT NULL,
    relationtype text NOT NULL,
    relationid uuid NOT NULL
);


ALTER TABLE concepts.relations OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 15663101)
-- Dependencies: 3320 9
-- Name: values; Type: TABLE; Schema: concepts; Owner: postgres; Tablespace: 
--

CREATE TABLE "values" (
    valueid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    conceptid uuid NOT NULL,
    valuetype text NOT NULL,
    datatype text NOT NULL,
    value text NOT NULL,
    languageid text
);


ALTER TABLE concepts."values" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 15663108)
-- Dependencies: 3301 9
-- Name: vw_concepts; Type: VIEW; Schema: concepts; Owner: postgres
--

CREATE VIEW vw_concepts AS
    SELECT a.conceptid, get_preferred_label(a.conceptid) AS conceptlabel, a.legacyoid, b.name AS conceptschemename FROM concepts a, conceptschemes b WHERE (a.conceptschemeid = b.conceptschemeid) ORDER BY get_preferred_label(a.conceptid);


ALTER TABLE concepts.vw_concepts OWNER TO postgres;

SET search_path = data, pg_catalog;





--
-- TOC entry 229 (class 1259 OID 15663122)
-- Dependencies: 10
-- Name: strings; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE strings (
    entityid uuid NOT NULL,
    val text NOT NULL
);


ALTER TABLE data.strings OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 15663128)
-- Dependencies: 10
-- Name: dates; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE dates (
    entityid uuid NOT NULL,
    val timestamp without time zone NOT NULL
    -- val timestamp without time zone NOT NULL
);


ALTER TABLE data.dates OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 15663134)
-- Dependencies: 10
-- Name: numbers; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE numbers (
    entityid uuid NOT NULL,
    val numeric NOT NULL
);


ALTER TABLE data.numbers OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 15663140)
-- Dependencies: 10
-- Name: domains; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE domains (
    entityid uuid NOT NULL,
    val uuid
);


ALTER TABLE data.domains OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 15663143)
-- Dependencies: 3321 10
-- Name: entities; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE entities (
    entityid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    createtms timestamp without time zone NOT NULL,
    retiretms timestamp without time zone,
    entitytypeid text
);


ALTER TABLE data.entities OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 15663150)
-- Dependencies: 3322 10
-- Name: entity_types; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE entity_types (
    classid text NOT NULL,
    conceptid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    businesstablename text,
    publishbydefault boolean NOT NULL,
    icon text,
    defaultvectorcolor text,
    entitytypeid text NOT NULL,
    isresource boolean,
    groupid integer
);


ALTER TABLE data.entity_types OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 15663157)
-- Dependencies: 10 1600
-- Name: geometries; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE geometries (
    entityid uuid NOT NULL,
    geometry public.geometry(Geometry,4326)
);


ALTER TABLE data.geometries OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 15663171)
-- Dependencies: 10
-- Name: relations; Type: TABLE; Schema: data; Owner: postgres; Tablespace: 
--

CREATE TABLE relations (
    relationid integer NOT NULL,
    ruleid uuid NOT NULL,
    entityiddomain uuid NOT NULL,
    entityidrange uuid NOT NULL,
    notes text
);


ALTER TABLE data.relations OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 15663177)
-- Dependencies: 10 238
-- Name: relations_relationid_seq; Type: SEQUENCE; Schema: data; Owner: postgres
--

CREATE SEQUENCE relations_relationid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE data.relations_relationid_seq OWNER TO postgres;

--
-- TOC entry 3452 (class 0 OID 0)
-- Dependencies: 239
-- Name: relations_relationid_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: postgres
--

ALTER SEQUENCE relations_relationid_seq OWNED BY relations.relationid;


--
-- TOC entry 241 (class 1259 OID 15663200)
-- Dependencies: 3302 10 1600
-- Name: vw_resources; Type: VIEW; Schema: data; Owner: postgres
--

CREATE VIEW vw_resources AS
    SELECT row_number() OVER () AS geom_id, b.entityid AS resourceid, get_entitytypeid(b.entityid) AS rsrc_type, get_primaryname(b.entityid) AS p_name, get_attribute(b.entityid, 'SUMMARY.E62'::text) AS summary, a.geometry FROM ((SELECT recurse_up_relations(geometries.entityid) AS resourceid, geometries.geometry FROM geometries) a JOIN entities b ON ((a.resourceid = b.entityid)));


ALTER TABLE data.vw_resources OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 15663204)
-- Dependencies: 3303 10 1600
-- Name: vw_resources_line; Type: VIEW; Schema: data; Owner: postgres
--

CREATE VIEW vw_resources_line AS
    SELECT row_number() OVER () AS geom_id, b.entityid AS resourceid, get_entitytypeid(b.entityid) AS rsrc_type, get_primaryname(b.entityid) AS p_name, get_attribute(b.entityid, 'SUMMARY.E62'::text) AS summary, a.geometry FROM ((SELECT recurse_up_relations(geometries.entityid) AS resourceid, geometries.geometry FROM geometries) a JOIN entities b ON ((a.resourceid = b.entityid))) WHERE (public.st_geometrytype(a.geometry) = ANY (ARRAY['ST_MultiLineString'::text, 'ST_Linestring'::text]));


ALTER TABLE data.vw_resources_line OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 15663209)
-- Dependencies: 3304 10 1600
-- Name: vw_resources_point; Type: VIEW; Schema: data; Owner: postgres
--

CREATE VIEW vw_resources_point AS
    SELECT row_number() OVER () AS geom_id, b.entityid AS resourceid, get_entitytypeid(b.entityid) AS rsrc_type, get_primaryname(b.entityid) AS p_name, get_attribute(b.entityid, 'SUMMARY.E62'::text) AS summary, a.geometry FROM ((SELECT recurse_up_relations(geometries.entityid) AS resourceid, geometries.geometry FROM geometries) a JOIN entities b ON ((a.resourceid = b.entityid))) WHERE (public.st_geometrytype(a.geometry) = ANY (ARRAY['ST_MultiPoint'::text, 'ST_Point'::text]));


ALTER TABLE data.vw_resources_point OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 15663214)
-- Dependencies: 3305 1600 10
-- Name: vw_resources_poly; Type: VIEW; Schema: data; Owner: postgres
--

CREATE VIEW vw_resources_poly AS
    SELECT row_number() OVER () AS geom_id, b.entityid AS resourceid, get_entitytypeid(b.entityid) AS rsrc_type, get_primaryname(b.entityid) AS p_name, get_attribute(b.entityid, 'SUMMARY.E62'::text) AS summary, a.geometry FROM ((SELECT recurse_up_relations(geometries.entityid) AS resourceid, geometries.geometry FROM geometries) a JOIN entities b ON ((a.resourceid = b.entityid))) WHERE (public.st_geometrytype(a.geometry) = ANY (ARRAY['ST_MultiPolygon'::text, 'ST_Polygon'::text]));


ALTER TABLE data.vw_resources_poly OWNER TO postgres;

SET search_path = ontology, pg_catalog;

--
-- TOC entry 245 (class 1259 OID 15663261)
-- Dependencies: 11
-- Name: class_inheritance; Type: TABLE; Schema: ontology; Owner: postgres; Tablespace: 
--

CREATE TABLE class_inheritance (
    classid text NOT NULL,
    inheritsfrom text NOT NULL
);


ALTER TABLE ontology.class_inheritance OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 15663267)
-- Dependencies: 3326 11
-- Name: classes; Type: TABLE; Schema: ontology; Owner: postgres; Tablespace: 
--

CREATE TABLE classes (
    classid text NOT NULL,
    classname text NOT NULL,
    isactive boolean DEFAULT true NOT NULL,
    defaultbusinesstable text
);


ALTER TABLE ontology.classes OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 15663274)
-- Dependencies: 3327 11
-- Name: mapping_steps; Type: TABLE; Schema: ontology; Owner: postgres; Tablespace: 
--

CREATE TABLE mapping_steps (
    mappingid uuid NOT NULL,
    ruleid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    "order" integer NOT NULL,
    defaultvalue text
);


ALTER TABLE ontology.mapping_steps OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 15663281)
-- Dependencies: 3328 3329 11
-- Name: mappings; Type: TABLE; Schema: ontology; Owner: postgres; Tablespace: 
--

CREATE TABLE mappings (
    mappingid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    entitytypeidfrom text,
    entitytypeidto text,
    "default" boolean DEFAULT false NOT NULL,
    mergenodeid text
);


ALTER TABLE ontology.mappings OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 15663289)
-- Dependencies: 3330 11
-- Name: properties; Type: TABLE; Schema: ontology; Owner: postgres; Tablespace: 
--

CREATE TABLE properties (
    propertyid text NOT NULL,
    classdomain text NOT NULL,
    classrange text NOT NULL,
    propertydisplay text
);


ALTER TABLE ontology.properties OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 15663184)
-- Dependencies: 3325 11
-- Name: rules; Type: TABLE; Schema: ontology; Owner: postgres; Tablespace: 
--

CREATE TABLE rules (
    ruleid uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    entitytypedomain text,
    entitytyperange text,
    propertyid text NOT NULL
);


ALTER TABLE ontology.rules OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 15663296)
-- Dependencies: 3306 11
-- Name: vw_edges; Type: VIEW; Schema: ontology; Owner: postgres
--

CREATE VIEW vw_edges AS
    SELECT m.entitytypeidfrom AS assettype, ((m.entitytypeidfrom || ':'::text) || r.entitytypedomain) AS source, ((m.entitytypeidfrom || ':'::text) || r.entitytyperange) AS target, r.propertyid AS label FROM ((mapping_steps ms JOIN mappings m ON ((m.mappingid = ms.mappingid))) JOIN rules r ON ((r.ruleid = ms.ruleid))) ORDER BY m.entitytypeidfrom;


ALTER TABLE ontology.vw_edges OWNER TO postgres;



--
-- TOC entry 251 (class 1259 OID 15663301)
-- Dependencies: 3307 11
-- Name: vw_nodes; Type: VIEW; Schema: ontology; Owner: postgres
--

CREATE VIEW vw_nodes AS
    SELECT foo.assettype, foo.node AS label, ((foo.assettype || ':'::text) || foo.node) AS id FROM (SELECT m.entitytypeidfrom AS assettype, r.entitytypedomain AS node FROM ((mapping_steps ms JOIN mappings m ON ((m.mappingid = ms.mappingid))) JOIN rules r ON ((r.ruleid = ms.ruleid))) UNION SELECT m.entitytypeidfrom, r.entitytyperange AS node FROM ((mapping_steps ms JOIN mappings m ON ((m.mappingid = ms.mappingid))) JOIN rules r ON ((r.ruleid = ms.ruleid)))) foo ORDER BY foo.assettype;


ALTER TABLE ontology.vw_nodes OWNER TO postgres;

SET search_path = app_metadata, pg_catalog;


CREATE OR REPLACE VIEW concepts.vw_nodes AS 
 SELECT a.conceptid AS id, concepts.get_preferred_label(a.conceptid) AS label, b.name AS conceptschemename
   FROM concepts.concepts a, concepts.conceptschemes b
  WHERE a.conceptschemeid = b.conceptschemeid;

ALTER TABLE concepts.vw_nodes
  OWNER TO postgres;


CREATE OR REPLACE VIEW concepts.vw_edges AS 
 SELECT relations.conceptidfrom AS source, relations.relationtype AS label, relations.conceptidto AS target, 
        CASE
            WHEN relations.relationtype = 'has related concept'::text THEN 'undirected'::text
            ELSE 'directed'::text
        END AS type
   FROM concepts.relations;

ALTER TABLE concepts.vw_edges
  OWNER TO postgres;

--
-- TOC entry 3308 (class 2604 OID 15663306)
-- Dependencies: 209 208
-- Name: formid; Type: DEFAULT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY forms ALTER COLUMN formid SET DEFAULT nextval('forms_formid_seq'::regclass);


--
-- TOC entry 3309 (class 2604 OID 15663307)
-- Dependencies: 211 210
-- Name: id; Type: DEFAULT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY i18n ALTER COLUMN id SET DEFAULT nextval('i18n_id_seq'::regclass);


--
-- TOC entry 3310 (class 2604 OID 15663308)
-- Dependencies: 213 212
-- Name: informationthemeid; Type: DEFAULT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY information_themes ALTER COLUMN informationthemeid SET DEFAULT nextval('information_themes_informationthemeid_seq'::regclass);


--
-- TOC entry 3315 (class 2604 OID 15663309)
-- Dependencies: 216 215
-- Name: id; Type: DEFAULT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY maplayers ALTER COLUMN id SET DEFAULT nextval('maplayers_id_seq'::regclass);


--
-- TOC entry 3316 (class 2604 OID 15663310)
-- Dependencies: 218 217
-- Name: reportid; Type: DEFAULT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY reports ALTER COLUMN reportid SET DEFAULT nextval('reports_reportid_seq'::regclass);


--
-- TOC entry 3317 (class 2604 OID 15663311)
-- Dependencies: 220 219
-- Name: groupid; Type: DEFAULT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY resource_groups ALTER COLUMN groupid SET DEFAULT nextval('resource_groups_groupid_seq'::regclass);


SET search_path = data, pg_catalog;

--
-- TOC entry 3324 (class 2604 OID 15663313)
-- Dependencies: 239 238
-- Name: relationid; Type: DEFAULT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY relations ALTER COLUMN relationid SET DEFAULT nextval('relations_relationid_seq'::regclass);


SET search_path = app_metadata, pg_catalog;

--
-- TOC entry 3332 (class 2606 OID 15663315)
-- Dependencies: 206 206
-- Name: pk_appconfig; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY app_config
    ADD CONSTRAINT pk_appconfig PRIMARY KEY (name);


--
-- TOC entry 3334 (class 2606 OID 15663317)
-- Dependencies: 208 208
-- Name: pk_forms; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY forms
    ADD CONSTRAINT pk_forms PRIMARY KEY (formid);


--
-- TOC entry 3336 (class 2606 OID 15663319)
-- Dependencies: 210 210
-- Name: pk_i18n; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY i18n
    ADD CONSTRAINT pk_i18n PRIMARY KEY (id);


--
-- TOC entry 3340 (class 2606 OID 15663321)
-- Dependencies: 212 212
-- Name: pk_information_themes; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY information_themes
    ADD CONSTRAINT pk_information_themes PRIMARY KEY (informationthemeid);


--
-- TOC entry 3346 (class 2606 OID 15663323)
-- Dependencies: 215 215
-- Name: pk_maplayers; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY maplayers
    ADD CONSTRAINT pk_maplayers PRIMARY KEY (id);


--
-- TOC entry 3348 (class 2606 OID 15663325)
-- Dependencies: 217 217
-- Name: pk_reports; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY reports
    ADD CONSTRAINT pk_reports PRIMARY KEY (reportid);


--
-- TOC entry 3350 (class 2606 OID 15663327)
-- Dependencies: 219 219
-- Name: pk_resource_groups; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY resource_groups
    ADD CONSTRAINT pk_resource_groups PRIMARY KEY (groupid);


--
-- TOC entry 3338 (class 2606 OID 15663329)
-- Dependencies: 210 210 210 210 210
-- Name: unique_i18n; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY i18n
    ADD CONSTRAINT unique_i18n UNIQUE (key, value, languageid, widgetname);


--
-- TOC entry 3342 (class 2606 OID 15663331)
-- Dependencies: 212 212 212 212
-- Name: unique_information_themes; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY information_themes
    ADD CONSTRAINT unique_information_themes UNIQUE (name_i18n_key, displayclass, entitytypeid);


--
-- TOC entry 3344 (class 2606 OID 15663333)
-- Dependencies: 214 214 214
-- Name: unique_information_themes_x_forms; Type: CONSTRAINT; Schema: app_metadata; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY information_themes_x_forms
    ADD CONSTRAINT unique_information_themes_x_forms UNIQUE (formid, informationthemeid);


SET search_path = concepts, pg_catalog;

--
-- TOC entry 3352 (class 2606 OID 15663335)
-- Dependencies: 221 221
-- Name: pk_concepts; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY concepts
    ADD CONSTRAINT pk_concepts PRIMARY KEY (conceptid);


--
-- TOC entry 3356 (class 2606 OID 15663337)
-- Dependencies: 222 222
-- Name: pk_conceptschemes; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY conceptschemes
    ADD CONSTRAINT pk_conceptschemes PRIMARY KEY (conceptschemeid);


--
-- TOC entry 3358 (class 2606 OID 15663341)
-- Dependencies: 223 223
-- Name: pk_d_languages; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY d_languages
    ADD CONSTRAINT pk_d_languages PRIMARY KEY (languageid);


--
-- TOC entry 3360 (class 2606 OID 15663345)
-- Dependencies: 224 224
-- Name: pk_d_relationtypes; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY d_relationtypes
    ADD CONSTRAINT pk_d_relationtypes PRIMARY KEY (relationtype);


--
-- TOC entry 3404 (class 2606 OID 15664377)
-- Dependencies: 252 252
-- Name: pk_d_valuetypes; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY d_valuetypes
    ADD CONSTRAINT pk_d_valuetypes PRIMARY KEY (valuetype);


--
-- TOC entry 3362 (class 2606 OID 15663351)
-- Dependencies: 226 226 226 226 226
-- Name: pk_relations; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT pk_relations PRIMARY KEY (conceptidfrom, conceptidto, relationtype, relationid);


--
-- TOC entry 3364 (class 2606 OID 15663353)
-- Dependencies: 227 227
-- Name: pk_values; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "values"
    ADD CONSTRAINT pk_values PRIMARY KEY (valueid);


--
-- TOC entry 3354 (class 2606 OID 15663355)
-- Dependencies: 221 221 221
-- Name: uk_concepts; Type: CONSTRAINT; Schema: concepts; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY concepts
    ADD CONSTRAINT uk_concepts UNIQUE (conceptid, conceptschemeid);


SET search_path = data, pg_catalog;

--
-- TOC entry 3366 (class 2606 OID 15663357)
-- Dependencies: 229 229
-- Name: pk_strings; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY strings
    ADD CONSTRAINT pk_strings PRIMARY KEY (entityid);


--
-- TOC entry 3368 (class 2606 OID 15663359)
-- Dependencies: 230 230
-- Name: pk_dates; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY dates
    ADD CONSTRAINT pk_dates PRIMARY KEY (entityid);


--
-- TOC entry 3370 (class 2606 OID 15663361)
-- Dependencies: 231 231
-- Name: pk_numbers; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY numbers
    ADD CONSTRAINT pk_numbers PRIMARY KEY (entityid);


--
-- TOC entry 3372 (class 2606 OID 15663363)
-- Dependencies: 232 232
-- Name: pk_domain_values; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY domains
    ADD CONSTRAINT pk_domain_values PRIMARY KEY (entityid);


--
-- TOC entry 3375 (class 2606 OID 15663365)
-- Dependencies: 233 233
-- Name: pk_entities; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY entities
    ADD CONSTRAINT pk_entities PRIMARY KEY (entityid);


--
-- TOC entry 3377 (class 2606 OID 15663367)
-- Dependencies: 234 234
-- Name: pk_entity_types; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY entity_types
    ADD CONSTRAINT pk_entity_types PRIMARY KEY (entitytypeid);


--
-- TOC entry 3379 (class 2606 OID 15663369)
-- Dependencies: 235 235
-- Name: pk_geometries; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY geometries
    ADD CONSTRAINT pk_geometries PRIMARY KEY (entityid);

-- TOC entry 3383 (class 2606 OID 15663373)
-- Dependencies: 238 238
-- Name: pk_relations; Type: CONSTRAINT; Schema: data; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT pk_relations PRIMARY KEY (relationid);


SET search_path = ontology, pg_catalog;

--
-- TOC entry 3392 (class 2606 OID 15663377)
-- Dependencies: 245 245 245
-- Name: pk_class_inheritance; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY class_inheritance
    ADD CONSTRAINT pk_class_inheritance PRIMARY KEY (classid, inheritsfrom);


--
-- TOC entry 3394 (class 2606 OID 15663379)
-- Dependencies: 246 246
-- Name: pk_classes; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY classes
    ADD CONSTRAINT pk_classes PRIMARY KEY (classid);


--
-- TOC entry 3396 (class 2606 OID 15663381)
-- Dependencies: 247 247 247 247
-- Name: pk_mappings_x_rules; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY mapping_steps
    ADD CONSTRAINT pk_mappings_x_rules PRIMARY KEY (mappingid, ruleid, "order");


--
-- TOC entry 3402 (class 2606 OID 15663383)
-- Dependencies: 249 249
-- Name: pk_propertyid; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY properties
    ADD CONSTRAINT pk_propertyid PRIMARY KEY (propertyid);


--
-- TOC entry 3398 (class 2606 OID 15663385)
-- Dependencies: 248 248
-- Name: pk_relationships; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY mappings
    ADD CONSTRAINT pk_relationships PRIMARY KEY (mappingid);


--
-- TOC entry 3388 (class 2606 OID 15663387)
-- Dependencies: 240 240
-- Name: pk_rules; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY rules
    ADD CONSTRAINT pk_rules PRIMARY KEY (ruleid);


--
-- TOC entry 3390 (class 2606 OID 15663389)
-- Dependencies: 240 240 240 240
-- Name: uk_rules; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY rules
    ADD CONSTRAINT uk_rules UNIQUE (entitytypedomain, entitytyperange, propertyid);


--
-- TOC entry 3400 (class 2606 OID 15663391)
-- Dependencies: 248 248 248
-- Name: unique_mappings; Type: CONSTRAINT; Schema: ontology; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY mappings
    ADD CONSTRAINT unique_mappings UNIQUE (entitytypeidfrom, entitytypeidto);


SET search_path = data, pg_catalog;

--
-- TOC entry 3384 (class 1259 OID 15663396)
-- Dependencies: 238
-- Name: relations_entityiddomain_idx; Type: INDEX; Schema: data; Owner: postgres; Tablespace: 
--

CREATE INDEX relations_entityiddomain_idx ON relations USING btree (entityiddomain);


--
-- TOC entry 3385 (class 1259 OID 15663397)
-- Dependencies: 238
-- Name: relations_entityidrange_idx; Type: INDEX; Schema: data; Owner: postgres; Tablespace: 
--

CREATE INDEX relations_entityidrange_idx ON relations USING btree (entityidrange);


--
-- TOC entry 3386 (class 1259 OID 15663398)
-- Dependencies: 238 238 238
-- Name: relationships_uk; Type: INDEX; Schema: data; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX relationships_uk ON relations USING btree (entityiddomain, entityidrange);


SET search_path = ontology, pg_catalog;

--
-- TOC entry 3442 (class 2620 OID 15663400)
-- Dependencies: 1283 248
-- Name: tgr_validate_entitytypes_in_mappings; Type: TRIGGER; Schema: ontology; Owner: postgres
--

CREATE TRIGGER tgr_validate_entitytypes_in_mappings BEFORE INSERT ON mappings FOR EACH ROW EXECUTE PROCEDURE tgr_mappings_validation();


SET search_path = app_metadata, pg_catalog;

--
-- TOC entry 3405 (class 2606 OID 15663401)
-- Dependencies: 207 217 3347
-- Name: fk_entity_reports_x_reports; Type: FK CONSTRAINT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY entity_type_x_reports
    ADD CONSTRAINT fk_entity_reports_x_reports FOREIGN KEY (reportid) REFERENCES reports(reportid);


--
-- TOC entry 3406 (class 2606 OID 15663406)
-- Dependencies: 3376 234 207
-- Name: fk_entity_types_x_app_metadata_x_entity_type_x_reports; Type: FK CONSTRAINT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY entity_type_x_reports
    ADD CONSTRAINT fk_entity_types_x_app_metadata_x_entity_type_x_reports FOREIGN KEY (entitytypeid) REFERENCES data.entity_types(entitytypeid);


--
-- TOC entry 3408 (class 2606 OID 15663411)
-- Dependencies: 3333 214 208
-- Name: fk_information_themes_x_forms; Type: FK CONSTRAINT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY information_themes_x_forms
    ADD CONSTRAINT fk_information_themes_x_forms FOREIGN KEY (formid) REFERENCES forms(formid);


--
-- TOC entry 3409 (class 2606 OID 15663416)
-- Dependencies: 212 3339 214
-- Name: fk_information_themes_x_forms_x_information_themes; Type: FK CONSTRAINT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY information_themes_x_forms
    ADD CONSTRAINT fk_information_themes_x_forms_x_information_themes FOREIGN KEY (informationthemeid) REFERENCES information_themes(informationthemeid);


--
-- TOC entry 3407 (class 2606 OID 15663421)
-- Dependencies: 3376 234 212
-- Name: fk_informationthemes_x_entity_type; Type: FK CONSTRAINT; Schema: app_metadata; Owner: postgres
--

ALTER TABLE ONLY information_themes
    ADD CONSTRAINT fk_informationthemes_x_entity_type FOREIGN KEY (entitytypeid) REFERENCES data.entity_types(entitytypeid);


SET search_path = concepts, pg_catalog;

--
-- TOC entry 3416 (class 2606 OID 15663436)
-- Dependencies: 3351 221 227
-- Name: fk_concepts_x_values; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY "values"
    ADD CONSTRAINT fk_concepts_x_values FOREIGN KEY (conceptid) REFERENCES concepts(conceptid);


--
-- TOC entry 3410 (class 2606 OID 15663441)
-- Dependencies: 221 3355 222
-- Name: fk_conceptschemes_x_concepts; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY concepts
    ADD CONSTRAINT fk_conceptschemes_x_concepts FOREIGN KEY (conceptschemeid) REFERENCES conceptschemes(conceptschemeid);


--
-- TOC entry 3411 (class 2606 OID 15663446)
-- Dependencies: 226 221 3351
-- Name: fk_conceptsfrom_x_relations; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT fk_conceptsfrom_x_relations FOREIGN KEY (conceptidfrom) REFERENCES concepts(conceptid);


--
-- TOC entry 3412 (class 2606 OID 15663451)
-- Dependencies: 221 226 3351
-- Name: fk_conceptsto_x_relations; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT fk_conceptsto_x_relations FOREIGN KEY (conceptidto) REFERENCES concepts(conceptid);


--
-- TOC entry 3414 (class 2606 OID 15664371)
-- Dependencies: 3357 223 227
-- Name: fk_d_languages_values; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY "values"
    ADD CONSTRAINT fk_d_languages_values FOREIGN KEY (languageid) REFERENCES d_languages(languageid);


--
-- TOC entry 3413 (class 2606 OID 15663476)
-- Dependencies: 3359 224 226
-- Name: fk_relations_x_d_relationtypes; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT fk_relations_x_d_relationtypes FOREIGN KEY (relationtype) REFERENCES d_relationtypes(relationtype);


--
-- TOC entry 3415 (class 2606 OID 15664378)
-- Dependencies: 3403 252 227
-- Name: fk_valuetype_d_valuetype; Type: FK CONSTRAINT; Schema: concepts; Owner: postgres
--

ALTER TABLE ONLY "values"
    ADD CONSTRAINT fk_valuetype_d_valuetype FOREIGN KEY (valuetype) REFERENCES d_valuetypes(valuetype);


SET search_path = data, pg_catalog;

--
-- TOC entry 3423 (class 2606 OID 15663481)
-- Dependencies: 3393 234 246
-- Name: fk_classes_x_entity_types; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY entity_types
    ADD CONSTRAINT fk_classes_x_entity_types FOREIGN KEY (classid) REFERENCES ontology.classes(classid);


--
-- TOC entry 3424 (class 2606 OID 15663486)
-- Dependencies: 234 221 3351
-- Name: fk_concepts_x_entity_types; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY entity_types
    ADD CONSTRAINT fk_concepts_x_entity_types FOREIGN KEY (conceptid) REFERENCES concepts.concepts(conceptid);


--
-- TOC entry 3417 (class 2606 OID 15663491)
-- Dependencies: 3374 233 229
-- Name: fk_entities_strings; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY strings
    ADD CONSTRAINT fk_entities_strings FOREIGN KEY (entityid) REFERENCES entities(entityid);


--
-- TOC entry 3418 (class 2606 OID 15663496)
-- Dependencies: 233 230 3374
-- Name: fk_entities_dates; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY dates
    ADD CONSTRAINT fk_entities_dates FOREIGN KEY (entityid) REFERENCES entities(entityid);


--
-- TOC entry 3419 (class 2606 OID 15663501)
-- Dependencies: 231 233 3374
-- Name: fk_entities_numbers; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY numbers
    ADD CONSTRAINT fk_entities_numbers FOREIGN KEY (entityid) REFERENCES entities(entityid);


--
-- TOC entry 3421 (class 2606 OID 15663506)
-- Dependencies: 3374 233 232
-- Name: fk_entities_domains; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY domains
    ADD CONSTRAINT fk_entities_domains FOREIGN KEY (entityid) REFERENCES entities(entityid);


--
-- TOC entry 3426 (class 2606 OID 15663511)
-- Dependencies: 235 233 3374
-- Name: fk_entities_geometries; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY geometries
    ADD CONSTRAINT fk_entities_geometries FOREIGN KEY (entityid) REFERENCES entities(entityid);


--
-- TOC entry 3428 (class 2606 OID 15663516)
-- Dependencies: 238 233 3374
-- Name: fk_entities_relations_entitydomain; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT fk_entities_relations_entitydomain FOREIGN KEY (entityiddomain) REFERENCES entities(entityid);


--
-- TOC entry 3429 (class 2606 OID 15663521)
-- Dependencies: 238 233 3374
-- Name: fk_entities_relations_entityrange; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT fk_entities_relations_entityrange FOREIGN KEY (entityidrange) REFERENCES entities(entityid);


--
-- TOC entry 3422 (class 2606 OID 15663526)
-- Dependencies: 233 234 3376
-- Name: fk_entity_types_entities; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY entities
    ADD CONSTRAINT fk_entity_types_entities FOREIGN KEY (entitytypeid) REFERENCES entity_types(entitytypeid);


--
-- TOC entry 3425 (class 2606 OID 15663531)
-- Dependencies: 234 219 3349
-- Name: fk_entity_types_x_resource_groups; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY entity_types
    ADD CONSTRAINT fk_entity_types_x_resource_groups FOREIGN KEY (groupid) REFERENCES app_metadata.resource_groups(groupid);

--
-- TOC entry 3430 (class 2606 OID 15663546)
-- Dependencies: 238 240 3387
-- Name: fk_relations_x_rules; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY relations
    ADD CONSTRAINT fk_relations_x_rules FOREIGN KEY (ruleid) REFERENCES ontology.rules(ruleid);


--
-- TOC entry 3420 (class 2606 OID 15664383)
-- Dependencies: 3363 232 227
-- Name: fk_values_x_domains; Type: FK CONSTRAINT; Schema: data; Owner: postgres
--

ALTER TABLE ONLY domains
    ADD CONSTRAINT fk_values_x_domains FOREIGN KEY (val) REFERENCES concepts."values"(valueid);


SET search_path = ontology, pg_catalog;

--
-- TOC entry 3434 (class 2606 OID 15663551)
-- Dependencies: 246 3393 245
-- Name: fk_classes_class_inheritance_classid; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY class_inheritance
    ADD CONSTRAINT fk_classes_class_inheritance_classid FOREIGN KEY (classid) REFERENCES classes(classid);


--
-- TOC entry 3435 (class 2606 OID 15663556)
-- Dependencies: 245 246 3393
-- Name: fk_classes_class_inheritance_inheritsfrom; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY class_inheritance
    ADD CONSTRAINT fk_classes_class_inheritance_inheritsfrom FOREIGN KEY (inheritsfrom) REFERENCES classes(classid);


--
-- TOC entry 3440 (class 2606 OID 15663561)
-- Dependencies: 249 3393 246
-- Name: fk_classes_properties_classdomain; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY properties
    ADD CONSTRAINT fk_classes_properties_classdomain FOREIGN KEY (classdomain) REFERENCES classes(classid);


--
-- TOC entry 3441 (class 2606 OID 15663566)
-- Dependencies: 249 246 3393
-- Name: fk_classes_properties_classrange; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY properties
    ADD CONSTRAINT fk_classes_properties_classrange FOREIGN KEY (classrange) REFERENCES classes(classid);


--
-- TOC entry 3431 (class 2606 OID 15663571)
-- Dependencies: 3376 240 234
-- Name: fk_entity_types_entitytypedomain; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY rules
    ADD CONSTRAINT fk_entity_types_entitytypedomain FOREIGN KEY (entitytypedomain) REFERENCES data.entity_types(entitytypeid);


--
-- TOC entry 3432 (class 2606 OID 15663576)
-- Dependencies: 3376 240 234
-- Name: fk_entity_types_entitytyperange; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY rules
    ADD CONSTRAINT fk_entity_types_entitytyperange FOREIGN KEY (entitytyperange) REFERENCES data.entity_types(entitytypeid);


--
-- TOC entry 3438 (class 2606 OID 15663581)
-- Dependencies: 248 3376 234
-- Name: fk_mappings_x_entitytypefrom; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY mappings
    ADD CONSTRAINT fk_mappings_x_entitytypefrom FOREIGN KEY (entitytypeidfrom) REFERENCES data.entity_types(entitytypeid);


--
-- TOC entry 3439 (class 2606 OID 15663586)
-- Dependencies: 234 248 3376
-- Name: fk_mappings_x_entitytypeto; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY mappings
    ADD CONSTRAINT fk_mappings_x_entitytypeto FOREIGN KEY (entitytypeidto) REFERENCES data.entity_types(entitytypeid);


--
-- TOC entry 3433 (class 2606 OID 15663591)
-- Dependencies: 3401 240 249
-- Name: fk_properties_x_rules; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY rules
    ADD CONSTRAINT fk_properties_x_rules FOREIGN KEY (propertyid) REFERENCES properties(propertyid);


--
-- TOC entry 3436 (class 2606 OID 15663596)
-- Dependencies: 3397 248 247
-- Name: fk_relationships_x_relationships_mapping; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY mapping_steps
    ADD CONSTRAINT fk_relationships_x_relationships_mapping FOREIGN KEY (mappingid) REFERENCES mappings(mappingid);


--
-- TOC entry 3437 (class 2606 OID 15663601)
-- Dependencies: 247 3387 240
-- Name: fk_rules_x__mapping_steps; Type: FK CONSTRAINT; Schema: ontology; Owner: postgres
--

ALTER TABLE ONLY mapping_steps
    ADD CONSTRAINT fk_rules_x__mapping_steps FOREIGN KEY (ruleid) REFERENCES rules(ruleid);


-- Completed on 2014-01-31 13:29:27

--
-- PostgreSQL database dump complete
--

-- Function: concepts.insert_relation(text, text, text, text, text)

-- DROP FUNCTION concepts.insert_relation(text, text, text, text, text);

CREATE OR REPLACE FUNCTION concepts.insert_relation(p_conceptschemename1 text, p_legacyid1 text, p_relationtype text, p_conceptschemename2 text, p_legacyid2 text)
  RETURNS text AS
$BODY$

--!!! USE THIS FUNCTION WHEN EACH CONCEPT LIVE IN SEPERATE CONCEPTSCHEMES

    Declare 
    v_conceptschemeid1 uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename1);
    v_conceptschemeid2 uuid = (select conceptschemeid from concepts.conceptschemes where name = p_conceptschemename2);
    v_conceptidfrom uuid = null;
    v_conceptidto uuid = null;
    
BEGIN

    v_conceptidfrom = (select conceptid from concepts.concepts c
         where trim(legacyoid) = trim(p_legacyid1)
           and c.conceptschemeid = v_conceptschemeid1);
    v_conceptidto = (select conceptid from concepts.concepts c
         where trim(legacyoid) = trim(p_legacyid2)
           and c.conceptschemeid = v_conceptschemeid2);

  IF v_conceptidfrom is not null and v_conceptidto is not null and v_conceptidto <> v_conceptidfrom and v_conceptidfrom::text||v_conceptidto::text NOT IN (SELECT conceptidfrom::text||conceptidto::text FROM concepts.relations) then
    INSERT INTO concepts.relations(relationid, conceptidfrom, conceptidto, relationtype)
    VALUES (uuid_generate_v1mc(), v_conceptidfrom, v_conceptidto, p_relationtype);
    
    return 'success!';
  
  ELSE
    return 'fail! no relation inserted.';
  END IF;

END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION concepts.insert_relation(text, text, text, text, text)
  OWNER TO postgres;

  -- Function: ontology.insert_mapping(text, text, text, boolean, text)

-- DROP FUNCTION ontology.insert_mapping(text, text, text, boolean, text);

CREATE OR REPLACE FUNCTION ontology.insert_mapping(p_mapping text, p_entitytypefrom text, p_entitytypeto text, p_default boolean, p_mergenodeid text, p_conceptschemename text)
  RETURNS integer AS
$BODY$
DECLARE 
  v_domain text;
  v_property text;
  v_range text;
  v_mappingid text;
  v_index integer := 0;
  v_steps text[] := regexp_split_to_array(p_mapping, ',');
BEGIN 

    p_entitytypefrom = btrim(p_entitytypefrom);
    p_entitytypeto = btrim(p_entitytypeto);
    PERFORM data.insert_entitytype(p_entitytypefrom, '', 'True', '', '', p_entitytypefrom, p_conceptschemename, '', 'en-us', 'en-us', 'UNK', '');
    PERFORM data.insert_entitytype(p_entitytypeto, '', 'True', '', '', p_entitytypefrom, p_conceptschemename, '', 'en-us', 'en-us', 'UNK', '');
    v_mappingid = (SELECT ontology.populate_mappings(p_entitytypefrom, p_entitytypeto, p_default, p_mergenodeid));

    WHILE v_index < ((array_length(v_steps,1)-1)/2)
    LOOP
        v_domain = btrim(v_steps[(v_index*2)+1]);
        v_property = btrim(v_steps[(v_index*2+1)+1]);
        v_range = btrim(v_steps[(v_index*2+2)+1]);
        
        PERFORM data.insert_entitytype(v_domain, '', 'True', '', '', p_entitytypefrom, p_conceptschemename, '', 'en-us', 'en-us', 'UNK', '');
        PERFORM data.insert_entitytype(v_range, '', 'True', '', '', p_entitytypefrom, p_conceptschemename, '', 'en-us', 'en-us', 'UNK', '');
        PERFORM ontology.populate_rules(v_domain, v_property, v_range);
        PERFORM ontology.populate_mapping_steps(v_mappingid, v_domain, v_property, v_range, p_entitytypefrom, p_entitytypeto, v_index+1);  

        raise notice 'mapping step: % % %',v_domain, v_property, v_range;
        v_index := v_index + 1;

    END LOOP;
  
    RETURN v_index;

END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION ontology.insert_mapping(text, text, text, boolean, text)
  OWNER TO postgres;
