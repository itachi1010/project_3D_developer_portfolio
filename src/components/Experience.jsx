import { useEffect, useState } from 'react';
import { experiences as initialExperiences } from '../data/profile';
export default function Experience() {
  const [experiences, setExperiences] = useState(initialExperiences);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/jobs', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data?.jobs) && data.jobs.length) setExperiences(data.jobs);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <section className='section-shell experience-section' id='experience'><div className='section-heading'><p className='eyebrow'>04 / EXPERIENCE</p><h2>Built in the real world.</h2></div><div className='experience-list'>{experiences.map((item, index) => <article className='experience-row' key={item.id || `${item.company_name}-${item.title}`}><div className='experience-date'><span className='timeline-dot' /><span>{item.date}</span><small>{item.location}</small></div><div className='experience-content'><p className='eyebrow'>{item.company_name}</p><h3>{item.title}</h3><ul>{(item.points?.length ? item.points : [item.description]).filter(Boolean).map(point => <li key={point}>{point}</li>)}</ul></div><span className='experience-index'>0{index + 1}</span></article>)}</div></section>;
}
