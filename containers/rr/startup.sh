gcc -g -o cat cat.c
rr record ./cat cat.c test.py
hostname -I
python3 rrtranslation.py $1
