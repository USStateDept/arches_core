#!/bin/bash

# Check to see if we are in our own dir or not
# Very brittle, should be improved
if [ ! -d "build" ]; then
    cd ..
fi
source virtualenv/ENV/bin/activate

echo "Building static output files"
python ../manage.py build --operation build

deactivate
