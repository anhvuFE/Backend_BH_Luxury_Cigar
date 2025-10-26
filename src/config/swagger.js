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
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            phone: { type: 'string' },
            avatar: {
              type: 'string',
              nullable: true,
              description: 'Legacy avatar image URL kept for backward compatibility'
            },
            image: {
              type: 'string',
              nullable: true,
              description: 'Primary profile image URL (mirrors avatar value)'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            brand: { type: 'string' },
            price: { type: 'number' },
            originalPrice: { type: 'number' },
            image: { type: 'string' },
            images: {
              type: 'array',
              items: { type: 'string' }
            },
            description: { type: 'string' },
            category: { type: 'string' },
            inStock: { type: 'boolean' },
            isNew: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
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
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
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
