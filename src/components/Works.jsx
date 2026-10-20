import { useState } from 'react';
import { projects, projectFilters } from '../data/profile';
import GamePlayer from './GamePlayer';

function ProjectVisual({ project }) {
  if (project.image) return <img src={project.image} alt={`${project.name}: ${project.imageNote}`} loading='lazy' className={`project-image ${project.id === 'kekedrop' ? 'is-mobile-shot' : ''}`} />;
  return <div className={`project-art project-art-${project.visual}`} aria-hidden='true'><span className='art-orbit orbit-one' /><span className='art-orbit orbit-two' /><span className='art-code'>{project.visual === 'tracking' ? 'A ━━━ B' : project.visual === 'game' ? 'W' : '50 / 50'}</span><span className='art-caption'>{project.kind}</span></div>;
}
export default function Works() {
  const [filter, setFilter] = useState('All work');
  const [playing, setPlaying] = useState(false);
  const visible = projects.filter(p => filter === 'All work' || p.categories.includes(filter));
  return <section className='section-shell work-section' id='projects'>
    {playing && <GamePlayer onClose={() => setPlaying(false)} />}
    <div className='section-heading split-heading'><div><p className='eyebrow'>02 / SELECTED WORK</p><h2>Real products.<br />From end to end<span className='accent-dot'>.</span></h2></div><p>Business software, mobile apps and interfaces. Explore the complete product—or the part of the stack you’re interested in.</p></div>
    <div className='project-filters' role='group' aria-label='Filter projects'>{projectFilters.map(label => <button key={label} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}</div>
    <p className='sr-only' aria-live='polite'>{visible.length} projects shown</p>
    <div className='project-grid'>{visible.map(project => <article key={project.id} className={`project-card ${project.id === 'cresol-erp' ? 'flagship-card' : ''}`}>
      <div className='project-visual'><ProjectVisual project={project} /><span className='project-status'>{project.status}</span><span className='project-number'>{project.number}</span></div>
      <div className='project-copy'><p className='project-kind'>{project.kind}</p><h3>{project.name}</h3><p className='project-description'>{project.description}</p><p className='project-contribution'>{project.contribution}</p><div className='project-stack'>{project.stack.map(item => <span key={item}>{item}</span>)}</div><details className='project-details'><summary>What’s inside <span aria-hidden='true'>+</span></summary><ul>{project.details.map(item => <li key={item}>{item}</li>)}</ul></details><div className='project-links'>{project.id === 'waffles' && <button className='project-play' type='button' onClick={() => setPlaying(true)}>Play here <span aria-hidden='true'>▶</span></button>}{project.links.map(link => <a key={link.href} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel='noreferrer'>{link.label} <span aria-hidden='true'>↗</span></a>)}</div><small className='image-note'>{project.imageNote || 'Project illustration · not a product screenshot'}</small></div>
    </article>)}</div>
  </section>;
}
