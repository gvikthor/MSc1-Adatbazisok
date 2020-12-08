var testSet = [[1, 3], [1, 5], [2, 9], [3, 11], [4, 4], [5, 1], [6, 1], [6, 2], [6, 6], [6, 12], [7, 11], [8, 10], [9, 9], [10, 7], [11, 9], [12, 6]];
function dominates(item1, item2) {
    var result = true;
    for (var i = 0; i < item1.length && result; i++) {
        result = result && (item1[i] >= item2[i]);
    }
    return result;
}
function probe(item, dimensionBoundaries) {
    dimensionBoundaries = dimensionBoundaries ? dimensionBoundaries : [3, 6];
    return dominates(item, dimensionBoundaries) ? 1 : 0;
}
function classifyChain(chain) {
    var _a, _b;
    var result = { label0: [], label1: [] };
    while (chain.length != 0) {
        var probedIndex = Math.round(chain.length / 2) - 1;
        var probedValue = probe(chain[probedIndex]);
        if (probedValue === 0) {
            (_a = result.label0).push.apply(_a, chain.slice(0, probedIndex + 1));
            chain = chain.slice(probedIndex + 1);
        }
        else {
            (_b = result.label1).push.apply(_b, chain.slice(probedIndex));
            chain = probedIndex === 0 ? [] : chain.slice(0, probedIndex);
        }
    }
    return result;
}
function chainDecomposBased(chains) {
    var result = { label0: [], label1: [] };
    chains.map(function (item) {
        var _a, _b;
        var subClassified = classifyChain(item);
        (_a = result.label0).push.apply(_a, subClassified.label0);
        (_b = result.label1).push.apply(_b, subClassified.label1);
    });
    return result;
}
function testChainDecomposBased() {
    var chains = [
        [[1, 3], [1, 5], [2, 9], [3, 11], [6, 12]],
        [[7, 11]],
        [[4, 4], [6, 6], [8, 10]],
        [[12, 6]],
        [[9, 9]],
        [[5, 1], [6, 1], [6, 2], [10, 7], [11, 9]]
    ];
    console.log(JSON.stringify(chainDecomposBased(chains)));
}
function rpeCore(set, probedIndex, dimensionBoundaries, noiseIndices) {
    var result = { label0: [], label1: [] };
    var probedValue = probe(set[probedIndex], dimensionBoundaries);
    if (noiseIndices && noiseIndices.includes(probedIndex)) {
        probedValue = probedValue === 0 ? 1 : 0;
    }
    var newSet = new Array();
    if (probedValue === 0) {
        set.map(function (item) {
            if (dominates(set[probedIndex], item)) {
                result.label0.push(item);
            }
            else {
                newSet.push(item);
            }
        });
    }
    else {
        set.map(function (item) {
            if (dominates(item, set[probedIndex])) {
                result.label1.push(item);
            }
            else {
                newSet.push(item);
            }
        });
    }
    return { result: result, setRemainder: newSet };
}
function randomProbeEllimination(set, dimensionBoundaries, noiseIndices) {
    var _a, _b;
    var result = { label0: [], label1: [] };
    var probeCount = 0;
    while (set.length != 0) {
        var probedIndex = Math.round(Math.random() * (set.length - 1));
        var partialResults = rpeCore(set, probedIndex, dimensionBoundaries, noiseIndices);
        (_a = result.label0).push.apply(_a, partialResults.result.label0);
        (_b = result.label1).push.apply(_b, partialResults.result.label1);
        set = partialResults.setRemainder;
        probeCount++;
    }
    return { result: result, probeCount: probeCount };
}
function randomProbeElliminationPerm(set, noiseIndices) {
    var _a, _b;
    var result = { label0: [], label1: [] };
    set = set.sort(function () { return 0.5 - Math.random(); });
    while (set.length != 0) {
        var partialResults = rpeCore(set, 0, noiseIndices);
        (_a = result.label0).push.apply(_a, partialResults.result.label0);
        (_b = result.label1).push.apply(_b, partialResults.result.label1);
        set = partialResults.setRemainder;
    }
    return result;
}
function countError(sorted, dimensionBoundaries) {
    var result = 0;
    sorted.label0.forEach(function (value) {
        if (probe(value, dimensionBoundaries) !== 0) {
            result++;
        }
    });
    sorted.label1.forEach(function (value) {
        if (probe(value, dimensionBoundaries) !== 1) {
            result++;
        }
    });
    return result;
}
function generateRandomTestSet(dimensions, maxValue, itemCount) {
    var testSet = [];
    for (var i = 0; i < itemCount; i++) {
        var item = [];
        for (var j = 0; j < dimensions; j++) {
            item.push(Math.round(Math.random() * maxValue));
        }
        testSet.push(item);
    }
    return testSet;
}
function testRPEWithNoise(dimensions, maxValue, itemCount, noiseCount, dimensionBoundariesGenerator, testSetGenerator, noiseIndicesGenerator) {
    var testSet = testSetGenerator(dimensions, maxValue, itemCount);
    var noiseIndices = noiseIndicesGenerator(noiseCount, itemCount);
    var dimBounds = dimensionBoundariesGenerator(dimensions, maxValue);
    var sorted = randomProbeEllimination(testSet, dimBounds, noiseIndices);
    var failCount = countError(sorted.result, dimBounds);
    return { failCount: failCount, probeCount: sorted.probeCount };
}
function randomDimBounds(dimensions, maxValue) {
    var dimBounds = [];
    for (var i = 0; i < dimensions; i++) {
        dimBounds.push(Math.round(Math.random() * maxValue));
    }
    return dimBounds;
}
function medianDimBounds(dimensions, maxValue, deviationPercentage) {
    var dimBounds = [];
    for (var i = 0; i < dimensions; i++) {
        var index = Math.round(maxValue / 2 + (Math.random() - 0.5) * 2 * deviationPercentage / 100 * maxValue);
        dimBounds.push(index);
    }
    return dimBounds;
}
function shiftedDimBounds(dimensions, maxValue, deviationPercentage, shiftPercentage) {
    var dimBounds = [];
    for (var i = 0; i < dimensions; i++) {
        var index = Math.round((maxValue / 2) + (maxValue * (shiftPercentage / 100)) + (Math.random() - 0.5) * 2 * deviationPercentage / 100 * maxValue);
        dimBounds.push(index);
    }
    return dimBounds;
}
function randomNoiseIndices(noiseCount, itemCount) {
    var noiseIndices = [];
    while (noiseIndices.length !== noiseCount) {
        var randomIndex = Math.round(Math.random() * itemCount);
        if (!noiseIndices.includes(randomIndex)) {
            noiseIndices.push(randomIndex);
        }
    }
    return noiseIndices;
}
function runTest(matrixCount, iterationCount, noiseLevelLimit, itemCount, dimensionCount, maxValue, dimBoundShift, dimBoundDev) {
    var text = "";
    var avgProbeCount = 0;
    var _loop_1 = function () {
        text += "Test set, " + dimensionCount + " dimensions, " + itemCount + " items with max value of " + maxValue + " : \n";
        var testSet_1 = generateRandomTestSet(dimensionCount, maxValue, itemCount);
        text += JSON.stringify(testSet_1) + "\n";
        text += "Dimensional bounds at " + (50 + dimBoundShift) + "%,  " + dimBoundDev + "% deviation, random noise indices from 1 to " + noiseLevelLimit + " \n";
        testResults = {};
        for (var i = 0; i < iterationCount; i++) {
            var _loop_2 = function (j) {
                0;
                var dbgen = function () { return shiftedDimBounds(dimensionCount, maxValue, dimBoundDev, dimBoundShift); };
                var noisegen = function () { return randomNoiseIndices(j, itemCount); };
                var test = testRPEWithNoise(dimensionCount, maxValue, itemCount, j, dbgen, function () { return testSet_1; }, noisegen);
                var testError = test.failCount;
                if (!testResults[j]) {
                    testResults[j] = { error: (testError / itemCount) * 100, probeCount: test.probeCount };
                }
                else {
                    testResults[j].error += (testError / itemCount) * 100;
                    testResults[j].probeCount += test.probeCount;
                }
            };
            for (var j = 1; j <= noiseLevelLimit; j++) {
                _loop_2(j);
            }
        }
        Object.entries(testResults).forEach(function (item) {
            text += "Average error percentage on " + item[0] + " noise level : " + (item[1].error / iterationCount).toFixed(4) + "%\n";
            avgProbeCount += Math.round(item[1].probeCount / iterationCount);
        });
        avgProbeCount = avgProbeCount / matrixCount;
        text += "Average probe count: " + Math.round(avgProbeCount) + " \n";
        text += "\n";
    };
    var testResults;
    for (var mc = 0; mc < matrixCount; mc++) {
        _loop_1();
    }
    return text;
}
var results = [];
var currentPage = 0;
function runTestFromUi() {
    var text = runTest(parseInt(document.getElementById("matrixCount").value), parseInt(document.getElementById("iterationCount").value), parseInt(document.getElementById("noiseCount").value), parseInt(document.getElementById("itemCount").value), parseInt(document.getElementById("dimensionCount").value), parseInt(document.getElementById("maxValue").value), parseFloat(document.getElementById("dimBoundShift").value), parseFloat(document.getElementById("dimBoundDev").value));
    results.push(text);
    stepPage(1);
}
function updateNavigation() {
    document.getElementById("prevPageBtn").disabled = currentPage === 1;
    document.getElementById("nextPageBtn").disabled = currentPage === results.length;
    document.getElementById("downloadBtn").disabled = results.length === 0;
}
function stepPage(stepValue) {
    currentPage += stepValue;
    document.getElementById("results").innerText = results[currentPage - 1];
    updateNavigation();
}
