/**
 * Create global variables for use throughout paper
 */
async function setUp(dataset) {
  window.defaults = {}
  window.defaults.S_FIELD = "state"
  window.defaults.T_FIELD = "date"
  window.defaults.T_VALUE = dataset().distinct(defaults.T_FIELD)[15]
  window.defaults.COLORING_MAP = createColorings(dataset)
  window.defaults.COLORING = "Unique"
  window.defaults.Y_FIELD_MAP = createYFieldMap()
  window.defaults.X_FIELD = "covid_new_death_mean_p"
  window.defaults.Y_FIELD = "covid_new_case_mean_p"
  window.defaults.TRACES_ENABLED = true
  window.defaults.BUBBLE_FIELD = "population"
  window.defaults.INTERACTIVE_COLOR = interactiveColor
  window.defaults.INTERACTIVE_LINE_COLOR = interactiveLineColor
  window.defaults.PCA_FIELD_MAP = new Map([["PC1", "pc1"],["PC2", "pc2"]])
}

function createYFieldMap() {
  return new Map([
    ["Covid Cases", "covid_new_case_mean_p"],
    ["Covid Mortality", "covid_new_death_mean_p"],
    ["Heart Disease Mortality", "diseases_of_heart_i00_i09_p"],
    ["Unemployment", "unemployment_p"],
  ])
}

function interactiveColor(d, i) {
  const state = this.state

  if (d[this.sField] == state.focus ||
    state.selected.has(d[this.sField]) ||
    state.selected.size == 0 && state.focus == null) {
      return state.coloring.f(d, i)
  } else {
    return "rgb(240, 240, 240)"
  }
}

// TODO: Somehow convert normal interactive color into line type IN TimeSeries class
function interactiveLineColor(d, i) {
  const state = this.state

  if (d[this.sField] == state.focus ||
    state.selected.has(d[this.sField]) ||
    state.selected.size == 0 && state.focus == null) {
      return `url(#coloring-${state.coloring.id}-${d[this.sField]})`
  } else {
    return "rgb(240, 240, 240)"
  }
}


function createColorings(dataset) {
  const coloringMap = new Map()

  // -- Unique --
  const sValues = dataset().distinct(defaults.S_FIELD)
  const colorMap = new Map()
  const colorScale = d3.scaleSequential()
    .domain([0, sValues.length])
    .interpolator(d3.interpolateRainbow) 
  
  for (const [i, k] of sValues.entries()) {
    colorMap.set(k, colorScale(i))   
  }

  const coloringUnique = function(d) {
    return colorMap.get(d[defaults.S_FIELD])
  }

  coloringMap.set("Unique", {f: coloringUnique, id: "unique"})


  // -- Political --
  // const coloringPolitical = function(d) {
  //   return d.government == "Rep" ? "rgb(245, 87, 66)" : "rgb(66, 102, 245)"  
  // }
  // coloringMap.set("Political", 
  //   {
  //     f: coloringPolitical, 
  //     id: "political",
  //     continuous: false,
  //     values: [["Republican", "rgb(245, 87, 66)"], ["Democrat", "rgb(66, 102, 245)"]]
  //   }
  // )


  // -- Mask Mandates --
  const maskColorMap = new Map([
    ["No state/territorial mask mandate", "rgb(245, 87, 66)"],
    ["State/territorial mask mandate in some counties", "rgb(250, 171, 80)"],
    ["State-wide/territory-wide mask mandate", "rgb(117, 250, 151)"],
  ])

  const coloringMask = function(d) {
    return maskColorMap.has(d.current_order_status) ? maskColorMap.get(d.current_order_status) : "rgb(145, 145, 145)"
  }
  coloringMap.set("Mask Mandate", {
    f: coloringMask, 
    id: "mask",
    continuous: false,
    values: [...maskColorMap.entries()]
  })


  // -- Income --
  const densityScale =  d3.scaleSequential(
    d3.extent(dataset().distinct("income")),
    d3.interpolateCividis
  )
  const coloringDensity = function(d) {
    return densityScale(d.income)
  }
  coloringMap.set("Income",  {
    f: coloringDensity, 
    id: "density",
    continuous: true,
    values: [
      [densityScale.domain()[0], densityScale.range()[0]], 
      [densityScale.domain()[1], densityScale.range()[1]]
    ]
  })

  return coloringMap
}

function createTimeSeriesControls(id, timeSeries) {
  const axesDiv = document.createElement("div")
  const ySelect = createSelect("Y Axis", [...defaults.Y_FIELD_MAP.entries()], defaults.Y_FIELD,
    function() {
      timeSeries.setYField(this.value)
    }
  )
  axesDiv.appendChild(ySelect)

  const coloringSelect = createSelect("Coloring", 
    [...defaults.COLORING_MAP.entries()].map(entry => [entry[0], entry[1].id]), 
    defaults.COLORING,
    function() {
      timeSeries.state.coloring = defaults.COLORING_MAP.get(this.options[this.selectedIndex].text)
    }
  )

  const div = document.getElementById(id)

  const controlDiv = document.createElement("div")
  controlDiv.className = "controls"
  controlDiv.appendChild(axesDiv)
  controlDiv.appendChild(coloringSelect)
  
  div.prepend(controlDiv)
}

