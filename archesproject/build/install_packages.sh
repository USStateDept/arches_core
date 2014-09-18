#!/bin/bash

# Check to see if we are in our own dir or not
# Very brittle, should be improved
if [ ! -d "build" ]; then
    cd ..
fi
source virtualenv/ENV/bin/activate

echo "Install packages defined in settings.py"
python ../manage.py packages --operation install

deactivate
