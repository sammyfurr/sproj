#include <stdlib.h>
#include <stdio.h>

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

/* The bug here is that they forget to use strdup */
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

int main(){
  int term = 30;
  
  printf("Fib recursive: %d\nFib iterative: %d\nFib memoization: %d\n",
	 fib_rec(term), fib_itr(term), fib_memo(term));
}
