import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { ResourceController } from './resource.controller';

const app = express();
const PORT = 4201;

// Desabilita CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Context');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
    next();
});

app.use(express.json());

// Endpoint API
app.get('/api/resources', ResourceController.getResources);

// Definição OpenAPI/Swagger Manual para manter o código limpo
const swaggerDocument = {
    openapi: '3.0.0',
    info: { title: 'Report Resource API', version: '1.0.0', description: 'Servidor mock com suporte a paginação e filtros OData' },
    paths: {
        '/api/resources': {
            get: {
                summary: 'Recupera a lista paginada de recursos',
                parameters: [
                    { name: '$filter', in: 'query', schema: { type: 'string' }, description: "Ex: contains(displayName, 'Resource 1') e/ou isFavorite eq true" },
                    { name: '$top', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Quantidade de itens (pageSize)' },
                    { name: '$skip', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Deslocamento de itens (page * pageSize)' }
                ],
                responses: {
                    200: {
                        description: 'Sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        items: { type: 'array', items: { type: 'object' } },
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        pageSize: { type: 'integer' },
                                        totalPages: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
    console.log(`[Server] API: http://localhost:${PORT}/api/resources`);
    console.log(`[Server] Swagger Docs: http://localhost:${PORT}/docs`);
});
