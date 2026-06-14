export const apiDoc = {
  openapi: '3.1.0',
  info: {
    title: 'Flux API',
    version: '1.0.0',
    description: 'API documentation for Flux project management tool',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
}
