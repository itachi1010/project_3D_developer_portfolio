import { skillGroups } from '../data/profile';
export default function Tech() {
  return <section className='section-shell skills-section' id='skills'><div className='section-heading'><p className='eyebrow'>THE TOOLBOX</p><h2>The right tools.<br />A connected system.</h2></div><div className='skills-grid'>{skillGroups.map((group, index) => <article className='skill-group' key={group.name}><span className='small-index'>0{index + 1}</span><h3>{group.name}</h3><div className='skill-tags'>{group.items.map(item => <span key={item}>{item}</span>)}</div></article>)}</div></section>;
}
