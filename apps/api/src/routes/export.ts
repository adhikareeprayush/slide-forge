import { Router, type IRouter } from 'express';
import { getExportJobStatus } from '../services/export/status';

export const exportRouter: IRouter = Router();

exportRouter.get('/:exportJobId', async (req, res) => {
  const job = await getExportJobStatus(req.params.exportJobId);
  if (!job) {
    res.status(404).json({ error: 'Export job not found' });
    return;
  }
  res.json(job);
});
