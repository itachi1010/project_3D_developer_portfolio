import { person } from '../data/profile';

export default function Hero() {
  return <section className='hero-section portrait-hero' id='home'>
    <div className='hero-grid' aria-hidden='true' />
    <div className='hero-content'>
      <p className='eyebrow'><span className='status-dot' /> {person.location} · Software Engineer</p>
      <p className='hero-greeting'>Hello, I’m</p>
      <h1>Benedict<br /><span className='gradient-text'>Chuks-Onah.</span></h1>
      <p className='hero-description'>I turn real business needs into <strong>reliable backends, thoughtful web experiences and mobile apps.</strong> From Django-powered operations to published Android products, I take ideas through to a working release.</p>
      <div className='hero-actions'><a className='button-primary' href='#projects'>Explore my work <span aria-hidden='true'>↗</span></a><a className='button-quiet' href={person.resume}>Download résumé <span aria-hidden='true'>↓</span></a></div>
      <div className='hero-facts'><span><strong>Web + mobile</strong>One connected product</span><span><strong>Backend first</strong>Built for real workflows</span></div>
    </div>
    <figure className='hero-portrait'>
      <div className='portrait-halo' aria-hidden='true' />
      <div className='portrait-frame'>
        <img src='/images/benedict-chuks-onah.jpeg' alt='Benedict Chuks-Onah, software engineer' width='979' height='1094' fetchPriority='high' decoding='async' />
        <figcaption><span>THE ENGINEER BEHIND THE WORK</span><strong>{person.name}</strong><p>Backend · Web · Mobile</p></figcaption>
      </div>
      <div className='portrait-note'><span aria-hidden='true'>{'{ }'}</span><div>From idea to something useful.<small>Designed, built, shipped.</small></div></div>
      <span className='portrait-coordinate' aria-hidden='true'>01 / A PERSONAL INTRODUCTION</span>
    </figure>
    <a href='#about' className='scroll-link'>GET TO KNOW ME <span aria-hidden='true'>↓</span></a>
  </section>;
}
