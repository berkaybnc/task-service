const promClient = require("prom-client");

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDurationSeconds = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

function shouldSkipMetrics(req) {
  return req.path === "/metrics";
}

function metricsMiddleware() {
  return (req, res, next) => {
    if (shouldSkipMetrics(req)) return next();
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const route = req.route?.path || req.path || "unknown";
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };
      httpRequestsTotal.inc(labels);
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      httpRequestDurationSeconds.observe(labels, durationSec);
    });
    next();
  };
}

async function metricsHandler(req, res) {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler };
