const assert = require('assert');
const Consumer = require('./consumer');
const sinon = require('sinon');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Consumer', function () {
  this.timeout(60 * 1000); // 1 minute
  this.slow(30 * 1000); // 30 seconds

  describe('#mean', function () {
    it('should return 0', function () {
      const c = new Consumer();
      const mean = c.mean();
      c.stopGarbageCollector();
      assert.equal(mean, 0);
    });

    it('should return 3', function () {
      const c = new Consumer();
      c.accept(3);
      const mean = c.mean();
      c.stopGarbageCollector();
      assert.equal(mean, 3);
    });

    it('should return 6', function () {
      const c = new Consumer();
      c.accept(3);
      c.accept(6);
      c.accept(9);
      const mean = c.mean();
      c.stopGarbageCollector();
      assert.equal(mean, 6);
    });

    it('should return 10', async function () {
      const c = new Consumer(1000);
      c.accept(10);
      c.accept(10);
      c.accept(10);
      await sleep(100);
      const mean = c.mean();
      c.stopGarbageCollector();
      assert.equal(mean, 10);
    });

    it('should return 15 then 0', async function () {
      const c = new Consumer(2000);
      c.accept(20);
      c.accept(10);
      let mean = c.mean();
      assert.equal(mean, 15);
      await sleep(3000);
      mean = c.mean();
      c.stopGarbageCollector();
      assert.equal(mean, 0);
    });

    it('should return 25 then 30', async function () {
      const c = new Consumer(3000);
      c.accept(30);
      await sleep(1000);
      c.accept(20);
      let mean = c.mean();
      assert.equal(mean, 25);
      await sleep(2500);
      mean = c.mean();
      c.stopGarbageCollector();
      assert.equal(mean, 20);
    });

    it('should return 2 with cache hit', async function () {
      const c = new Consumer(3000);
      const spy = sinon.spy(c, 'calculate');
      c.accept(2);
      await sleep(1000);
      let mean = c.mean();
      assert.equal(mean, 2);
      await sleep(1000);
      mean = c.mean();
      assert.equal(mean, 2);
      assert.equal(spy.callCount, 1);
      c.stopGarbageCollector();
    });

    it('should return 2 with cache miss', async function () {
      const c = new Consumer(3000);
      const spy = sinon.spy(c, 'calculate');
      c.accept(2);
      await sleep(1000);
      let mean = c.mean();
      assert.equal(mean, 2);
      c.accept(2);
      await sleep(1000);
      mean = c.mean();
      assert.equal(mean, 2);
      assert.equal(spy.callCount, 2);
      c.stopGarbageCollector();
    });

    it('should return 4 with cache miss', async function () {
      const c = new Consumer(3000);
      const spy = sinon.spy(c, 'calculate');
      c.accept(4);
      await sleep(2000);
      c.accept(4);
      let mean = c.mean();
      assert.equal(mean, 4);
      await sleep(2500);
      mean = c.mean();
      assert.equal(mean, 4);
      assert.equal(spy.callCount, 2);
      c.stopGarbageCollector();
    });
  });
});
