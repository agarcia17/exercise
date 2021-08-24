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
      assert.equal(c.mean(), 0);
      c.dispose();
    });

    it('should return 3', function () {
      const c = new Consumer();
      c.accept(3);
      assert.equal(c.mean(), 3);
      c.dispose();
    });

    it('should return 6', function () {
      const c = new Consumer();
      c.accept(3);
      c.accept(6);
      c.accept(9);
      assert.equal(c.mean(), 6);
      c.dispose();
    });

    it('should return 10', async function () {
      const c = new Consumer(1000);
      c.accept(10);
      c.accept(10);
      c.accept(10);
      await sleep(100);
      assert.equal(c.mean(), 10);
      c.dispose();
    });

    it('should return 15 then 0', async function () {
      const c = new Consumer(2000);
      c.accept(20);
      c.accept(10);
      assert.equal(c.mean(), 15);
      await sleep(3000);
      assert.equal(c.mean(), 0);
      c.dispose();
    });

    it('should return 25 then 30', async function () {
      const c = new Consumer(3000);
      c.accept(30);
      await sleep(1000);
      c.accept(20);
      assert.equal(c.mean(), 25);
      await sleep(2500);
      assert.equal(c.mean(), 20);
      c.dispose();
    });

    it('should return 2 with cache hit', async function () {
      const c = new Consumer(3000);
      const spy = sinon.spy(c, 'calculate');
      c.accept(2);
      await sleep(1000);
      assert.equal(c.mean(), 2);
      await sleep(1000);
      assert.equal(c.mean(), 2);
      assert.equal(spy.callCount, 1);
      c.dispose();
    });

    it('should return 2 with cache miss', async function () {
      const c = new Consumer(3000);
      const spy = sinon.spy(c, 'calculate');
      c.accept(2);
      await sleep(1000);
      assert.equal(c.mean(), 2);
      c.accept(2);
      await sleep(1000);
      assert.equal(c.mean(), 2);
      assert.equal(spy.callCount, 2);
      c.dispose();
    });

    it('should return 4 with cache miss', async function () {
      const c = new Consumer(3000);
      const spy = sinon.spy(c, 'calculate');
      c.accept(4);
      await sleep(2000);
      c.accept(4);
      assert.equal(c.mean(), 4);
      await sleep(2500);
      assert.equal(c.mean(), 4);
      assert.equal(spy.callCount, 2);
      c.dispose();
    });
  });
});
