/*Task: 

Write function square_sums_row (squareSumsRow is also allowed in JS) that, given integer number N (in range 2..1000, except 780), returns array of integers 1..N arranged in a way, so sum of each 2 consecutive numbers is a square.

Solution is valid if and only if following two criterias are met:

Each number in range 1..N is used once and only once.
Sum of each 2 consecutive numbers is a perfect square.

If there is no solution, return false (empty vector in C++). For example if N=5, then numbers 1,2,3,4,5 cannot be put into square sums row: 1+3=4, 4+5=9, but 2 has no pairs and cannot link [1,3] and [4,5]

Hint: if execution of the function takes more than 100 ms, you might want to try something else: there are >200 tests, and you have only 12 seconds.
*/
function square_sums_row(N) {

    var numbers = [0];

    for (var i = 1; i <= N ; i++)
        numbers[i] = {number: i, beenUsed: 0, usedCount: 0, numbers: []};

    for(i = 2, sq = i * i; sq < N * 2; sq = ++i * i) {
        for(v1 = Math.max(sq - N, 1); v1 < sq / 2; v1++) {
            v2 = sq - v1;
            numbers[v1].numbers.push(numbers[v2]);
            numbers[v2].numbers.push(numbers[v1]);
        }
    }

    numbers.shift();

    var fSort = function (a, b) {
        return a.numbers.length - a.usedCount - b.numbers.length + b.usedCount
            || +(level < 400) && a.numbers.length - b.numbers.length;
    }

    var levels = [], level = 0, num;
    while(level > -1 && level < N) {
        var currentLevel = levels[level] ||
            (levels[level] = {variants: numbers.sort(fSort), variantInd: -1});

        if(num = currentLevel.number) {
            num.beenUsed = 0;
            num.numbers.forEach(v=>v.usedCount--);
        }

        if(num = currentLevel.number = currentLevel.variants[++currentLevel.variantInd]) {
            num.beenUsed = 1;
            numbers = num.numbers.filter(v=>{v.usedCount++; return !v.beenUsed;})
        } else numbers = [];

        levels.length = 1 + (level += (numbers.length > 0 || level == N - 1) - !num);
    }

    return level == N && !levels.pop() && levels.map(v => v.number.number);
}
