const sField = "state" // Field by which to stratify data
const xField = "date"

const yFieldMap = new Map([
  ["Covid Cases", "covid_cases"],
  ["Covid Deaths", "covid_deaths"],
])

const coloringMap =new Map([
  ["Unique", coloringUnique],
  //["Density", densityColoring],
  ["Political", coloringPolitical],
  ["MaskMandate", coloringMask],
  //["Income", incomeColoring]
]) 


function coloringUnique(d) {
  return d3.scaleOrdinal()
    .domain(dataset.getUniqueValues(sField))
    .range(d3.schemeCategory10)(d[sField])
}

function coloringPolitical(d, i) {
  return d.government == "Rep" ? "Red" : "Blue" 
}


const maskColorMap = new Map([
  ["No state/territorial mask mandate", "red"],
  ["State-wide/territory-wide mask mandate", "lightgreen"],
  ["State/territorial mask mandate in some counties", "orange"]
])

function coloringMask(d) {
  return maskColorMap.has(d.mask_mandate) ? cols.get(d.mask_mandate) : "grey"
}


