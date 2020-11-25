#include <string.h>
#include <stdlib.h>
#include <stdio.h>

#define HASHSIZE 101

struct pair {
  struct pair *next;
  char *key;
  char *value;
};

static struct pair *hashtable[HASHSIZE];

unsigned hash (char *s)
{
  unsigned hashval;
  for (hashval = 0; *s != '\0'; s++)
    hashval = *s + 31 * hashval;
  return hashval % HASHSIZE;
}

struct pair *search(char *s)
{
  struct pair *pp;

  for (pp = hashtable[hash(s)]; pp != NULL; pp = pp->next)
    if (strcmp(s, pp->key) == 0)
      return pp;
  return NULL;
}

/* The bug here is that they forget to use strdup */
struct pair *insert(char *key, char *value)
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
  } else {
    free((void *) pp->value);
  }
  pp->value = value;
  return pp;
}

#define BUFFSIZE 1024

int main() {
  char * fname = "names";
  FILE * f = fopen(fname, "r");
  if (f == NULL){
    printf("Error opening file: %s\n", fname);
    return 1;
  }

  char kb[BUFFSIZE];
  char vb[BUFFSIZE];
  
  while(fgets(kb, BUFFSIZE, f) != NULL && fgets(vb, BUFFSIZE, f) != NULL){
    /* Strip out newline */
    kb[strcspn(kb, "\n")] = 0;
    vb[strcspn(vb, "\n")] = 0;
    
    if(insert(kb, vb) == NULL){
      printf("Error inserting pair: %s, %s\n", kb, vb);
      return 1;
    }

    printf("Inserted pair: %s, %s\n", kb, vb);
  }

  rewind(f);

  char ignore[BUFFSIZE];
  while(fgets(kb, BUFFSIZE, f) != NULL && fgets(ignore, BUFFSIZE, f) != NULL){
    /* Strip out newline */
    kb[strcspn(kb, "\n")] = 0;
    
    struct pair *pp = search(kb);
    if(pp == NULL)
      printf("Couldn't find key: %s\n", kb);
    else
      printf("Value in hashtable: %s, %s\n", pp->key, pp->value);
  }
  
  return 0;
}