function createScatterControls(id, scatter, fields, xDefault, yDefault) {
  const div = document.getElementById(id)

  const controlDiv = document.createElement("div")
  controlDiv.className = "controls"

  if (fields) {
    const xSelect = createSelect("X Axis", fields, xDefault,
      function() {
        scatter.setXField(this.value)
      }
    )
    const ySelect = createSelect("Y Axis", fields, yDefault,
      function() {
        scatter.setYField(this.value)
      }
    )
    xSelect.className = "axis-select-1"
    ySelect.className = "axis-select-2"

    div.appendChild(xSelect)
    div.appendChild(ySelect)

    controlDiv.appendChild(xSelect)
    controlDiv.appendChild(ySelect)
  }
  // axesDiv.appendChild(xSelect)
  // axesDiv.appendChild(ySelect)

  const bubbleCheck = createCheckbox("Bubble", function() {
    scatter.setBubbleField(this.checked ? defaults.BUBBLE_FIELD : null)
  })
  const tracesCheck = createCheckbox("Traces", function() {
    scatter.setViewTraces(this.checked)
  })
  const coloringSelect = createSelect("Coloring", 
    [...defaults.COLORING_MAP.entries()].map(entry => [entry[0], entry[1].id]), 
    defaults.COLORING,
    function() {
      scatter.state.coloring = defaults.COLORING_MAP.get(this.options[this.selectedIndex].text)
    }
  )

  const tValues = scatter.state.dataset().distinct(defaults.T_FIELD)
  const tSlider = createSlider(`${id}-slider`, "Date:", tValues, defaults.T_VALUE,
    function(v) {
      scatter.state.tValue = tValues[v]
    }
  )

  const styleDiv = document.createElement("div")
  styleDiv.appendChild(bubbleCheck)
  styleDiv.appendChild(tracesCheck)
  styleDiv.appendChild(coloringSelect)
  styleDiv.className = "style-div"


 
  controlDiv.appendChild(styleDiv)

  div.prepend(controlDiv)
  div.append(tSlider)
}

function createControls(id, scatter, parallel, state) {
  const xSelect = createSelect("X Axis", [...defaults.Y_FIELD_MAP.entries()], defaults.DEFAULT_X_FIELD,
    function() {
      scatter.setXField(this.value)
    }
  )
  const ySelect = createSelect("Y Axis", [...defaults.Y_FIELD_MAP.entries()], defaults.DEFAULT_Y_FIELD,
    function() {
      scatter.setYField(this.value)
    }
  )

  const tValues = scatter.state.dataset().distinct(defaults.T_FIELD)
  const tSlider = createSlider(`${id}-slider`, "Date:", tValues, defaults.T_VALUE,
    function() {
      state.tValue = tValues[this.value]
    }
  )


  div.appendChild(tSlider)
}

function createCheckbox(label, oninput) {
  const checkDiv = document.createElement("div")
  checkDiv.className = "check"
  const check = document.createElement("input")
  check.type = "checkbox"
  check.oninput = oninput

  const checkLabel = document.createElement("label")
  //checkLabel.setAttribute("for", `${id}-bubble`)
  checkLabel.innerHTML = label
  checkDiv.appendChild(check)
  checkDiv.appendChild(checkLabel)

  return checkDiv
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

function createSlider(id, title, values, defaultValue, oninput, labelFormat = d => d) {
  const div = document.createElement("div")
  
  const slider = document.createElement("input")
  slider.id = id
  slider.type = "range"
  slider.min = 0
  slider.max = values.length-1
  slider.defaultValue = values.indexOf(defaultValue)
  slider.style = "width: 260px"
  
  const labelElement = document.createElement("label")
  labelElement.setAttribute("for", id)
  labelElement.innerHTML = labelFormat(values[slider.value])
  labelElement.setAttribute("style", "margin-left: 5px")
  labelElement.className = "slider-label"
  
  // slider.oninput = function(e) {
  //   labelElement.innerHTML = labelFormat(values[slider.value])
  //   oninput(e)
  // }
  slider.oninput = function(e) {
    oninput(slider.value)
    labelElement.innerHTML = labelFormat(values[slider.value])
  }
  //slider.on = _ => labelElement.innerHTML = labelFormat(values[slider.value])

  const titleLabel = document.createElement("label")
  titleLabel.setAttribute("for", id)
  titleLabel.innerHTML = title
  titleLabel.className = "slider-label"
  
  div.className = "slider"
  div.appendChild(titleLabel)
  div.appendChild(slider)
  div.appendChild(labelElement)
  
  return div
}

function createColorKey(values, continuous=false) {
  const div = document.createElement("div")
  div.className = "color-key"

  const height = 20
  
  if (continuous) {
    div.style = "display: flex; column-gap: 5px"
    const width = 150
    const scaleX = d3.scaleLinear()
      .domain(d3.extent(values, d => d[0]))
      .range([0, width])
    
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
    
    svg.append("linearGradient")
      .attr("id", "gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("x2", width)
      .selectAll("stop")
        .data(values)
        .join("stop")
          .attr("offset", d => scaleX(d[0]))
          .attr("stop-color", d => d[1])
    
    svg.append("rect")
      .attr("y", 3)
      .attr("width", width)
      .attr("height", height - 6)
      .attr("fill", "url(#gradient)")
    
    const textDivLeft = document.createElement("div")
    textDivLeft.innerHTML = values[0][0]
    div.append(textDivLeft)
    div.append(svg.node())
    div.append(values[1][0])
  } else {
    div.style = "display: flex; column-gap: 15px"
    for (const value of values) {
      const svg = d3.create("svg")
        .attr("width", "20")
        .attr("height", height)

      svg.append("circle")
        .attr("cx", height/2 + 3)
        .attr("cy", height/2)
        .attr("r", height/2 - 3)
        .attr("fill", value[1])

      const keyDiv = document.createElement("div")
      keyDiv.append(svg.node())
      const textDiv = document.createElement("div")
      textDiv.style = "padding-left: 2px"
      textDiv.append(value[0])
      keyDiv.append(textDiv)
      keyDiv.style = "display: flex; justify-content: center;align-items: center"
      div.append(keyDiv)
    }
  }
  
  return div
}