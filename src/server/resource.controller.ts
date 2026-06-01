import { Request, Response } from 'express';
import { ResourceService } from './resource.service';

const resourceService = new ResourceService();

export class ResourceController {
    public static getResources(req: Request, res: Response): void {
        try {
            const result = resourceService.getResources({
                filter: req.query.$filter as string,
                orderby: req.query.$orderby as string,
                top: req.query.$top as string,
                skip: req.query.$skip as string
            });

            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
