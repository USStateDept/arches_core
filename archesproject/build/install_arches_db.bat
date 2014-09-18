cd %~dp0..
call "virtualenv/ENV/Scripts/activate.bat"

rem "Setting up base path locations for db scripts"
python ../manage.py build --operation install

rem "Installing the database"
call "db/Deployment Scripts/Restore.bat"

call "virtualenv/ENV/Scripts/deactivate.bat"
pause