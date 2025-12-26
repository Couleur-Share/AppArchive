export default {
  devServer: {
    port: 5173
  },
  nitro: {
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    }
  },
  serverHandlers: [
    {
      route: '/api/proxy',
      handler: '~/server/api/proxy'
    }
  ]
} 