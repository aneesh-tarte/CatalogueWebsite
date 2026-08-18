const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Catalogue Dashboard API',
            version: '1.0.0',
            description: 'Interactive API documentation for the Catalogue Dashboard backend',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
            {
                url: 'https://catalogue-website-ten.vercel.app',
                description: 'Production server',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    // Scan all route files for Swagger annotations
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
