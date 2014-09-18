cd %~dp0..
call "virtualenv/ENV/Scripts/activate.bat"

python ../manage.py build --operation build

call "virtualenv/ENV/Scripts/deactivate.bat"
pause