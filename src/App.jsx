import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Tech from './components/Tech';
import Works from './components/Works';
import Experience from './components/Experience';
import Feedbacks from './components/Feedbacks';
import Contact from './components/Contact';
import BackgroundMusic from './components/BackgroundMusic';
import { person } from './data/profile';
const MobileShowcase = lazy(() => import('./components/MobileShowcase'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

export default function App() {
  const showAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
  return <div className='portfolio-site'>
    <a className='skip-link' href='#projects'>Skip to projects</a>
    <Navbar />
    {!showAdmin && <BackgroundMusic />}
    {showAdmin && <Suspense fallback={null}><AdminPanel /></Suspense>}
    <main><Hero /><About /><Works /><Suspense fallback={<section className='section-shell model-loading'>Loading mobile showcase…</section>}><MobileShowcase /></Suspense><Experience /><Tech /><Feedbacks /><Contact /></main>
    <footer className='site-footer'><a className='wordmark' href='#home'><span className='monogram'>b<span>.</span></span><span>{person.name}</span></a><p>Software for the people who use it.</p><div><a href={person.github} target='_blank' rel='noreferrer'>GitHub ↗</a><a href={person.whatsapp} target='_blank' rel='noreferrer' aria-label={`Chat with Benedict on WhatsApp at ${person.phone}`}>WhatsApp <span aria-hidden="true">↗</span></a><a href={person.linkedin} target='_blank' rel='noreferrer'>LinkedIn ↗</a><a href='/credits.html'>Credits</a><a href='/?admin=1'>Admin</a></div><small>© {new Date().getFullYear()} {person.name}</small></footer>
  </div>;
}
