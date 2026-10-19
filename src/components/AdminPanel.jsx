import { useEffect, useState } from 'react';

const defaultForm = {
  title: '',
  company_name: '',
  date: '',
  location: '',
  description: '',
  points: '',
  iconBg: '#383E56',
};

const AdminPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        points: form.points
          .split('\n')
          .map((point) => point.trim())
          .filter(Boolean),
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save job.');
      }

      setForm(defaultForm);
      setMessage('Job saved successfully.');
      await loadJobs();
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed right-4 top-4 z-50'>
      <button
        type='button'
        onClick={() => setIsOpen((current) => !current)}
        className='rounded-full bg-[#915eff] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#915eff]/30 transition hover:scale-105'
      >
        {isOpen ? 'Close admin' : 'Portfolio admin'}
      </button>

      {isOpen && (
        <div className='mt-3 w-[360px] rounded-2xl border border-white/10 bg-[#100d25] p-4 text-white shadow-2xl shadow-black/30'>
          <h3 className='text-lg font-semibold text-white'>Add a job</h3>

          <form className='mt-4 space-y-3' onSubmit={handleSubmit}>
            <input
              name='title'
              value={form.title}
              onChange={handleChange}
              placeholder='Role title'
              className='w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#915eff]'
            />
            <input
              name='company_name'
              value={form.company_name}
              onChange={handleChange}
              placeholder='Company name'
              className='w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#915eff]'
            />
            <div className='grid grid-cols-2 gap-3'>
              <input
                name='date'
                value={form.date}
                onChange={handleChange}
                placeholder='Date'
                className='w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#915eff]'
              />
              <input
                name='location'
                value={form.location}
                onChange={handleChange}
                placeholder='Location'
                className='w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#915eff]'
              />
            </div>
            <textarea
              name='description'
              value={form.description}
              onChange={handleChange}
              placeholder='Short description'
              rows='3'
              className='w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#915eff]'
            />
            <textarea
              name='points'
              value={form.points}
              onChange={handleChange}
              placeholder='One responsibility per line'
              rows='5'
              className='w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#915eff]'
            />
            <input
              name='iconBg'
              type='color'
              value={form.iconBg}
              onChange={handleChange}
              className='h-11 w-full rounded border border-white/20 bg-transparent p-1'
            />

            <button
              type='submit'
              disabled={loading}
              className='w-full rounded bg-[#915eff] px-4 py-2 font-medium text-white transition hover:bg-[#7b49ec] disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? 'Saving...' : 'Save job'}
            </button>
          </form>

          {message && <p className='mt-3 text-sm text-secondary'>{message}</p>}

          <div className='mt-5 border-t border-white/10 pt-4'>
            <h4 className='mb-2 text-sm font-semibold uppercase tracking-wider text-secondary'>Current jobs</h4>
            <div className='space-y-2'>
              {jobs.length === 0 ? (
                <p className='text-sm text-secondary'>No jobs yet.</p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className='rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white'>
                    <p className='font-semibold'>{job.title}</p>
                    <p className='text-secondary'>{job.company_name}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
