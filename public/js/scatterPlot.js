// Settings
// const SIZE = [640, 480]
// const MARGIN = ({top: 20, right: 20, bottom: 30, left: 60})
// const xF = d => new Date(d)
// const yF = d => d

var sMargin = {top: 20, right: 20, bottom: 20, left: 30}
var pMargin = {top: 20, right: 20, bottom: 20, left: 30}

const tField = "date"
const bubbleField = "population"
var axisFieldMap

// TODO: Generalise
async function createSimpleScatter(dataset, id, aAxisFieldMap, includePCP=false, size=[350, 350],
  argSMargin = null, tickFormat = d => d) {
  
  console.log("Creating scatter plot...")

  if (argSMargin != null) {
    sMargin = argSMargin
  }

  axisFieldMap = aAxisFieldMap

  const fig2 = d3.select(`#${id}_scatter`)

  const plot = createBaseScatter(`${id}-svg`, dataset,  size)
  plot.xField = [...axisFieldMap.values()][0]
  plot.yField = [...axisFieldMap.values()][1]
  plot.includePCP = includePCP
  if (includePCP) {
    plot.pcpTickFormat = tickFormat
  } 

  fig2.append(_ => plot.pointSvg.node())

  plot.tValue = "2020-04-18"


  if (includePCP) {
    createBasePCP(plot, size)
    updatePCP(plot)
    d3.select(`#${id}_scatter`).append(_ => plot.pcp.svg.node())
  }

  updateScatter(plot)
  createControls(plot, id)
}

function updateScatter(plot) {
  plot.pointSvg.select(`#${plot.id}-xAxis`).remove()
  plot.pointSvg.select(`#${plot.id}-yAxis`).remove()

  plot.scaleX = d3.scaleLinear()
    .domain(getStandardExtent(dataset.getUniqueValues(plot.xField))) 
    .range([sMargin.left, plot.size[0] - sMargin.right])
  plot.scaleY =  d3.scaleLinear()
    .domain(getStandardExtent(dataset.getUniqueValues(plot.yField)))
    .range([plot.size[1] - sMargin.bottom, sMargin.top])
  
  const xAxis = g => g
    .attr("id", `${plot.id}-xAxis`)
    .attr("transform", `translate(0,${plot.size[1] - sMargin.bottom})`)
    .call(d3.axisBottom(plot.scaleX).ticks(plot.size[0] / 80).tickSizeOuter(0).tickFormat(plot.tickFormat))
  const yAxis = g => g
    .attr("id", `${plot.id}-yAxis`)
    .attr("transform", `translate(${sMargin.left},0)`)
    .call(d3.axisLeft(plot.scaleY).tickFormat(plot.tickFormat))
  
  plot.pointSvg.append("g")
      .call(xAxis)
  plot.pointSvg.append("g")
      .call(yAxis)

  updatePoints(plot)

  return plot
}

function updateTraces(plot) {
  plot.traces.selectAll("*").remove()

  if (!plot.tracesEnabled) {
    return 
  }
  
  for (const selectedState of plot.interactionState.selected) {
    const tIndex = plot.tValues.indexOf(plot.tValue)

    const stateRows = []
    for (var i = Math.max(0, tIndex-4); i <= tIndex; i++) {
      const thisT = plot.tValues[i]
      stateRows.push(dataset.queryOne({[tField]: thisT, [sField]: selectedState}))
    }

    plot.traces.append("path")
      .datum(stateRows)
      .attr("d", d => {
        return d3.line()(d.map(row => [plot.scaleX(row[plot.xField]), plot.scaleY(row[plot.yField])]))
      })
      .attr("stroke", (d, i) => scatterColorFunction(plot.interactionState, [d[d.length-1]], i))
      .attr("fill", "none")
    
    for (const [i,d] of [...stateRows.entries()].slice(0, stateRows.length-1)) {
      plot.traces.append("circle").datum(d)
        .attr("cx", plot.scaleX(d[plot.xField]))
        .attr("cy", plot.scaleY(d[plot.yField]))
        .attr("fill", lightenRGB(scatterColorFunction(plot.interactionState, [d], i), (4-i)/5))
        .attr("r", 3)
        //.attr("fill-opacity", (1/5) + i*(1/5))
    }
  }
}

