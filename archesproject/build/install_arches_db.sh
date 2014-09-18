#!/bin/bash

# Check to see if we are in our own dir or not
# Very brittle, should be improved
if [ ! -d "build" ]; then
    cd ..
fi
source virtualenv/ENV/bin/activate

echo "Setting up base path locations for db scripts"
python ../manage.py build --operation install

echo "Installing the database"
chmod u+x db/Deployment\ Scripts/Restore.sh
db/Deployment\ Scripts/Restore.sh

deactivate
