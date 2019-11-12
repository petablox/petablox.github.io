
int main()
{
    int x = 1;
    int m = 1;
    int n;

    while (x < n) {
        if (unknown()) {
            m = x;
        }
        x = x + 1;
    }

    if(n > 1) {
       assert (m < n);
       //assert (m >= 1);
    }
}

/*
invariant:
( ( x<=1+1 ) || ( x>1+1 ) ) && ( ( n>1 ) || ( x>1-1 ) ) && ( ( n<=1 ) || ( n>=1+m ) )

#calls to z3: 30
#tests on pre: 93421
#tests on inductive: 238106
#tests on post: 25856
*/

// found a solution for 41 , sol:
// z3_report time: 3467.66 pid: 41 stats: Counter({'ce-I:': 238106, 'z3_pre': 100250, 'ce-T:': 93421, 'ce-F:': 25856, 'boogie_result': 15578, 'actual_z3': 30})