function scaleContains(scale, d) {
  return d >= scale.domain()[0] && d <= scale.domain()[1]
}

function clamp(scale, value) {
  const range = [...scale.range()]
  range.sort((a, b) => a - b)
  return Math.max(range[0], Math.min(range[1], value)) 
}

function getAngle(point) {
  var angle = Math.atan2(point[1], point[0])
  var degrees = 180 * angle / Math.PI
  return (360 + Math.round(degrees)) % 360
}

function lightenRGB(rgbStr, amount) {
  console.log(rgbStr)
  var rgb = rgbStr.split("rgb(")[1].split(")")[0].split(",").map(d => parseInt(d))
  rgb = rgb.map(d => d + (255-d)*amount)
  return `rgb(${rgb.map(d => Math.round(d)).join(",")})`
}

function updatePoints(plot) {
  const points = dataset.query({[tField]: plot.tValue})

  const inPoints = []
  const outPoints = []
  for (const d of points)  {
    if (scaleContains(plot.scaleX, d[plot.xField]) 
        && scaleContains(plot.scaleY, d[plot.yField])) {
      inPoints.push(d) 
    } else {
      outPoints.push(d) 
    }
  }

  const triSize = 6
  const triPoints = [[triSize/2, triSize*1.5], [triSize, 0], [0, 0]]
  plot.pointSvg.select(`#${plot.id}-outPoints`)
    .selectAll("polygon")
    .data(outPoints)
    .join("polygon")
    .sort((a, b) => sort(a, b, plot))
      .attr("pointer-events", "none")
      .attr("points", _ => triPoints)
      //.attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
      .attr("class", "point pointPart")

  plot.pointSvg.select(`#${plot.id}-outPoints`)
    .selectAll("circle")
    .data(outPoints)
    .join("circle")
      .attr("pointer-events", "visibleFill")
      .on("mouseover", (e, d) => pointMouseOver(e, d, plot))
      .on("mouseleave", (e, d) => pointMouseLeave(e, d, plot))
      .on("click", (e, d) => pointMouseClick(e, d, plot))
      .attr("class", "pointPart")
      .attr("cx", triSize/2)
      .attr("cy", triSize/2)
      .attr("r", triSize*0.75)
      .attr("fill", "none")

  plot.pointSvg.select(`#${plot.id}-outPoints`).selectAll(".pointPart")
    .attr("transform", d => {
      const line = [
        [plot.scaleX(d[plot.xField]), plot.scaleY(d[plot.yField])],
        [clamp(plot.scaleX, plot.scaleX(d[plot.xField])), clamp(plot.scaleY, plot.scaleY(d[plot.yField]))],
      ]
      const angle = getAngle([line[1][0] - line[0][0], line[1][1] - line[0][1]])
      return `translate(${line[1][0]}, ${line[1][1]}) rotate(${angle+90}) translate(${-triSize/2}, ${0})`
    })

  plot.pointSvg.select(`#${plot.id}-points`)
    .selectAll("circle")
    .data(inPoints)
    .join("circle")
    .sort((a, b) => sort(a, b, plot))
      .attr("class", "point")
      .attr("cx", d => plot.scaleX(d[plot.xField]))
      .attr("cy", d => plot.scaleY(d[plot.yField]))
      //.attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
      .attr("r", d => plot.bubble ? plot.bubbleScale(d[bubbleField]) : 5)
      .attr("sValue", d => d[sField])
      .on("mouseenter", (e, d) => pointMouseOver(e, d, plot))
      .on("mouseleave", (e, d) => pointMouseLeave(e, d, plot))
      .on("click", (e, d) => pointMouseClick(e, d, plot))
      
  
  plot.pointSvg.selectAll(".point")
    .attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))

  updateTraces(plot)
  updateScatterLabels(plot)
}

