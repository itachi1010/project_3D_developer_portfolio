import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { person } from '../data/profile';

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const configured = [import.meta.env.VITE_APP_EMAILJS_SERVICE_ID, import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID, import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY].every(Boolean);
    if (!configured) {
      window.location.href = `mailto:${person.email}?subject=${encodeURIComponent('Portfolio enquiry from ' + data.name)}&body=${encodeURIComponent(data.message + '\\n\\nFrom: ' + data.name + ' <' + data.email + '>')}`;
      setMessage('Your email app will open with your message ready to send.');
      return;
    }
    setSending(true); setMessage('');
    try {
      await emailjs.send(import.meta.env.VITE_APP_EMAILJS_SERVICE_ID, import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID, { from_name: data.name, from_email: data.email, message: data.message, to_name: person.name, to_email: import.meta.env.VITE_CONTACT_EMAIL || person.email }, import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY);
      setMessage('Thanks for getting in touch. I’ll get back to you.'); form.reset();
    } catch { setMessage('Your message could not be sent. Please email me directly.'); }
    finally { setSending(false); }
  };
  return <section className='section-shell contact-section' id='contact'>
    <div className='contact-copy'><p className='eyebrow'>05 / LET’S MAKE SOMETHING USEFUL</p><h2>Have a project<br />in mind<span className='accent-dot'>?</span></h2><p>Let’s talk about your product, your team, or the system you need to build.</p><a className='contact-email' href={`mailto:${person.email}`}>{person.email} <span aria-hidden='true'>↗</span></a><div className='contact-socials'><a href={person.whatsapp} target='_blank' rel='noreferrer' aria-label={`Chat with Benedict on WhatsApp at ${person.phone}`}>WhatsApp <span aria-hidden="true">↗</span></a><a href={person.linkedin} target='_blank' rel='noreferrer'>LinkedIn ↗</a><a href={person.github} target='_blank' rel='noreferrer'>GitHub ↗</a><a href={person.resume} download>Download résumé ↓</a></div><span className='contact-location'><span className='status-dot' /> Based in Kano · Open to remote collaboration</span></div>
    <form className='contact-form' onSubmit={submit}><label htmlFor='contact-name'>Your name<input id='contact-name' name='name' autoComplete='name' required placeholder='How should I address you?' maxLength={120} /></label><label htmlFor='contact-email'>Email address<input id='contact-email' name='email' type='email' autoComplete='email' required placeholder='you@company.com' maxLength={254} /></label><label htmlFor='contact-message'>What are you working on?<textarea id='contact-message' name='message' required placeholder='A little about the project, role or idea…' rows={5} maxLength={5000} /></label><button className='button-primary' disabled={sending} type='submit'>{sending ? 'Sending…' : 'Get in touch'} <span aria-hidden='true'>↗</span></button><p className='contact-message' role='status'>{message}</p></form>
  </section>;
}
