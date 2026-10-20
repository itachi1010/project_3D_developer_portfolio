import experience from '../../shared/experience.json';

export const person = {
  name: 'Benedict Chuks-Onah', shortName: 'Benedict', role: 'Software Engineer',
  email: 'onahben977@gmail.com', location: 'Kano, Nigeria',
  phone: '+234 813 516 9229', whatsapp: 'https://wa.me/2348135169229',
  github: 'https://github.com/itachi1010',
  linkedin: 'https://www.linkedin.com/in/chuks-onah-benedict-660002192/',
  resume: '/Benedict-Onah-Resume.pdf',
};
export const experiences = experience;
export const projectFilters = ['All work', 'Complete products', 'Web', 'Mobile', 'Backend', 'Frontend', 'UI/UX'];
export const projects = [
  {
    id: 'cresol-erp', number: '01', name: 'Cresol ERP', kind: 'Business operations platform',
    status: 'In operational use', categories: ['Complete products', 'Web', 'Backend', 'Frontend'],
    description: 'One operational system for a manufacturing business. Production, inventory, customers, invoices, receipts, ledgers, quality control and staff workflows, connected by a Django backend.',
    contribution: 'Sole engineer · architecture, APIs, interfaces and deployment',
    stack: ['Django', 'PostgreSQL', 'Celery', 'Redis', 'Docker'],
    image: '/projects/cresol-erp-dashboard.png', imageNote: 'Original ERP interface · synthetic demonstration data',
    links: [{ label: 'Watch ERP walkthrough', href: 'https://youtu.be/PitdVYIHFgI' }],
    details: ['Department and role-based access', 'Invoice → receipt → waybill workflows', 'Field-sales APIs and PDF exports', 'Encrypted backups and recovery tooling'],
  },
  {
    id: 'kekedrop', number: '02', name: 'KekeDrop', kind: 'Passenger + driver ride-hailing apps',
    status: 'Published on Google Play', categories: ['Complete products', 'Mobile', 'Backend', 'Frontend'],
    description: 'A ride-hailing product for a privately funded startup: passenger and driver apps, a Node.js API, administration tools and payment workflows. Both Android apps are published on Google Play.',
    contribution: 'Contract engineer · mobile apps, backend and admin dashboard',
    stack: ['React Native', 'TypeScript', 'Node.js', 'REST APIs'],
    image: '/projects/kekedrop/user-3.png', imageNote: 'Official Google Play screenshot',
    links: [{ label: 'Passenger app', href: 'https://play.google.com/store/apps/details?id=com.kekedrop.user' }, { label: 'Driver app', href: 'https://play.google.com/store/apps/details?id=com.kekedrop.rider' }],
    details: ['Separate passenger and driver experiences', 'Ride-request and driver workflows', 'In-app payment integration', 'Shared backend and administration'],
  },
  {
    id: 'cresol-store', number: '03', name: 'Cresol Store', kind: 'Web + mobile commerce',
    status: 'Private staging', categories: ['Complete products', 'Web', 'Mobile', 'Backend', 'Frontend'],
    description: 'A Next.js storefront, Flutter Android app and staff dashboard sharing one Django API and stock count. Includes quotes, delivery workflows and Paystack payment processing.',
    contribution: 'Sole developer · storefront, mobile app, API and infrastructure',
    stack: ['Next.js', 'TypeScript', 'Django REST', 'Flutter', 'PostgreSQL'],
    image: '/projects/cresol-store.png', imageNote: 'Local staging storefront',
    links: [{ label: 'Discuss this project', href: 'mailto:onahben977@gmail.com?subject=Cresol%20Store%20demo' }],
    details: ['Shared inventory across channels', 'Atomic stock changes and idempotent payments', 'Quotes, orders and delivery tracking', 'Customer accounts and staff dashboard'],
  },
  {
    id: 'trackmeng', number: '04', name: 'TrackMeNG', kind: 'Errand and location-tracking platform',
    status: 'Project case study', categories: ['Web', 'Mobile', 'Backend', 'Frontend', 'UI/UX'],
    description: 'An errand-management platform with task instructions, destination marking, location tracking and in-app communication. Previously published on Google Play; the startup later removed the app.',
    contribution: 'Backend owner · frontend and collaborative UI/UX contributor',
    stack: ['Node.js', 'Express', 'React', 'React Native', 'Figma'], visual: 'tracking',
    links: [{ label: 'View collaborative designs', href: 'https://www.figma.com/design/s028PoAEd18b96lEr8YOaU/TrackmeNG--Copy-?node-id=0-1' }],
    details: ['Errand-request workflows', 'Destination and location tracking', 'Communication between users and representatives', 'API and interface implementation'],
  },
  {
    id: 'waffles', number: '05', name: 'Waffles Runner', kind: 'Browser game + Telegram Mini App',
    status: 'Playable browser demo', categories: ['Complete products', 'Web', 'Backend', 'Frontend', 'UI/UX'],
    description: 'A Unity WebGL game and React-based Telegram Mini App, with rankings, energy and streak systems, reward progression and a Python signup/referral bot.',
    contribution: 'Game and frontend development · collaborative UI/UX',
    stack: ['Unity WebGL', 'React', 'Python', 'Firebase'], visual: 'game',
    links: [{ label: 'View Figma designs', href: 'https://www.figma.com/design/EtZZ57JR6JNv6yYhuFSJN3/Waffle-2?node-id=0-1' }],
    details: ['Browser-based gameplay', 'Telegram Mini App interface', 'Live rankings and progression', 'Signup and referral automation'],
  },
  {
    id: 'blop', number: '06', name: 'BLOP', kind: 'Group budgeting and bill splitting',
    status: 'Collaborative design work', categories: ['UI/UX'],
    description: 'Collaborated on user journeys and interfaces for personal budgeting, splitting group bills by percentage and tracking balances between friends. The design progressed into a working app; engineering ownership is not claimed.',
    contribution: 'Collaborative UI/UX contributor', stack: ['Figma', 'User flows', 'Interface design'], visual: 'design',
    links: [{ label: 'View collaborative designs', href: 'https://www.figma.com/design/NZ0sKqOkmmG2kltNPm93cm/BLOP?node-id=0-1' }],
    details: ['Expense and budgeting journeys', 'Percentage-based bill splitting', 'Balances and debt tracking', 'Collaborative product design'],
  },
];
export const skillGroups = [
  { name: 'Backend & data', items: ['Python', 'Django / DRF', 'FastAPI', 'Node.js / Express', 'PHP / Laravel', 'PostgreSQL', 'MySQL', 'MongoDB'] },
  { name: 'Web & mobile', items: ['React', 'Next.js', 'TypeScript', 'Vue.js', 'Flutter / Dart', 'React Native', 'Tailwind CSS', 'Three.js'] },
  { name: 'Delivery & reliability', items: ['Docker', 'Kubernetes / K3s', 'Linux VPS', 'Nginx', 'Git / CI/CD', 'Django tests', 'Playwright', 'Backups & recovery'] },
  { name: 'Product integrations', items: ['REST APIs', 'Paystack', 'JWT authentication', 'Google Sign-In', 'Firebase', 'PDF generation', 'Figma collaboration', 'AI API integration'] },
];
