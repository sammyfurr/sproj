gcc -g -o hash hash.c
rr record ./hash
python3 rrtranslation.py $1
