const principles = [
  ['Understand the workflow', 'Start with the people using the product, the records they keep and the decisions they need to make.'],
  ['Connect the pieces', 'Design the data model, API and interface together so mobile, web and internal tools can work as one product.'],
  ['Own the delivery', 'Test business rules, investigate edge cases, deploy carefully and maintain the system after release.'],
];
export default function Feedbacks() {
  return <section className='section-shell approach-section'><p className='eyebrow'>HOW I WORK</p><div className='approach-grid'>{principles.map(([title, text], index) => <article key={title}><span className='small-index'>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>;
}
