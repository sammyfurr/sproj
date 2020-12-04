#include <stdio.h>

int main (int argc, char **argv) {
  char x [16];

  if (argc < 2){
    printf("Usage: ./greet <name>\n");
    return 1;
  }

  // Input given is "will_this_crash_the_code?"
  sscanf(argv[1], "%s", x);

  // Break at line 15 and examine the stack using the command:
  // x/50cb $sp
  printf("Hello %s!", x);
  return 0;
}
