import { Router, type IRouter } from 'express';
import { getRegistry, getLayout, incrementLayoutDownloads } from '../services/layout-registry';

export const layoutsRouter: IRouter = Router();

layoutsRouter.get('/', (req, res) => {
  let list = getRegistry();
  const category = req.query.category as string | undefined;
  const sort = req.query.sort as string | undefined;

  if (category) {
    list = list.filter((l) => l.category === category);
  }

  if (sort === 'popular') {
    list = [...list].sort((a, b) => b.downloads - a.downloads);
  } else {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json({ layouts: list });
});

layoutsRouter.get('/:id', (req, res) => {
  const layout = getLayout(req.params.id);
  if (!layout) {
    res.status(404).json({ error: 'Layout not found' });
    return;
  }
  const meta = getRegistry().find((l) => l.id === req.params.id);
  res.json({ ...layout, meta });
});

layoutsRouter.post('/:id/use', (req, res) => {
  const layout = getLayout(req.params.id);
  if (!layout) {
    res.status(404).json({ error: 'Layout not found' });
    return;
  }
  const downloads = incrementLayoutDownloads(req.params.id);
  res.json({ id: req.params.id, downloads });
});
