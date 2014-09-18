:: Start ElasticSearch
start %~dp0"/archesproject/arches/Search/engines/elasticsearch-0.90.3/bin/elasticsearch.bat"

:: Start django
call "archesproject/virtualenv/ENV/Scripts/activate.bat"
python manage.py runserver

pause