interface classified{
    label0: number[][];
    label1: number[][];
}

const testSet :number [][] = [[1,3],[1,5],[2,9],[3,11],[4,4],[5,1],[6,1],[6,2],[6,6],[6,12],[7,11],[8,10],[9,9],[10,7],[11,9],[12,6]];

function dominates(item1: number[], item2: number[]) : boolean{
    let result : boolean = true;
    for(let i = 0; i < item1.length && result; i++) { result = result && (item1[i] >= item2[i]); }
    return result;
}

function probe(item: number[],dimensionBoundaries?:number[]): number{
    dimensionBoundaries = dimensionBoundaries ? dimensionBoundaries : [3,6];
    return dominates(item,dimensionBoundaries) ? 1 : 0;
}

function classifyChain(chain: number[][]): classified{
    const result = { label0: [], label1: []}
    while(chain.length != 0){
        const probedIndex = Math.round(chain.length/2)-1;
        const probedValue = probe(chain[probedIndex]);
        if(probedValue === 0){
            result.label0.push(...chain.slice(0,probedIndex + 1));
            chain = chain.slice(probedIndex + 1);
        }else{
            result.label1.push(...chain.slice(probedIndex));
            chain = probedIndex === 0 ? [] : chain.slice(0,probedIndex);
        }
    }
    return result;
}

function chainDecomposBased(chains: number[][][]) : classified{
 const result = { label0: [], label1: []};
 chains.map( (item) => {
    const subClassified = classifyChain(item);
    result.label0.push(...subClassified.label0);
    result.label1.push(...subClassified.label1);
 });
 return result;
}

function testChainDecomposBased(){
    const chains = [
        [[1,3],[1,5],[2,9],[3,11],[6,12]],
        [[7,11]],
        [[4,4],[6,6],[8,10]],
        [[12,6]],
        [[9,9]],
        [[5,1],[6,1],[6,2],[10,7],[11,9]]
    ];
    console.log(JSON.stringify(chainDecomposBased(chains)));
}

function rpeCore(set: number[][], probedIndex: number,dimensionBoundaries: number[], noiseIndices?: number[]) : {result: classified, setRemainder: number[][]}{
    const result = { label0: [], label1: []};
    let probedValue= probe(set[probedIndex],dimensionBoundaries);
    if(noiseIndices && noiseIndices.includes(probedIndex)){
        probedValue = probedValue === 0 ? 1 : 0 ;
    }
    const newSet = new Array<number[]>();
    if(probedValue === 0){
        set.map(item =>{
            if(dominates(set[probedIndex],item)){
                result.label0.push(item);
            }else{
                newSet.push(item);
            }
        });
    }else{
        set.map(item =>{
            if(dominates(item,set[probedIndex])){
                result.label1.push(item);
            }else{
                newSet.push(item);
            }
        });
    }
    return {result, setRemainder: newSet};
}

function randomProbeEllimination(set: number[][],dimensionBoundaries: number[], noiseIndices?: number[]): {result :classified, probeCount: number}{
    const result = { label0: [], label1: []};
    var probeCount = 0;
    while(set.length != 0){
        const probedIndex = Math.round(Math.random() * (set.length-1));
        const partialResults= rpeCore(set, probedIndex,dimensionBoundaries,noiseIndices);
        result.label0.push(...partialResults.result.label0);
        result.label1.push(...partialResults.result.label1);
        set = partialResults.setRemainder;
        probeCount ++;
    }
    return {result, probeCount};
}

function randomProbeElliminationPerm(set: number[][], noiseIndices?: number[]): classified{
    const result = { label0: [], label1: []};
    set = set.sort( () => 0.5 - Math.random() );
    while(set.length != 0){
        const partialResults= rpeCore(set, 0, noiseIndices);
        result.label0.push(...partialResults.result.label0);
        result.label1.push(...partialResults.result.label1);
        set = partialResults.setRemainder;
    }
    return result;
}

function countError(sorted: classified, dimensionBoundaries: number[]): number{
    let result = 0;
    sorted.label0.forEach(value =>{
        if(probe(value,dimensionBoundaries) !== 0){ result++; }
    })
    sorted.label1.forEach(value =>{
        if(probe(value,dimensionBoundaries) !== 1){ result++; }
    })
    return result;
}

function generateRandomTestSet(dimensions: number, maxValue:number, itemCount: number ): number[][]{
    const testSet : number[][] = [];
    for(let i = 0; i < itemCount; i++){
        const item : number[] = [];
        for(let j = 0; j < dimensions; j++){
            item.push(Math.round(Math.random()*maxValue));
        }
        testSet.push(item);
    }
    return testSet;
}

function testRPEWithNoise(dimensions: number, maxValue: number, itemCount: number, noiseCount: number,
    dimensionBoundariesGenerator: Function, testSetGenerator: Function, noiseIndicesGenerator: Function){
    const testSet = testSetGenerator(dimensions,maxValue,itemCount);
    const noiseIndices = noiseIndicesGenerator(noiseCount,itemCount);
    const dimBounds = dimensionBoundariesGenerator(dimensions, maxValue);
    const sorted = randomProbeEllimination(testSet,dimBounds,noiseIndices);
    const failCount = countError(sorted.result,dimBounds);
    return {failCount, probeCount: sorted.probeCount};
}

