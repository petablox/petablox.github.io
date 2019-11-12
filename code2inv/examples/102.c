
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
if ( (n >= 0) )
assert( (x == n) );

}

/*
invariant:  ( ( n<0 ) || ( n>=0-0 ) ) && ( ( n>0-1 ) || ( n<=0 ) ) && ( ( n<0 ) || ( n>=x ) )

#calls to z3: 13
#tests on pre: 2084
#tests on inductive: 989
#tests on post: 630
*/
