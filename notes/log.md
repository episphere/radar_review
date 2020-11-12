# Log

## 29/10/2020 | Week

* Searching for good sources of epidemiological data, with a focus on data which is easily obtained using an API. Main takeaway so far is that a lot of institutions provide a lot of decent open data, but good APIs are not common. Consistent, easy-to-use APIs (such as https://dev.socrata.com/) appear to be the exception. Three issues I have encountered are:

  * Outdated / non-functioning API documentation (e.g. https://fingertips.phe.org.uk/api)
  * Poor CORS policy handling, meaning a CORS proxy has to be used. This would be fine for a server-side application, but is more problematic for browser-based applications (as is our preference) (e.g. the [GHO API](https://www.who.int/data/gho/info/gho-odata-api))
  * Very inconsistent data formats. This is to be expected. For example, the WHO API defines its dimension names in incrementally numbered top-level fields ("Dim1", "Dim2", ...) whereas the UN SDG API defines its dimensions in a "dimensions" sub-object.

* Most sources can provide their data in JSON format. The most robust sources offer several options (including CSV, RDF, XML). Some sources don't offer JSON, but instead usually provide XML or RDF. Not enough places provide RDF for this to be a simple linked data task!

## 05/11/2020 | Week  

* Exploring methods of heterogenous data integration. 
    * This topic appears to fall under several topics (data/schema/ontology integration/matching), and differences between them are not immediately obvious. 
    * Effective data integration is important to ensure the flexibility of the radar while minimizing the effort required by the user. Naturally, more robust automatic integration requires less user effort, but increases the complexity of the software. A balance needs to be struct between these two elements. 
    * A well considered set of data assumptions is useful in defining this task. The looser the assumptions, the more robust the automatic integration must be (one extreme would be a system that is capable of working on any data representation, regardless of whether it has seen it before). The stronger the assumptions, the greater the programming work required to ensure compatability with all desired sources of data. With the emergence of novel data formats, the greater long term maintanence work is required to keep the software relevant. 
    * The review should weigh-up all these points, providing examples.
* Exploring heterogenous data visualisation (early stages)
    * Example simple tree visualisations of multiple JSON-formatted sources of COVID-19 data ([Observable Notebook](https://observablehq.com/d/6b3abc116c95288f)).
    * Natural next steps may include: force-directed trees, user interaction.

