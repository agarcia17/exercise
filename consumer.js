class Consumer {
  /**
   * @private
   * Holds references to pending timeouts
   */
  timeouts = {};

  /**
   * @private
   * The time-to-live in milliseconds
   */
  ttl = null;

  /**
   * @private
   * The running sum
   */
  sum = 0;

  /**
   * @private
   * The running length
   */
  length = 0;

  /**
   * @private
   * Cached values
   */
  cache = {
    sum: 0,
    length: 0,
    mean: 0,
  };

  /**
   * @private
   * Tracks if instance is disposed
   */
  isDisposed = false;

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
    if (this.isDisposed) {
      throw new Error('A disposed Consumer instance cannot accept any numbers');
    }

    this.sum += number;
    this.length++;

    const id = setTimeout(() => {
      this.sum -= number;
      this.length--;
      clearTimeout(id);
      delete this.timeouts[id];
    }, this.ttl);

    this.timeouts[id] = id;
  }

  /**
   * Returns the mean (aka average) of integers consumed in the last 5 minute period
   * @returns {number} the mean
   */
  mean() {
    if (this.isDisposed) {
      throw new Error('Cannot compute mean of a disposed Consumer instance.');
    }

    if (this.sum === this.cache.sum && this.length === this.cache.length) {
      /** cache hit **/
      return this.cache.mean;
    }

    /** cache miss **/

    this.cache = {
      sum: this.sum,
      length: this.length,
      mean: this.calculate(),
    };

    return this.cache.mean;
  }

  /**
   * @private
   * Calculate the mean
   */
  calculate() {
    if (this.length === 0) {
      return 0;
    }

    if (this.sum === 0) {
      return 0;
    }

    // calculate mean
    return this.sum / this.length;
  }

  /**
   * @private
   * Clear all pending timeouts
   */
  dispose() {
    if (this.isDisposed) {
      return;
    }

    Object.keys(this.timeouts).forEach(clearTimeout);
  }
}

module.exports = Consumer;
