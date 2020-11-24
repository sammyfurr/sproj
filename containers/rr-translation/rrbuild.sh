git clone https://github.com/mozilla/rr.git
mkdir obj && cd obj
cmake ../rr
make -j20
make install
