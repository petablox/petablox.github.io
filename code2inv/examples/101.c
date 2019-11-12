
int main() {
  // variable declarations
  int n;
  int x;
  // pre-conditions
  (x = 0);
  // loop body
  while ((x < n)) {
    {
    (x  = (x + 1));
    }

  }
  // post-condition
if ( (x != n) )
assert( (n < 0) );

}


/*
invariant: ( n>x-1 ) || ( x<x-n )

#calls to z3: 12
#tests on pre: 203
#tests on inductive: 28
#tests on post: 43
*/
