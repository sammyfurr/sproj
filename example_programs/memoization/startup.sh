gcc -g -o memo memo.c
rr record ./memo
python3 rrtranslation.py $1
