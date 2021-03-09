// TODO: Map picker
// TODO: Date hovered (beside state abbreviation?)

// Settings
const SIZE = [694, 380]
const MARGIN = {top: 20, right: 20, bottom: 25, left: 60}
const xF = d => new Date(d)
const yF = d => d



async function createTimeSeriesPlot(dataset) {
  const seriesData = dataset.getUniqueValues(sField).map(d => dataset.query({[xField]: d}))
  const xValues = dataset.getUniqueValues(xField).map(xF)

  const parentDiv = d3.select("#fig1_time_series")
  SIZE[0] = parentDiv.node().clientWidth
  SIZE[1] = 0.6 * SIZE[0]

  const plot = createBasePlot("fig1_svg", seriesData, xValues)

  parentDiv.append(_ => plot.svg.node())
  plot.yField = plot.interactionState.yField
  updatePlot(plot)
  createControls(plot)
}

function updatePlot(plot) {
  plot.svg.select(`#${plot.id}-yAxis`).remove()
  plot.svg.select(`#${plot.id}-dataPaths`).remove()

  plot.scaleY = d3.scaleLinear()
    .domain(d3.extent(dataset.data.map(d => yF(d[plot.yField])))).nice()
    .range([SIZE[1] - MARGIN.bottom, MARGIN.top])  

  const yAxis = g => g 
    .attr("id", `${plot.id}-yAxis`)
    .attr("transform", `translate(${MARGIN.left},0)`)
    .call(d3.axisLeft(plot.scaleY).tickFormat(d => d3.format(".3f")(d * 100)))
    .call(g => g.select(".tick:last-of-type text").clone()
      .attr("x", 3)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(new Map([...yFieldMap.entries()].map(e => [e[1], e[0]])).get(plot.yField) + " (%)")) // TODO: Label instead of ID

  plot.svg.append("g")
    .call(yAxis)

  const line = d3.line()
    .x(d => plot.scaleX(xF(d[xField])))
    .y(d => plot.scaleY(yF(d[plot.yField])))

  const path = plot.svg.append("g")
      .attr("id", `${plot.id}-dataPaths`)
      .attr("fill", "none")
      .attr("stroke-width", 1.3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(plot.data)
    .join("path")
      .style("mix-blend-mode", "multiply")
      .attr('d', line)
      .attr("stroke", (d, i) => interactiveColorFunction(plot.interactionState,  d, i))

  plot.path = path

  updateLabels(plot)
}

function createControls(plot) {
  const div = document.getElementById("fig1_controls")

  const axisDiv = document.createElement("div")
  const ySelect = createSelect("Y Axis", [...yFieldMap.entries()], plot.yField, function() {
    plot.interactionState.yField = this.value
    plot.yField = this.value
    updatePlot(plot)
  })
  axisDiv.appendChild(ySelect)

  const coloringSelect = createSelect("Coloring", [...coloringMap.entries()].map(entry => [entry[0], entry[1].id]), plot.interactionState.coloring, function() {
    plot.interactionState.coloring = this.value
    plot.svg.select(`#${plot.id}-dataPaths`).selectAll("path")
      .attr("stroke", (d, i) => interactiveColorFunction(plot.interactionState,  d, i))
  })

  div.appendChild(axisDiv)
  div.appendChild(coloringSelect)
}

function plotMouseMoved(e, plot) {
  e.preventDefault()
  const pointer = d3.pointer(e, plot.svg.node()) 
  const xm = plot.scaleX.invert(pointer[0])
  const ym = plot.scaleY.invert(pointer[1])
  
  const i = d3.bisectCenter(plot.xValues, xm)
  const s = d3.least(plot.data, series => Math.abs(series[i][plot.interactionState.yField] - ym)) 

  const p = [plot.scaleX(plot.xValues[i]), plot.scaleY(s[i][plot.interactionState.yField])]
  if (Math.abs(p[1] - pointer[1]) < 30) {
    plot.interactionState.focused = s[i][sField]
    plot.dot.attr("transform", `translate(${p[0]},${p[1]})`);
    plot.dot.select("text").text(s[i][sField]);
    plot.dot.attr("visibility", "visible")
  } else {
    plot.interactionState.focused = null
    plot.dot.attr("visibility", "hidden")
  }

  plot.path
    .attr("stroke", (d, i) => interactiveColorFunction(plot.interactionState,  d, i))
}

function plotMouseLeft(e, plot) {
  plot.interactionState.focused = null
  plot.dot.attr("visibility", "hidden")
  plot.path
    .attr("stroke", (d, i) => interactiveColorFunction(plot.interactionState,  d, i))
}

function plotMouseClicked(e, plot) {
  if (plot.interactionState.focused) {
    plot.interactionState.selected.add(plot.interactionState.focused) 
  } else {
    plot.interactionState.selected.clear()
  }
  plot.path
    .attr("stroke", (d, i) => interactiveColorFunction(plot.interactionState,  d, i))
 
  
  updateLabels(plot)
}

function updateLabels(plot) {
  const showText = plot.data.filter(
    s => plot.interactionState.selected.has(s[0][sField]) || s[0][sField] == plot.interactionState.focused
  )

  plot.labels
    .selectAll("text")
    .data(showText)
    .join("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "left")
      .attr("fill", "black")
      .attr("x", d => plot.scaleX(xF(d[d.length-1][xField])))
      .attr("y", d => plot.scaleY(yF(d[d.length-1][plot.interactionState.yField])))
      .text(d => d[0][sField])
}

/**
 * Create an SVG with the elements which do not change with user interaction
 */
function createBasePlot(id, seriesData, xValues) {
  var svg = d3.create("svg")
    .attr("id", id)
    .attr("width", SIZE[0])
    .attr("height", SIZE[1])
    //.attr("viewbox", [0, 0, SIZE[0], SIZE[1]])

  console.log(svg.width)

  const interactionState = {focused: null, selected: new Set(), yField: "covid_cases", coloring: "color_unique"} 

  const plot = {id: id, svg: svg, data: seriesData, xValues: xValues, interactionState: interactionState}

  plot.scaleX = d3.scaleUtc()
    .domain(d3.extent(xValues))
    .range([MARGIN.left, SIZE[0] - MARGIN.right])
    //.nice()

  // TODO: Fix gradient smoothing issue (its due to the individual line segments)
  // Create color gradients. For static colorings, these will just be a single color. 
  for (const coloring of coloringMap.values()) {
    for (const [i, series] of plot.data.entries()) {
      svg.append("linearGradient")
        .attr("id", `${coloring.id}-${series[0][sField]}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("x2", SIZE[0])
        .selectAll("stop")
          .data(series)
          .join("stop")
            .attr("offset", d => plot.scaleX(xF(d.date)) / SIZE[0])
            .attr("stop-color", coloring.function)
    }

    // Dot which appears when user is hovering over a series, initially invisible
    const dot = svg.append("g")
      .attr("visibility", "hidden")
      .style("pointer-events", "none")
    dot.append("circle")
      .attr("r", 2.5)
    dot.append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("y", -8)

    const labels = svg.append("g")
      .attr("id", "labels")
      .style("pointer-events", "none")

    plot.dot = dot
    plot.labels = labels
  }

  const xAxis = g => g
    .attr("id", "xAxis")
    .attr("transform", `translate(0,${SIZE[1] - MARGIN.bottom})`)
    .call(d3.axisBottom(plot.scaleX)
      //.ticks(SIZE[0] / 80)
      .tickSizeOuter(0)
      .tickFormat(d => new Date(d).toISOString().slice(0, 10)))
  
  svg.append("g")
    .call(xAxis)

  svg.on("mousemove", e => plotMouseMoved(e, plot))
  svg.on("mouseleave", e => plotMouseLeft(e, plot))
  svg.on("click", e => plotMouseClicked(e, plot))

  return plot
}