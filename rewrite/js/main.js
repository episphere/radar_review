import { TimeSeries } from "./TimeSeries.js";
import { DynamicState } from "./DynamicState.js";
import { ParallelPlot } from "./ParallelPlot.js";
import { ScatterPlot } from "./ScatterPlot.js";

// TODO: Should the diagrams' state be linked? If so, fix sync issue with UI components and coloring
d3.json("data/data.json").then(data => {
  const dataset = TAFFY(data)
  setUp(dataset)

  const state = new DynamicState()
  state.defineProperty("dataset", dataset)
  state.defineProperty("tValue", defaults.T_VALUE)
  state.defineProperty("coloring", defaults.COLORING_MAP.get(defaults.COLORING))
  state.defineProperty("tracesEnabled", defaults.TRACES_ENABLED)
  state.defineProperty("selected", new Set())
  state.defineProperty("focus", null)

  // TODO: Un-hardcode figure widths
  const timeSeries = new TimeSeries(
    "fig1-ts", defaults.Y_FIELD, defaults.S_FIELD, defaults.T_FIELD, state,
    {
      coloringMap: defaults.COLORING_MAP, 
      interactiveColor: defaults.INTERACTIVE_LINE_COLOR, 
      xTickFormat: v => new Date(v).toISOString().slice(0, 10),
      yTickFormat: v => d3.format(".3f")(v * 100),
      size: [704,360],
      margin: {left: 40, right: 20, bottom:20, top:5}
    }
  )

  const fig1 = document.getElementById("fig1")
  const fig1Bar = document.createElement("div")
  fig1Bar.id = "fig1-bar"
  fig1Bar.className = "info-bar"
  //fig1Bar.append(createColorKey([[0, "blue"], [1, "red"]], true))
  //fig1Bar.append(createColorKey([["Blue", "blue"], ["Red", "red"]], false))
  fig1.prepend(fig1Bar)

  createTimeSeriesControls("fig1", timeSeries)
    
  const scatterFig2 = new ScatterPlot(
    "fig2-scatter", defaults.X_FIELD, defaults.Y_FIELD, defaults.S_FIELD, defaults.T_FIELD, state,
    {interactiveColor: defaults.INTERACTIVE_COLOR, size: [360, 360]})

  createScatterControls("fig2", scatterFig2,  [...defaults.Y_FIELD_MAP.entries()], 
    "covid_deaths", "covid_cases")

  // TODO: Make PCP equal axes
  const scatterFig3 = new ScatterPlot(
    "fig3-scatter", "pc1", "pc2", defaults.S_FIELD, defaults.T_FIELD, state,
    {
      interactiveColor: defaults.INTERACTIVE_COLOR, 
      size: [350, 350],
      margin: {left: 40, right: 20, bottom:20, top:20}
    }
  )
  const parallel = new ParallelPlot(
    "fig3-pcp", defaults.S_FIELD, defaults.T_FIELD, [...defaults.Y_FIELD_MAP.values()], state,
    {interactiveColor: defaults.INTERACTIVE_COLOR, size: [350, 350]})
  
  createScatterControls("fig3", scatterFig3, [...defaults.PCA_FIELD_MAP], "pc1", "pc2")

  state.addListener((p, v) => timeSeries.stateChange(p, v))
  state.addListener((p, v) => scatterFig2.stateChange(p, v))
  state.addListener((p, v) => scatterFig3.stateChange(p, v))
  state.addListener((p, v) => parallel.stateChange(p, v))
  state.addListener((p, v) => {
    if (p == "coloring") {
      if (fig1Bar.firstChild) {
        fig1Bar.removeChild(fig1Bar.firstChild)
      }
      if (v.values) {
        fig1Bar.append(createColorKey(v.values, v.continuous))
      }
    }
  })


  //createControls("fig2-control", scatter, parallel, state)
})

