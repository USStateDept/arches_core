cd %~dp0..
call "virtualenv/ENV/Scripts/activate.bat"

rem "Install packages defined in settings.py"
python ../manage.py packages --operation install

call "virtualenv/ENV/Scripts/deactivate.bat"
pause