function updateScatterLabels(plot) {
  const showText = dataset.query({[tField]: plot.tValue}).filter(
    d => plot.interactionState.selected.has(d[sField]) || d[sField] == plot.interactionState.focused
  )

  plot.labels
    .selectAll("text")
    .data(showText)
    .join("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "left")
      .attr("fill", "black")
      // .attr("x", d => plot.scaleX(d[plot.xField]) 
      //   + (plot.bubble ? plot.bubbleScale(d[bubbleField])*0.75 : 5))
      // .attr("y", d => plot.scaleY(d[plot.yField])
      //   - (plot.bubble ? plot.bubbleScale(d[bubbleField])*0.75 : 5))
      .attr("x", d => {
        var x = plot.scaleX(d[plot.xField])
        var clampX = clamp(plot.scaleX, x)
        var offset = 0
        if (clampX == x) {
          offset = (plot.bubble ? plot.bubbleScale(d[bubbleField])*0.75 : 4)
        } else {
          offset = (x - clampX) < 0 ? 5 : -15
        }
        return clampX + offset
      })
      .attr("y", d => {
        var y = plot.scaleY(d[plot.yField])
        var clampY = clamp(plot.scaleY, y)
        var offset = 0
        if (clampY == y) {
          offset = (plot.bubble ? plot.bubbleScale(d[bubbleField])*0.75 : 4)
        } else {
          offset = (y - clampY) < 0 ? 5 : -3
        }
        return clampY + offset
      })
      .text(d => d[sField])
}

function createBaseScatter(id, dataset, size=[480, 480]) {
  var svg = d3.create("svg")
    .attr("id", id)
    .attr("width", size[0])
    .attr("height", size[1])

  svg.append("g")
    .attr("id", `${id}-points`)

  const labels = svg.append("g")
    .attr("id", `${id}-labels`)
    .style("pointer-events", "none")

  const traces = svg.append("g")
    .attr("id", `${id}-traces`)
  
  const plot = {
    id: id, 
    pointSvg: svg, 
    tValues: dataset.getUniqueValues(tField), 
    labels: labels, 
    traces: traces,
    size: size
  }
  plot.interactionState = {focused: null, selected: new Set(), yField: "covid_cases", coloring: "color_unique"} 

  plot.pointSvg.append("g")
    .attr("id", `${plot.id}-outPoints`)

  svg.on("click", (e, d) => blankClick(e, d, plot))

  const bubbleExtent = d3.extent(dataset.getUniqueValues(bubbleField))
  plot.bubbleScale = d3.scaleLinear().domain(bubbleExtent).range([3, 15])

  return plot
}

function blankClick(e, d, plot) {
  plot.interactionState.selected.clear()
  plot.pointSvg.selectAll(".point")
    .attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))

  if (plot.includePCP) {
    plot.pcp.lines.selectAll("path")
      .attr("stroke", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
  }

  updateTraces(plot)
  updateScatterLabels(plot)
}

function pointMouseOver(e, d, plot) {
  plot.interactionState.focused = d[sField]
 
  plot.pointSvg.selectAll(".point")
    .attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))

  plot.pointSvg.select(`#${plot.id}-outPoints`)
    .selectAll("polygon")
    .sort((a, b) => sort(a, b, plot))

  plot.pointSvg.select(`#${plot.id}-points`)
    .selectAll("circle")
    .sort((a, b) => sort(a, b, plot))

  if (plot.includePCP) {
    plot.pcp.lines.selectAll("path")
      .sort((a, b) => sort(a, b, plot))
      .attr("stroke", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
  }

  updateScatterLabels(plot)
}

function pointMouseLeave(e, d, plot) {
  plot.interactionState.focused = null
  plot.pointSvg.selectAll(".point")
    .attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))

  if (plot.includePCP) {
    plot.pcp.lines.selectAll("path")
      .attr("stroke", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
  }

  updateScatterLabels(plot)
}

function pointMouseClick(e, d, plot) {
  if (plot.interactionState.selected.has(d[sField])) {
    plot.interactionState.selected.delete(d[sField]) 
  } else {
    plot.interactionState.selected.add(d[sField])
  }

  updateScatterLabels(plot)
  updateTraces(plot)

  plot.pointSvg.selectAll(".point")
    .attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))

  e.stopPropagation()
}

function getStandardExtent(values) {
  const std = d3.deviation(values)
  const mean = d3.mean(values)
  values = values.filter(d => d > mean - std*2 && d < mean + std*2)
  return d3.extent(values)
}

function sort(a, b, plot)  {
  if (plot.interactionState.selected.has(a[sField]) || plot.interactionState.focused == a[sField]) {
    return 1 
  } else {
    return -1 
  }
}

