export class DynamicState {

  constructor() {
    this.properties = {}
    this.listeners = []
  }

  defineProperty(property, value) {
    Object.defineProperty(this, property, {
      set: function(value) { this._setProperty(property, value) },
      get: function() { return this.properties[property] }
    })
    this._setProperty(property, value)
  }

  addListener(f) {
    this.listeners.push(f)
  }

  _setProperty(property, value) {
    this.properties[property] = value

    for (const listener of this.listeners) {
      listener(property, value)
    }
  }
}