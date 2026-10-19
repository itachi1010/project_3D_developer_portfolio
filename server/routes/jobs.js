import express from 'express';
import { createJob, deleteJob, listJobs, updateJob } from '../db.js';

const router = express.Router();

const normalizePoints = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((point) => String(point).trim());
  }

  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((point) => point.trim())
      .filter(Boolean);
  }

  return [];
};

router.get('/', async (_req, res) => {
  try {
    const jobs = await listJobs();
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { title, company_name, date, location, description, points, iconBg } = req.body || {};

  if (!title || !company_name || !date) {
    return res.status(400).json({ message: 'Title, company name and date are required.' });
  }

  try {
    const job = await createJob({
      title,
      company_name,
      date,
      location,
      description,
      points: normalizePoints(points),
      iconBg,
    });

    res.status(201).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const job = await updateJob(id, {
      ...req.body,
      points: normalizePoints(req.body?.points),
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteJob(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    res.json({ message: 'Job removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete job', error: error.message });
  }
});

export default router;
