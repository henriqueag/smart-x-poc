import { Router } from 'express';
import { ResourceController } from './resource.controller';

const router = Router();

router.get('/resources', ResourceController.getResources);

export default router;