function randomDimBounds(dimensions, maxValue){
    const dimBounds: number[] = [];
    for(let i = 0; i < dimensions; i++){
        dimBounds.push(Math.round(Math.random()*maxValue));
    }
    return dimBounds;
}

function medianDimBounds(dimensions, maxValue, deviationPercentage){
    const dimBounds: number[] = [];
    for(let i = 0; i < dimensions; i++){
        const index = Math.round(maxValue/2 + (Math.random()-0.5)*2*deviationPercentage/100*maxValue);
        dimBounds.push(index);
    }
    return dimBounds;
}

function shiftedDimBounds(dimensions,maxValue, deviationPercentage, shiftPercentage){
    const dimBounds: number[] = [];
    for(let i = 0; i < dimensions; i++){
        const index = Math.round((maxValue/2) + (maxValue*(shiftPercentage/100)) + (Math.random()-0.5)*2*deviationPercentage/100*maxValue);
        dimBounds.push(index);
    }
    return dimBounds;
}

function randomNoiseIndices(noiseCount: number, itemCount: number){
    const noiseIndices: number[] = [];
    while(noiseIndices.length !== noiseCount){
        const randomIndex = Math.round(Math.random()*itemCount);
        if(!noiseIndices.includes(randomIndex)){
            noiseIndices.push(randomIndex);
        }
    }
    return noiseIndices;
}

function runTest(matrixCount: number,iterationCount: number, 
     noiseLevelLimit: number,itemCount: number,
     dimensionCount: number, maxValue:number,
     dimBoundShift: number, dimBoundDev: number){

    let text = "";
    let avgProbeCount = 0;
    for(var mc= 0; mc<matrixCount; mc++){
        text += `Test set, ${dimensionCount} dimensions, ${itemCount} items with max value of ${maxValue} : \n`;
        const testSet = generateRandomTestSet(dimensionCount,maxValue,itemCount);
        text += JSON.stringify(testSet) + "\n";
        text += `Dimensional bounds at ${50 + dimBoundShift}%,  ${dimBoundDev}% deviation, random noise indices from 1 to ${noiseLevelLimit} \n`;
        var testResults = {}
        for(let i = 0; i < iterationCount; i++){
            for(let j = 1; j <= noiseLevelLimit; j++){0
                const dbgen = () => {return  shiftedDimBounds(dimensionCount,maxValue,dimBoundDev,dimBoundShift);};
                const noisegen = () => {return randomNoiseIndices(j,itemCount);};
                const test = testRPEWithNoise(dimensionCount,maxValue,itemCount,j,dbgen,()=>{return testSet},noisegen);
                const testError = test.failCount;
                if(!testResults[j]){
                    testResults[j] = {error: (testError/itemCount)*100, probeCount: test.probeCount }
                }else{
                    testResults[j].error +=  (testError/itemCount)*100;
                    testResults[j].probeCount += test.probeCount;
                }
            }
        }
        Object.entries(testResults).forEach((item: [string,any])=>{
            text += `Average error percentage on ${item[0]} noise level : ${(item[1].error/iterationCount).toFixed(4)}%\n`;
            avgProbeCount += Math.round(item[1].probeCount/iterationCount);
        });
        avgProbeCount = avgProbeCount/matrixCount;
        text += `Average probe count: ${Math.round(avgProbeCount)} \n`;
        text+="\n";
    }
    return text;
}

var results = [];
var currentPage = 0;
function runTestFromUi(){
    const text = runTest(
        parseInt((document.getElementById("matrixCount") as HTMLInputElement).value),
        parseInt((document.getElementById("iterationCount") as HTMLInputElement).value),
        parseInt((document.getElementById("noiseCount") as HTMLInputElement).value),
        parseInt((document.getElementById("itemCount") as HTMLInputElement).value),
        parseInt((document.getElementById("dimensionCount") as HTMLInputElement).value),
        parseInt((document.getElementById("maxValue") as HTMLInputElement).value),
        parseFloat((document.getElementById("dimBoundShift") as HTMLInputElement).value),
        parseFloat((document.getElementById("dimBoundDev") as HTMLInputElement).value)
    );
    results.push(text)
    stepPage(1);
}

function updateNavigation(){
    (document.getElementById("prevPageBtn") as HTMLButtonElement).disabled = currentPage === 1;
    (document.getElementById("nextPageBtn") as HTMLButtonElement).disabled = currentPage === results.length;
    (document.getElementById("downloadBtn") as HTMLButtonElement).disabled = results.length === 0;
}

function stepPage(stepValue){
    currentPage += stepValue;
    document.getElementById("results").innerText = results[currentPage-1];
    updateNavigation();
}

//TODO parametric random testSet generator with fixed width
