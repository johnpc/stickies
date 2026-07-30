import './home.css';

const STEPS = [
  {
    emoji: '🔗',
    title: 'Pick any URL',
    body: 'Add a room name after the address — like /grocery-list.',
  },
  {
    emoji: '📝',
    title: 'Post stickies',
    body: 'Jot notes, paste links, drop anything you want to share.',
  },
  {
    emoji: '👥',
    title: 'Share the link',
    body: 'Anyone with the same URL sees and edits the same pad, live.',
  },
];

/** The home hero explainer — three steps describing what Stickies is. Static
 * content, pure presentation. */
export function HowItWorks() {
  return (
    <ol className="how-it-works" data-testid="how-it-works">
      {STEPS.map((step) => (
        <li key={step.title} className="how-it-works__step">
          <span className="how-it-works__emoji" aria-hidden="true">
            {step.emoji}
          </span>
          <div>
            <p className="sk-heading how-it-works__title">{step.title}</p>
            <p className="sk-muted how-it-works__body">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
