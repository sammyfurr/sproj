#include <stdlib.h>
#include <stdio.h>
#include <time.h>

#define HASHSIZE 100

struct pair {
  struct pair *next;
  int key;
  int value;
};

static struct pair *hashtable[HASHSIZE];

unsigned hash (int k)
{
  return k % HASHSIZE;
}

struct pair *search(int k)
{
  struct pair *pp;

  for (pp = hashtable[hash(k)]; pp != NULL; pp = pp->next)
    if (k == pp->key)
      return pp;
  return NULL;
}

struct pair *insert(int key, int value)
{
  struct pair *pp;
  unsigned hashval;

  if ((pp = search(key)) == NULL) {
    pp = (struct pair *) malloc(sizeof(*pp));
    if (pp == NULL)
      return NULL;
    pp->key = key;
    hashval = hash(key);
    pp->next = hashtable[hashval];
    hashtable[hashval] = pp;
  } 
  pp->value = value;
  return pp;
}

int fib_rec (int n){
  if (n < 0)
    return -1;
  if (n == 0 || n == 1)
    return n;
  return fib_rec(n - 1) + fib_rec (n - 2);
}

int fib_itr (int n) {
  int a = 0;
  int b = 1;
  for (int x = 0; x < n; x ++){
    int t = a;
    a = b;
    b = t + b;
  }
  return a;
}

int fib_memo (int n) {
  if (n < 0)
    return -1;
  if (n == 0 || n == 1)
    return n;
  struct pair *pp = search(n);
  if (pp != NULL){
    return pp->value;
  }
  pp = insert(n, fib_memo(n - 1) + fib_memo (n - 2));
  return pp->value;
}

double timer(int (f)(int), int i, int *result){
  clock_t start = clock();
  *result = f(i);
  clock_t finish = clock();
  return (double)(finish - start) / CLOCKS_PER_SEC;
}

int main(){
  int term = 30;
  int fr, fi, fm;
  double tfr, tfi, tfm;
  tfr = timer(&fib_rec, term, &fr);
  tfi = timer(&fib_itr, term, &fi);
  tfm = timer(&fib_memo, term, &fm);
  printf("Fib recursive: time=%f result=%d\nFib iterative: time=%f result=%d\nFib memoization: time=%f result=%d\n",
	 tfr, fr, tfi, fi, tfm, fm);
}
