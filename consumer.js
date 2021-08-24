class Consumer {
  /**
   * @private
   * @type {ExpiryItem[]}
   */
  store = [];

  /**
   * @private
   * The time-to-live in milliseconds
   */
  ttl = null;

  /**
   * @private
   * Garbage collector timer
   */
  gc = null;

  /**
   * @private
   * Cached mean
   * */
  _mean = 0;

  /**
   *
   * @param {number} ttl The time-to-live in milliseconds (defaults to 5 minutes)
   */
  constructor(ttl = 60 * 1000 * 5) {
    this.ttl = ttl;
  }

  /**
   * Consumes an integer
   *
   * @param {number} number the integer to consume
   */
  accept(number) {
    this.store.push(new ExpiryItem(number, this.ttl));
    // clear mean cache as it is no longer valid
    this._mean = null;
    this.startGarbageCollector();
  }

  /**
   * Returns the mean (aka average) of integers consumed in the last 5 minute period
   * @returns {number} the mean
   */
  mean() {
    // return cached mean if we have one
    if (this._mean != null) {
      /** cache hit **/
      return this._mean;
    }

    /** cache miss **/
    this._mean = this.calculate();
    return this._mean;
  }

  /**
   * @private
   * Calculate the mean
   */
  calculate() {
    // if no items in the store, return zero
    if (this.store.length === 0) {
      return 0;
    }

    // if sum is zero, return zero
    const sum = this.store.reduce((acc, item) => acc + item.value, 0);
    if (sum === 0) {
      return 0;
    }

    // calculate mean
    return sum / this.store.length;
  }

  /** @private */
  executeGarbageCollector() {
    const len = this.store.length;

    // 'i' doubles as index and number of items that will be removed
    let i = 0;

    while (i < len) {
      const item = this.store[i];

      // break out of loop as the rest of the items are 'newer' (not expired)
      if (!item.isExpired) {
        break;
      }

      i++;
    }

    // do the actual removal of expired items in the store
    if (i > 0) {
      this.store.splice(0, i);
      // clear mean cache as it is no longer valid
      this._mean = null;
    }
  }

  /**
   * @private
   * Starts the garbage collector if it's not yet running
   */
  startGarbageCollector() {
    // exit early if gc is already running
    if (this.gc != null) {
      return;
    }

    // execute garbage collector once
    this.gc = setInterval(() => {
      this.executeGarbageCollector();
      this.stopGarbageCollector();
    }, this.ttl);
  }

  /**
   * Stop the garbage collector if it's running
   */
  stopGarbageCollector() {
    // exit early if gc is not running
    if (this.gc == null) {
      return;
    }

    // clear gc timer
    clearInterval(this.gc);
    this.gc = null;
  }
}

class ExpiryItem {
  constructor(value, ttl) {
    this.value = value;

    /** @private */
    this.expiry = new Date().getTime() + ttl;
  }

  /**
   * Whether the item is expired
   */
  get isExpired() {
    return new Date().getTime() > this.expiry;
  }
}

module.exports = Consumer;
