const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BH Luxury Cigar API',
      version: '1.0.0',
      description: 'API Documentation for BH Luxury Cigar E-commerce Platform',
      contact: {
        name: 'Xuan Anh',
        email: 'admin@bhcigar.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            phone: { type: 'string' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            brand: { type: 'string' },
            price: { type: 'number' },
            description: { type: 'string' },
            category: { type: 'string' },
            inStock: { type: 'boolean' },
            specifications: {
              type: 'object',
              properties: {
                origin: { type: 'string' },
                size: { type: 'string' },
                strength: { type: 'string' },
                wrapper: { type: 'string' },
                binder: { type: 'string' },
                filler: { type: 'string' }
              }
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            parent: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        BlogPost: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            excerpt: { type: 'string' },
            content: { type: 'string' },
            author: { type: 'string' },
            category: { type: 'string' },
            slug: { type: 'string' },
            isPublished: { type: 'boolean' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            items: { type: 'array' },
            shippingAddress: { type: 'object' },
            paymentMethod: { type: 'string' },
            totalPrice: { type: 'number' },
            orderStatus: { type: 'string' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Profile',
        description: 'User profile management'
      },
      {
        name: 'Products',
        description: 'Product management'
      },
      {
        name: 'Categories',
        description: 'Category management'
      },
      {
        name: 'Blogs',
        description: 'Blog post management'
      },
      {
        name: 'Orders',
        description: 'Order management'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/swagger/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;