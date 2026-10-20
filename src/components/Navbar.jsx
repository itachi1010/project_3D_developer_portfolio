import { useEffect, useState } from 'react';
import { person } from '../data/profile';

const links = [['about', 'About'], ['projects', 'Projects'], ['mobile', 'Mobile apps'], ['experience', 'Experience']];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 30);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
    <nav className='site-nav' aria-label='Main navigation'>
      <a href='#home' className='wordmark' aria-label={`${person.name} home`}><span className='monogram'>b<span>.</span></span><span className='wordmark-name'>{person.name}<span className='wordmark-role'> / Software Engineer</span></span></a>
      <button className='menu-toggle' aria-expanded={open} aria-controls='nav-links' onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'} <span aria-hidden='true'>{open ? '−' : '+'}</span></button>
      <div id='nav-links' className={`nav-links ${open ? 'is-open' : ''}`}>
        {links.map(([id, text]) => <a href={`#${id}`} key={id} onClick={() => setOpen(false)}>{text}</a>)}
        <a className='nav-contact' href='#contact' onClick={() => setOpen(false)}>Let’s talk <span aria-hidden='true'>↗</span></a>
      </div>
    </nav>
  </header>;
}
