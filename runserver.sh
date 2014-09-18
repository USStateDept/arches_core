#!/bin/bash

# Start ElasticSearch
chmod u+x "archesproject/arches/Search/engines/elasticsearch-0.90.3/bin/elasticsearch.in.sh"
source "archesproject/arches/Search/engines/elasticsearch-0.90.3/bin/elasticsearch.in.sh"
chmod u+x "archesproject/arches/Search/engines/elasticsearch-0.90.3/bin/elasticsearch"
./archesproject/arches/Search/engines/elasticsearch-0.90.3/bin/elasticsearch

# Start django
source "archesproject/virtualenv/ENV/bin/activate"
python manage.py runserver
