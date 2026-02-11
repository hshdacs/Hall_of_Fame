const Queue = require("bull");

const buildQueue = new Queue("buildQueue", process.env.REDIS_URL, {
  settings: {
    // Docker builds can run for several minutes; keep lock long enough
    // so Bull does not mark active jobs as stalled and re-run them.
    lockDuration: 30 * 60 * 1000,
    stalledInterval: 60 * 1000,
    maxStalledCount: 1,
  },
});

buildQueue.defaultJobOptions = {
  attempts: 3,
  backoff: 5000,
  removeOnComplete: true,
  removeOnFail: {
    age: 3600,
  },
};

module.exports = buildQueue;
