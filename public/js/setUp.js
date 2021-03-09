async function setUp(data) {
  window.dataset = new Dataset(data)

  window.sField = "state" // Field by which to stratify data
  window.xField = "date"

  window.yFieldMap = new Map([
    ["Covid Cases", "covid_cases"],
    ["Covid Mortality", "covid_deaths"],
    ["Heart Disease Mortality", "heart_disease_mortality"],
    ["Unemployment", "unemployment"],
  ])

  const colorMap = new Map()
  const colorScale = d3.scaleSequential()
    .domain([0, dataset.getUniqueValues(sField).length])
    .interpolator(d3.interpolateRainbow) 
  for (const [i, k] of dataset.getUniqueValues(sField).entries()) {
    colorMap.set(k, colorScale(i))   
  }
    
  window.coloringUnique = function(d) {
    return colorMap.get(d[sField])
  }


  window.coloringPolitical = function(d, i) {
    return d.government == "Rep" ? "rgb(245, 87, 66)" : "rgb(66, 102, 245)" 
  }


  window.maskColorMap = new Map([
    ["No state/territorial mask mandate", "rgb(245, 87, 66)"],
    ["State-wide/territory-wide mask mandate", "rgb(117, 250, 151)"],
    ["State/territorial mask mandate in some counties", "rgb(250, 171, 80)"]
  ])

  window.coloringMask = function(d) {
    return maskColorMap.has(d.mask_mandate) ? maskColorMap.get(d.mask_mandate) : "rgb(145, 145, 145)"
  }

  window.coloringMap = new Map([
    ["Unique", {id: "color_unique", function: coloringUnique}],
    //["Density", densityColoring],
    ["Political", {id: "color_political", function: coloringPolitical}],
    ["Mask Mandates", {id: "color_mask", function: coloringMask}],
    //["Income", incomeColoring]
  ]) 
 
  window.interactiveColorFunction = function(interactionState, d, i) {
    if (interactionState.focused != null && d[0][sField] === interactionState.focused) { 
      return `url(#${interactionState.coloring}-${d[0][sField]})`
    } else if (interactionState.selected.size > 0 && interactionState.selected.has(d[0][sField])) {
      return `url(#${interactionState.coloring}-${d[0][sField]})`
    } else if (interactionState.selected.size == 0 && interactionState.focused == null) {
      return `url(#${interactionState.coloring}-${d[0][sField]})`
    } else {
      return "rgb(240, 240, 240)"
    }
  }
}

window.scatterColorFunction = function(interactionState, d, i) {
  const map = new Map([...coloringMap.values()].map(v => [v.id, v.function]))
  if (interactionState.focused != null && d[0][sField] === interactionState.focused) { 
    return map.get(interactionState.coloring)(d[0], i)
  } else if (interactionState.selected.size > 0 && interactionState.selected.has(d[0][sField])) {
    return map.get(interactionState.coloring)(d[0], i)
  } else if (interactionState.selected.size == 0 && interactionState.focused == null) {
    return map.get(interactionState.coloring)(d[0], i)
  } else {
    return "rgb(240, 240, 240)"
  }
}


function createSelect(label, textValuePairs, defaultValue, onchange) {
  const div = document.createElement("div")
  const id = label.replace(/\s+/g, '')
  
  const labelElement = document.createElement("label")
  labelElement.setAttribute("for", id)
  labelElement.innerHTML = label + ":"
  
  const select = document.createElement("select")
  for (const [text, value] of textValuePairs) {
    var option = document.createElement("option")
    option.id = id
    option.text = text
    option.value = value
    if (value == defaultValue) {
      option.selected = "selected"
    }
    select.appendChild(option)
  }
  select.onchange = onchange
 
  div.className = "select"
  div.appendChild(labelElement)
  div.appendChild(select)
  
  return div
}