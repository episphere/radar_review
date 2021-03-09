class Dataset {
  constructor(data, indexFields) {
    this.data = data
    this.indexedData = new Map()
    this.indexFieldValues = new Map()
    this.indexKeys = new Set()
    
    if (indexFields) {
      this.indexFields(indexFields)
    }
  }
  
  indexFields(indexFields) {
    indexFields.forEach(indexField => this.indexFieldValues.set(indexField, new Set()))
    this.indexKeys.add(indexFields.join("@"))
    
    for (const row of this.data) {
      const indexKey = indexFields.map(d => row[d]).join("@")
      var ixRows = this.indexedData.get(indexKey)
      if (!ixRows) {
        ixRows = []
        this.indexedData.set(indexKey, ixRows)
      }
      ixRows.push(row)

      for (const indexField of indexFields) {
        this.indexFieldValues.get(indexField).add(row[indexField])
      }
    }
    
    for (const [field, values] of this.indexFieldValues.entries()) {
      const valueArr = [...this.indexFieldValues.get(field)]
      this.indexFieldValues.set(field, valueArr.sort())
    }
  }
  
  query(query) {
    const cIndexFields =  [...Object.keys(query)]
    const indexKey = cIndexFields.join("@")
    if (!this.indexKeys.has(indexKey)) {
      this.indexFields(cIndexFields)
    }
    const cKey = [...Object.values(query)].join("@")
    return this.indexedData.get(cKey)
  }

  queryOne(queryObj) {
    return this.query(queryObj)[0]
  }
  
  getUniqueValues(indexField) {
    if (!this.indexKeys.has(indexField)) {
      this.indexFields([indexField])
    }
    
    return this.indexFieldValues.get(indexField) 
  }
}