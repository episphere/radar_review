import { TimeSeries } from "./classes/TimeSeries.js";
import { DynamicState } from "./classes/DynamicState.js";
import { ParallelPlot } from "./classes/ParallelPlot.js";
import { ScatterPlot } from "./classes/ScatterPlot.js";

// TODO: Update data
// TODO: Rename political fields
d3.json("data/data_v2.json").then(data => {
  for (const row of data) {
    for (const field of Object.keys(row)) {
      if (field.endsWith("_p")) {
        row[field] = row[field] * 100000
      }
    }
  }

  const dataset = TAFFY(data)
  setUp(dataset)

  function createState() {
    const state = new DynamicState()
    state.defineProperty("dataset", dataset)
    state.defineProperty("tValue", defaults.T_VALUE)
    state.defineProperty("coloring", defaults.COLORING_MAP.get(defaults.COLORING))
    state.defineProperty("tracesEnabled", defaults.TRACES_ENABLED)
    state.defineProperty("selected", new Set())
    state.defineProperty("focus", null)
    return state
  }

  function createBar(figId) {
    const fig = document.getElementById(figId)
    const figBar = document.createElement("div")
    figBar.id = `${figId}-bar`
    figBar.className = "info-bar"
    fig.prepend(figBar)
    return figBar
  }

  function updateBar(bar, p, v) {
    if (p == "coloring") {
      if (bar.firstChild) {
        bar.removeChild(bar.firstChild)
      }
      if (v.values) {
        bar.append(createColorKey(v.values, v.continuous))
      }
    }
  }


  const stateFig1 = createState()

  // TODO: Un-hardcode figure widths
  const timeSeries = new TimeSeries(
    "fig1-ts", defaults.Y_FIELD, defaults.S_FIELD, defaults.T_FIELD, stateFig1,
    {
      coloringMap: defaults.COLORING_MAP, 
      interactiveColor: defaults.INTERACTIVE_LINE_COLOR, 
      xTickFormat: v => new Date(v).toISOString().slice(0, 10),
      yTickFormat: v => d3.format(".0f")(v ),
      yTooltipFormat: v => d3.format(".2f")(v),
      size: [704,360],
      margin: {left: 40, right: 20, bottom:20, top:5}
    }
  )
  
  const barFig1 = createBar("fig1")
  
  stateFig1.addListener((p, v) => timeSeries.stateChange(p, v))
  stateFig1.addListener((p, v) => updateBar(barFig1, p, v))

  createTimeSeriesControls("fig1", timeSeries)
    

  const stateFig2 = createState()

  const scatterFig2 = new ScatterPlot(
    "fig2-scatter", defaults.X_FIELD, defaults.Y_FIELD, defaults.S_FIELD, defaults.T_FIELD, stateFig2,
    {
      interactiveColor: defaults.INTERACTIVE_COLOR, 
      size: [480, 480],
      trimStd: 2,
      margin: {left: 40, right: 20, bottom:20, top:10},
      xTooltipFormat: v => d3.format(".2f")(v),
      yTooltipFormat: v => d3.format(".2f")(v)
    }
  )

  const barFig2 = createBar("fig2")

  stateFig2.addListener((p, v) => scatterFig2.stateChange(p, v))
  stateFig2.addListener((p, v) => updateBar(barFig2, p, v))

  createScatterControls("fig2", scatterFig2,  [...defaults.Y_FIELD_MAP.entries()], 
    "covid_new_death_mean_p", "covid_cases_p")


  const stateFig3 = createState()

  const scatterFig3 = new ScatterPlot(
    "fig3-scatter", "pc1", "pc2", defaults.S_FIELD, defaults.T_FIELD, stateFig3,
    {
      interactiveColor: defaults.INTERACTIVE_COLOR, 
      size: [350, 350],
      margin: {left: 40, right: 20, bottom:20, top:20},
      trimStd: 2,
      proportionalResize: true,
      xTooltipFormat: v => d3.format(".2f")(v),
      yTooltipFormat: v => d3.format(".2f")(v)
    }
  )
  const parallel = new ParallelPlot(
    "fig3-pcp", defaults.S_FIELD, defaults.T_FIELD, [...defaults.Y_FIELD_MAP.values()], stateFig3,
    {interactiveColor: defaults.INTERACTIVE_COLOR, size: [350, 350]})
  
  const barFig3 = createBar("fig3")

  stateFig3.addListener((p, v) => scatterFig3.stateChange(p, v))
  stateFig3.addListener((p, v) => parallel.stateChange(p, v))
  stateFig3.addListener((p, v) => updateBar(barFig3, p, v))

  createScatterControls("fig3", scatterFig3)

})