function createControls(plot, id) {
  const div = document.getElementById(`${id}_controls`)

  const ySelect = createSelect("Y Axis", [...axisFieldMap.entries()], plot.yField, function() {
    console.log(plot.yField, "->", this.value)
    plot.yField = this.value
    updateScatter(plot)
  })
  const xSelect = createSelect("X Axis", [...axisFieldMap.entries()], plot.xField, function() {
    plot.xField = this.value
    updateScatter(plot)
  })

  const bubbleDiv = document.createElement("div")
  bubbleDiv.className = "check"
  const bubbleCheck = document.createElement("input")
  bubbleCheck.type = "checkbox"
  bubbleCheck.id = `${id}-bubble`
  bubbleCheck.oninput = function() {
    plot.bubble = this.checked
    updatePoints(plot)
  }
  const bubbleLabel = document.createElement("label")
  bubbleLabel.setAttribute("for", `${id}-bubble`)
  bubbleLabel.innerHTML = "Bubble"
  bubbleDiv.appendChild(bubbleCheck)
  bubbleDiv.appendChild(bubbleLabel)

  const tracesDiv = document.createElement("div")
  tracesDiv.className = "check"
  const tracesCheck = document.createElement("input")
  tracesCheck.type = "checkbox"
  tracesCheck.id = `${id}-traces`
  tracesCheck.oninput = function() {
    plot.tracesEnabled = this.checked
    updateTraces(plot)
  }
  const tracesLabel = document.createElement("label")
  tracesLabel.setAttribute("for", `${id}-traces`)
  tracesLabel.innerHTML = "Traces"
  tracesDiv.appendChild(tracesCheck)
  tracesDiv.appendChild(tracesLabel)

  plot.tracesEnabled = tracesCheck.checked

  const coloringSelect = createSelect("Coloring", [...coloringMap.entries()].map(entry => [entry[0], entry[1].id]), plot.interactionState.coloring, function() {
    plot.interactionState.coloring = this.value

    updateTraces(plot)
    
    // TODO: Raise
    plot.pointSvg.selectAll(".point")
      .attr("fill", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
      //.sort((a, b) => sort(a, b, plot))

    if (plot.includePCP) {
      plot.pcp.lines.selectAll("path")
        .sort((a, b) => sort(a, b, plot))
        .attr("stroke", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
    }
  })

  xSelect.className = "axis-select-1"
  div.appendChild(xSelect)
  ySelect.className = "axis-select-2"
  div.appendChild(ySelect)

  const styleDiv =  document.createElement("div")
  styleDiv.appendChild(coloringSelect)
  styleDiv.appendChild(bubbleDiv)
  styleDiv.appendChild(tracesDiv)
  styleDiv.className = "style-div"
  div.appendChild(styleDiv)

  const sliderDiv = document.getElementById(`${id}_slider_control`)
  sliderDiv.appendChild(createSlider(`${id}-slider`, "Date:", dataset.getUniqueValues(tField), function(e) {
    plot.tValue = plot.tValues[e.target.value]
    updatePoints(plot)

    if (plot.includePCP) {
      updateTimePCP(plot)
    }
  }), d => d.toISOString().substring(0, 10))
}

function createSlider(id, title, values, oninput, labelFormat = d => d) {
  const div = document.createElement("div")
  
  const slider = document.createElement("input")
  slider.id = id
  slider.type = "range"
  slider.min = 0
  slider.max = values.length-1
  slider.style = "width: 260px"
  
  const labelElement = document.createElement("label")
  labelElement.setAttribute("for", id)
  labelElement.innerHTML = labelFormat(values[slider.value])
  labelElement.setAttribute("style", "margin-left: 5px")
  labelElement.className = "slider-label"
  
  slider.oninput = function(e) {
    labelElement.innerHTML = labelFormat(values[slider.value])
    oninput(e)
  }

  const titleLabel = document.createElement("label")
  titleLabel.setAttribute("for", id)
  titleLabel.innerHTML = title
  
  div.className = "slider"
  div.appendChild(titleLabel)
  div.appendChild(slider)
  div.appendChild(labelElement)
  
  return div
}
// TODO: Limit PCP plot to +- 2 or 3 STD (?)
function updatePCP(plot) {
  const data = dataset.query({[tField]: plot.tValue})
  const fields = [...yFieldMap.values()]

  const line = d3.line()
    .defined(([, value]) => value != null)
    .x(([key, value]) => plot.pcp.xScales.get(key)(value))
    .y(([key]) => plot.pcp.yScale(key))


  plot.pcp.lines.selectAll("path")
    .data(data)
    .join("path")
      .attr("stroke", (d, i) => scatterColorFunction(plot.interactionState, [d], i))
      .attr("d", d =>  line(d3.cross(fields, [d], (key, d) => [key, d[key]])))
    .append("title")
      .text(d => d.name)

  plot.pcp.svg.select(`#${plot.id}-axes`).raise()
}

function updateTimePCP(plot) {
  const fields = [...yFieldMap.values()]

  const data = dataset.query({[tField]: plot.tValue})
  const xScales = new Map(fields.map(
    key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [pMargin.left, plot.pcp.size[0] - pMargin.right])]))

  plot.pcp.xScales = xScales

  const axes = plot.pcp.svg.select(`#${plot.id}-pcp-axes`)
  axes.selectAll(".pcp-axis").remove()
  for (const field of fields) {
    const axis = g => g
      //.attr("transform", `translate(${sMargin.left},0)`)
      .call(d3.axisBottom(xScales.get(field)).ticks( plot.pcp.size[0] / 80).tickSizeOuter(0).tickFormat(plot.pcpTickFormat))

    axes.append("g")
      .attr("transform", _ => `translate(0,${plot.pcp.yScale(field)})`)
      .attr("class", "pcp-axis")
      .call(axis)
  }

  // console.log(fields)
  
  //   .selectAll("g")
  //   .data(fields)
  //   .join("g")
  //     .each(function(d) {
  //       d3.axisBottom(xScales.get(d))(d3.select(this))
  //     })
      //.attr("transform", d => `translate(0,${plot.pcp.yScale(d)})`)
      // .each(function(d) { 
      //   console.log(this, d3.select(this), d, d3.axisBottom(xScales.get(d)))
      //   d3.select(this).call(d3.axisBottom(xScales.get(d)))
      // })

  // plot.pcp.svg.select(`#${plot.id}-pcp-axes`)
  //   .selectAll("g")
  //   .data(fields)
  //   .join("g")
  //     .attr("transform", d => `translate(0,${plot.pcp.yScale(d)})`)
  //     //.each(function(d) { d3.select(this).call(d3.axisBottom(xScales.get(d)).ticks( plot.pcp.size[0] / 80).tickSizeOuter(0).tickFormat(plot.pcpTickFormat))})
  //     .call(g => g.append("text")
  //       .attr("x", pMargin.left)
  //       .attr("y", -6)
  //       .attr("text-anchor", "start")
  //       .attr("fill", "currentColor")
  //       .text(d => d))
  //     .call(g => g.selectAll("text")
  //       .clone(true).lower()
  //       .attr("fill", "none")
  //       .attr("stroke-width", 5)
  //       .attr("stroke-linejoin", "round")
  //       .attr("stroke", "white"))

  updatePCP(plot)

}

function createBasePCP(plot, size=[300, 300]) {
  var svg = d3.create("svg")
    .attr("id", `${plot.id}-pcp`)
    .attr("width", size[0])
    .attr("height", size[1])

  const fields = [...yFieldMap.values()]

  const yScale = d3.scalePoint(fields, [pMargin.top, size[1] - pMargin.bottom])

  plot.pcp = {}
  plot.pcp.svg = svg
  plot.pcp.yScale = yScale 
  plot.pcp.size = size

  plot.pcp.lines = plot.pcp.svg.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.8)
    .attr("stroke-opacity", 0.5)

  svg.append("g")
    .attr("id", `${plot.id}-pcp-axes`)
    .selectAll("g")
    .data(fields)
    .join("g")
      .call(g => g.append("text")
        .attr("x", pMargin.left)
        .attr("y", d => yScale(d) - 5)
        .attr("text-anchor", "start")
        .attr("fill", "currentColor")
        .attr("font-size", "8pt")
        .text(d => d))
      .call(g => g.selectAll("text")
        .clone(true).lower()
        .attr("fill", "none")
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
        .attr("stroke", "white"))
  updateTimePCP(plot)

  return plot
}