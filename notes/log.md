# Log

## 29/20/2020 | Week

* Searching for good sources of epidemiological data, with a focus on data which is easily obtained using an API. Main takeaway so far is that a lot of institutions provide a lot of decent open data, but good APIs are not common. Consistent, easy-to-use APIs (such as https://dev.socrata.com/) appear to be the exception. Three issues I have encountered are:

  * Outdated / non-functioning API documentation (e.g. https://fingertips.phe.org.uk/api)
  * Poor CORS policy handling, meaning a CORS proxy has to be used. This would be fine for a server-side application, but is more problematic for browser-based applications (as is our preference) (e.g. the [GHO API](https://www.who.int/data/gho/info/gho-odata-api))
  * Very inconsistent data formats. This is to be expected. For example, the WHO API defines its dimension names in incrementally numbered top-level fields ("Dim1", "Dim2", ...) whereas the UN SDG API defines its dimensions in a "dimensions" sub-object.

* Most sources can provide their data in JSON format. The most robust sources offer several options (including CSV, RDF, XML). Some sources don't offer JSON, but instead usually provide XML or RDF. Not enough places provide RDF for this to be a simple linked data task!

  

  

