// Create shared variables after loading dataset

d3.json("bothData.json").then(data => {
  setUp(data)
  createTimeSeriesPlot(dataset)
  createSimpleScatter(dataset, "fig2", yFieldMap, false, [450, 450],{top: 20, right: 10, bottom: 20, left: 60},
    d => d3.format(".3f")(d * 100))
  createSimpleScatter(dataset, "fig3", new Map([["PC1", "pc1"],["PC2", "pc2"]]), true, [350, 350], null, 
    d => d3.format(".3f")(d * 100))
})