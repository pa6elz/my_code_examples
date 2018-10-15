/* Task:

In a grid of 7 by 7 squares you want to place a skyscraper in each square with only some clues:

The height of the skyscrapers is between 1 and 7
No two skyscrapers in a row or column may have the same number of floors
A clue is the number of skyscrapers that you can see in a row or column from the outside
Higher skyscrapers block the view of lower skyscrapers located behind them
Can you write a program that can solve this puzzle in time?*/

function skyscrappers7x7(clues) {
    //quite huge amount of code is an attempt to make it work superfast
    var SIZE = 7;

    //fill the clues-pairs, 0-index consist horizontal clues, 1-index vertical
    var buildingsVisibilities = [[], []];
    for (var i = 0; i < SIZE; i++) {
        buildingsVisibilities[0].push('' + clues[SIZE * 4 - 1 - i] + clues[SIZE + i]);
        buildingsVisibilities[1].push('' + clues[i] + clues[SIZE * 3 - 1 - i]);
    }

    //for every clue-pair summary consist list of possible lines
    //and indexes for a fast check of crossing streets
    var summary = {};
    buildingsVisibilities.forEach(v => v.forEach(
        v => summary[v] = {lines: [], indexes: null})
    );

    var middleValue = 7;
    var row = [,0,0,0,1,1,1,0];
    var ThreeDigitsCombs = [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]];

    // get all the combinations and put them to summary
    while(middleValue) {
        parts = [[], []];
        for (var i = 1; i < 7; i++) parts[row[i]].push(i < middleValue ? i : i + 1);

        for (k = 0; k < 6; k++) {
            var comb = ThreeDigitsCombs[k];
            var part1 = [parts[0][comb[0]], parts[0][comb[1]], parts[0][comb[2]]];

            for (let j = 0; j < 6; j++) {
                comb = ThreeDigitsCombs[j];
                if(part1[2] > parts[1][comb[0]]) continue;

                var lines = [
                    [part1[0], part1[1], part1[2], middleValue,
                        parts[1][comb[0]], parts[1][comb[1]], parts[1][comb[2]]
                    ]];

                lines.push( //reverse
                    [lines[0][6], lines[0][5], lines[0][4], lines[0][3],
                        lines[0][2], lines[0][1], lines[0][0]]);

                var maxFloors = [0, 0], visibleBuildings = [0, 0];

                //count visibilities keys for a line
                for (var i = 0; i < 7; i++) {
                    for(var h = 0; h < 2; h++) {
                        maxFloors[h] = Math.max(maxFloors[h], lines[h][i]);
                        visibleBuildings[h] += maxFloors[h] === lines[h][i];
                    }
                }

                for (var i = 0; i < 2; i++) {
                    ['00',
                        '0' + visibleBuildings[1 - i],
                        '' + visibleBuildings[i] + '0',
                        '' + visibleBuildings[i] + visibleBuildings[1 - i]
                    ].forEach(key =>
                        {if(summary[key]) summary[key].lines.push(lines[i]);}
                    );
                }
            }
        }

        var cnt = 1;
        while (row[pos = (last = parts[0].pop()) + (last < middleValue)] === 0) cnt++;

        if(pos) {
            for (var i = 0; i < 8 - pos; i++) {
                row[i + pos - 1] = Number(i < 1 || i > cnt);
            }
        } else {
            middleValue--;
            row = [,0,0,0,1,1,1,0];
        }
    }

    //we should find the side (x or z) with less counts of variants
    //and also order lines in variants count increasing, which immensely saves time
    var axesVariantsCounts = [[], []];
    var axes = buildingsVisibilities.map((v, k) =>
        v.map( (v, ind) => {
            axesVariantsCounts[k].push(summary[v].lines.length * 10 + ind);
            return summary[v];} ));

    axesVariantsCounts.forEach(v => v.sort((a, b) => a - b));
    var variantsCounts = axesVariantsCounts.map(
        v => Math.floor(v[0] / 10) * Math.floor(v[1] / 10) * Math.floor(v[2] / 10));

    //here we determine wich axis - x or y - will be main
    var mainAxisInd = Number(variantsCounts[0] > variantsCounts[1]);
    var subAxisInd = 1 - mainAxisInd;

    var axMain = axes[mainAxisInd];
    var axSub = axes[subAxisInd];

    var subBuildingsVisibilities = buildingsVisibilities[subAxisInd];

    var fGetUnique = function (arr) {
        var k, v, sets = [new Set, new Set, new Set, new Set, new Set, new Set, new Set];
        arr.forEach(v => {for(k in v) sets[k].add(v[k]);});

        return sets;
    }

    var variantsOrder = axesVariantsCounts[mainAxisInd].map(v => v % 10);

    //here we create indexes according the order, sets will have unique set of
    //possible floors on each position for primary filter of lines
    for(sumInd in summary) {
        if(!subBuildingsVisibilities.includes(sumInd)) continue;

        var summaryItem = summary[sumInd];

        if(sumInd !== '00')
            summaryItem.sets = fGetUnique(summaryItem.lines, variantsOrder);

        summaryItem.indexes = new Set;
        for(ind in summaryItem.lines) {
            line = summaryItem.lines[ind];

            var searchKey = '';
            for (var i = 0; i < SIZE; i++) {
                summaryItem.indexes.add(searchKey += line[variantsOrder[i]]);
            }
        }
    }

    //make a primary filter excluding lines which can not be in area
    var primarySearchSets = axMain.map((v, i) => v.lines.filter(
        v => v.every((v, k) => !axSub[k].sets || axSub[k].sets[i].has(v))
    ));

    var searchKeys = ['', '', '', '', '', '', ''];
    var streets = [null, null, null, null, null, null, null];

    var searchSets = {};

    //preparation finished...now we start main work
    var ind = 0, line, street;
    while(ind > -1) {
        if(!streets[ind]) {
            var searchSet = searchSets[ind] || primarySearchSets[variantsOrder[ind]];
            var lines = searchSet.filter(v => v.every((v, k) => axSub[k].indexes.has(searchKeys[k] + v)));

            streets[ind] = street = {lines: lines, count: lines.length, index: -1};

            if(street.count > 5 && ind < SIZE - 1) {
                var values = fGetUnique(street.lines);
                searchSets[ind + 1] = primarySearchSets[variantsOrder[ind + 1]].filter(
                    v => v.every( (v, k) => Array.from(values[k]).some(
                            v2 => axSub[k].indexes.has(searchKeys[k] + v2 + v)
                )));

                if(searchSets[ind + 1].length === 0) street.count = 0;
            } else searchSets[ind + 1] = null;
        } else street = streets[ind];

        if(++street.index >= street.count) {
            streets[ind--] = null;
        } else if(ind === SIZE - 1) {
            var streets = streets.map(v => v.lines[v.index]);
            var lines = [,,,,,,];
            variantsOrder.forEach((v, k) => lines[v] = streets[k]);

            if(mainAxisInd === 0) return lines

            return [0,1,2,3,4,5,6].map(ind => lines.map(v => v[ind]));
        } else {
            line = street.lines[street.index];

            for(i = 0; i < SIZE; i++) searchKeys[i] = searchKeys[i].substr(0, ind) + line[i];
            ind ++;
        }
    }

    return null;
}