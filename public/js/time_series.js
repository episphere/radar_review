dataPromise.then(data => {
  const dataset = new Dataset(data)

  const yFieldMap = new Map([
    ["Covid Cases", "covid_cases"],
    ["Covid Deaths", "covid_deaths"],
  ])

  const coloringMap =new Map([
      ["Unique", uniqueColoring],
      //["Density", densityColoring],
      ["Political", politicalColoring],
      ["MaskMandate", maskColoring],
      //["Income", incomeColoring]
    ]) 

  const sField = "state"
  const xField = "date"

  const xF = d => new Date(d)
  const yF = d => d

  const size = [640, 480]
  const margin = ({top: 20, right: 20, bottom: 30, left: 60})

  const seriesData = dataset.getUniqueValues(sField).map(d => dataset.query({[xField]: d}))
  const xValues = dataset.getUniqueValues(xField).map(xF)

  const interactionState = {focused: null, selected: new Set()} 

  function uniqueColoring(d, i) {
    return d3.scaleOrdinal()
      .domain(dataset.getUniqueValues(sField))
      .range(d3.schemeCategory10)(d[sField])
  }

  function politicalColoring(d, i) {
    return d.government == "Rep" ? "Red" : "Blue" 
  }

  function maskColoring(d, i) {
    const cols = new Map([
      ["No state/territorial mask mandate", "red"],
      ["State-wide/territory-wide mask mandate", "lightgreen"],
      ["State/territorial mask mandate in some counties", "orange"]
    ])
    return cols.has(d.mask_mandate) ? cols.get(d.mask_mandate) : "grey"
  }

  var svg = d3.create("svg")
    .attr("width", size[0])
    .attr("height", size[1])

  const scaleX = d3.scaleLinear()
    .domain(d3.extent(xValues))
    .range([margin.left, size[0] - margin.right])
    .nice()

  // TODO: Fix gradient smoothing issue (its due to the individual line segments)
  // Add gradients
  for (const [coloringKey, colorFunction] of coloringMap.entries()) {
    const uids = seriesData.map((_, i) => `color-${coloringKey}-${i}`)
    for (const [i, series] of seriesData.entries()) {
      svg.append("linearGradient")
        .attr("id", uids[i])
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("x2", size[0])
        .selectAll("stop")
          .data(series)
          .join("stop")
            .attr("offset", d => scaleX(xF(d.date)) / size[0])
            .attr("stop-color", colorFunction)
    }
  }

  const xAxis = g => g
  .attr("id", "xAxis")
  .attr("transform", `translate(0,${size[1] - margin.bottom})`)
  .call(d3.axisBottom(scaleX)
    .ticks(size[0] / 120)
    .tickSizeOuter(0)
    .tickFormat(d => new Date(d).toISOString().slice(0, 10)))

  svg.append("g")
    .call(xAxis)

  var colorFunction = uniqueColoring

  function create(yField) {
    svg.select("#yAxis").remove()
    svg.select("#datapaths").remove()

    const scaleY = d3.scaleLinear()
      .domain(d3.extent(dataset.data.map(d => yF(d[yField])))).nice()
      .range([size[1] - margin.bottom, margin.top])  


    const yAxis = g => g 
      .attr("id", "yAxis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(scaleY))
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(ySelect.options[ySelect.selectedIndex].text))


    svg.append("g")
      .call(yAxis)

    const line = d3.line()
      .x(d => scaleX(xF(d[xField])))
      .y(d => scaleY(yF(d[yField])))

    const uids = seriesData.map((d, i) => "color-"+i)
    
    const path = svg.append("g")
      .attr("id", "datapaths")
      .attr("fill", "none")
      .attr("stroke-width", 1.3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(seriesData)
    .join("path")
      .style("mix-blend-mode", "multiply")
      .attr('d', line)
      //.attr("stroke", (_, i) => `url(#${uids[i]})`)
      .attr("stroke", interactiveColorFunction)
      //.attr("stroke", (_, i) => `url(#color-2)`)



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

    svg.append("g")
      .attr("id", "labels")
      .style("pointer-events", "none")
    
    svg
      .on("mouseenter", entered)
      .on("mouseleave", left)
      .on("mousemove", moved)
      .on("click", clicked)

    function updateText() {
      const showText = seriesData.filter(
        s => interactionState.selected.has(s[0][sField]) || s[0][sField] == interactionState.focused
      )
      
      svg.select("#labels")
        .selectAll("text")
        .data(showText)
        .join("text")
            .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .attr("text-anchor", "left")
          .attr("fill", "black")
          .attr("x", d => scaleX(xF(d[d.length-1][xField])))
          .attr("y", d => scaleY(yF(d[d.length-1][yField])))
          .text(d => d[0][sField])
    }
  
    function moved(e) {
      e.preventDefault()
      const pointer = d3.pointer(e, this)
      const xm = scaleX.invert(pointer[0])
      const ym = scaleY.invert(pointer[1])
      
      const i = d3.bisectCenter(xValues, xm)
      const s = d3.least(seriesData, series => Math.abs(series[i][yField] - ym)) 
          
      const p = [scaleX(xValues[i]), scaleY(s[i][yField])]
      if (Math.abs(p[1] - pointer[1]) < 30) {
        interactionState.focused = s[i][sField]
        path.attr("stroke", interactiveColorFunction)
        dot.attr("transform", `translate(${p[0]},${p[1]})`);
        dot.select("text").text(s[i][sField]);
        dot.attr("visibility", "visible")
      } else {
        interactionState.focused = null
        dot.attr("visibility", "hidden")
        path.attr("stroke", interactiveColorFunction)
      }
    }
    
    function entered(e) {
      interactionState.focused = null
      path.attr("stroke", interactiveColorFunction)
      dot.attr("visibility", "visible")
    }
    
    function left(e) {
      interactionState.focused = null
      path.attr("stroke", interactiveColorFunction)
      dot.attr("visibility", "hidden")
    }
    
    function clicked(e) {
      if (interactionState.focused) {
        interactionState.selected.add(interactionState.focused) 
      } else {
        interactionState.selected.clear()
      }
      path.attr("stroke", interactiveColorFunction)
      updateText()
    }

    return svg
  }

  function interactiveColorFunction(d, i) {
    if (interactionState.focused != null && d[0][sField] === interactionState.focused) { 
      return `url(#color-${colorSelect.value}-${i})`
    } else if (interactionState.selected.size > 0 && interactionState.selected.has(d[0][sField])) {
      return `url(#color-${colorSelect.value}-${i})`
    } else if (interactionState.selected.size == 0 && interactionState.focused == null) {
      return `url(#color-${colorSelect.value}-${i})`
    } else {
      return "rgb(240, 240, 240)"
    }
  }

    
  const fig1 = d3.select("#fig1_time_series")
    .append(d => svg.node())

  const ySelect = document.createElement("select")
  ySelect.id = "fig1_sel_yField"
  ySelect.onchange = e => {
    const val = ySelect.value
    d3.select("#fig1_time_series").select("svg").remove()
    svg = create(val)
    d3.select("#fig1_time_series")
      .append(d => svg.node())
  }
  for (const [fieldName, field] of yFieldMap.entries()) {
    var option = document.createElement("option")
    option.value = field
    option.text = fieldName
    ySelect.appendChild(option)
  }
  const yDiv = document.createElement("div")
  yDiv.innerHTML += "Coloring:  "
  yDiv.appendChild(ySelect)
  document.getElementById("fig1_controls").appendChild(yDiv)

  const colorDiv = document.createElement("div")
  const colorSelect = document.createElement("select")
  colorSelect.id = "fig1_sel_coloring"
  colorSelect.onchange = e => {
    //colorFunction = coloringMap.get(colorSelect.value)
    console.log(`color-${colorSelect.value}-${0}`)
    svg.select("#datapaths").selectAll("path")
      .attr("stroke", interactiveColorFunction)
      //.attr("stroke", d => interactiveColorFunction(d[0]))
      //.attr("stroke", d => {console.log(d); return "black"})
  }
  for (const [coloringName, coloring] of coloringMap.entries()) {
    var option = document.createElement("option")
    option.value = coloringName
    option.text = coloringName
    colorSelect.appendChild(option)
  }
  colorDiv.innerHTML += "Coloring:  "
  colorDiv.appendChild(colorSelect)
  document.getElementById("fig1_controls").appendChild(colorDiv)

  create("covid_cases")

})



// console.log(data)

// const blueSquare = d3.create("svg")
//   .attr("width", 200)
//   .attr("height", 200)
//   .style('background-color', "blue")

// const fig1 = d3.select("#fig1")
// console.log(fig1.select("#time_series"))
// fig1.select("#time_series")
//   .append(d => blueSquare.node())