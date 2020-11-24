gcc -g -o cat cat.c
rr record ./cat cat.c cat.c
hostname -I
python3 rrtranslation.py $1
