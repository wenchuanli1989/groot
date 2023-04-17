
module.exports = {
  dev: {
    '/api/': {
      target: 'http://demo.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  qa: {
    '/api/': {
      target: 'http://demoqa.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
};