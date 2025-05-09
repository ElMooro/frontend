const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // FRED API Proxy
  app.use(
    '/fred',
    createProxyMiddleware({
      target: 'https://api.stlouisfed.org/fred',
      changeOrigin: true,
      pathRewrite: {
        '^/fred': '', // Remove /fred prefix when making the request
      },
      onProxyReq: (proxyReq) => {
        // Add your FRED API key to all requests
        const url = new URL(proxyReq.path, 'https://api.stlouisfed.org');
        url.searchParams.append('api_key', 'a8df6aeca3b71980ad53ebccecb3cb3e');
        proxyReq.path = url.pathname + url.search;
      },
    })
  );

  // BEA API Proxy
  app.use(
    '/bea',
    createProxyMiddleware({
      target: 'https://apps.bea.gov/api/data',
      changeOrigin: true,
      pathRewrite: {
        '^/bea': '', // Remove /bea prefix when making the request
      },
      onProxyReq: (proxyReq) => {
        // Add your BEA API key to all requests
        const url = new URL(proxyReq.path, 'https://apps.bea.gov');
        url.searchParams.append('UserID', '997E5691-4F0E-4774-8B4E-CAE836D4AC47');
        proxyReq.path = url.pathname + url.search;
      },
    })
  );

  // Census API Proxy
  app.use(
    '/census',
    createProxyMiddleware({
      target: 'https://api.census.gov/data',
      changeOrigin: true,
      pathRewrite: {
        '^/census': '', // Remove /census prefix when making the request
      },
      onProxyReq: (proxyReq) => {
        // Add your Census API key to all requests
        const url = new URL(proxyReq.path, 'https://api.census.gov');
        url.searchParams.append('key', '8423ffa543d0e95cdba580f2e381649b6772f515');
        proxyReq.path = url.pathname + url.search;
      },
    })
  );

  // BLS API Proxy
  app.use(
    '/bls',
    createProxyMiddleware({
      target: 'https://api.bls.gov/publicAPI/v2',
      changeOrigin: true,
      pathRewrite: {
        '^/bls': '', // Remove /bls prefix when making the request
      },
      onProxyReq: (proxyReq) => {
        // For BLS, API key is typically sent in the request headers or body
        proxyReq.setHeader('BLS-API-Key', 'a759447531f04f1f861f29a381aab863');
      },
    })
  );

  // ECB API Proxy
  app.use(
    '/ecb',
    createProxyMiddleware({
      target: 'https://sdw-wsrest.ecb.europa.eu/service',
      changeOrigin: true,
      pathRewrite: {
        '^/ecb': '', // Remove /ecb prefix when making the request
      },
    })
  );

  // NY Fed API Proxy
  app.use(
    '/nyfed',
    createProxyMiddleware({
      target: 'https://markets.newyorkfed.org/api',
      changeOrigin: true,
      pathRewrite: {
        '^/nyfed': '', // Remove /nyfed prefix when making the request
      },
    })
  );

  // US Treasury API Proxy
  app.use(
    '/treasury',
    createProxyMiddleware({
      target: 'https://www.treasurydirect.gov/TA_WS',
      changeOrigin: true,
      pathRewrite: {
        '^/treasury': '', // Remove /treasury prefix when making the request
      },
    })
  );
};
