cd /vagrant/archesproject/Install
chmod u+x ./ubuntu_precise_setup.sh
./ubuntu_precise_setup.sh

cd /vagrant/archesproject/arches/Search/engines/elasticsearch-0.90.3/bin
chmod u+x ./elasticsearch.in.sh
./elasticsearch.in.sh
chmod u+x elasticsearch
./elasticsearch

cd /vagrant/archesproject/Install
chmod u+x ./install_dependencies.sh
./install_dependencies.sh

cd /vagrant/archesproject/build
chmod u+x ./build_core_arches.sh
chmod u+x ./install_packages.sh
./build_core_arches.sh
./install_packages.sh
