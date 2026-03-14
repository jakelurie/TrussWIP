const icons: Record<string, (props: React.SVGProps<SVGSVGElement>) => React.ReactElement> = {
  booking_request: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <polyline points="2,4.5 8,9 14,4.5" />
    </svg>
  ),
  booking_accepted: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="6" />
      <polyline points="5.5,8 7.5,10 10.5,6" />
    </svg>
  ),
  booking_confirmed: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="2" width="6" height="12" rx="1.5" />
      <circle cx="8" cy="6" r="1.5" />
      <line x1="6" y1="10" x2="10" y2="10" />
    </svg>
  ),
  booking_declined: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="6" />
      <line x1="5.75" y1="5.75" x2="10.25" y2="10.25" />
      <line x1="10.25" y1="5.75" x2="5.75" y2="10.25" />
    </svg>
  ),
  gig_completed: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="3.5" width="12" height="9" rx="1" />
      <circle cx="8" cy="8" r="2.5" />
      <line x1="4.5" y1="3.5" x2="4.5" y2="2" />
      <line x1="11.5" y1="3.5" x2="11.5" y2="2" />
    </svg>
  ),
  review_received: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="8,2 9.8,5.6 13.8,6.2 10.9,9 11.6,13 8,11.1 4.4,13 5.1,9 2.2,6.2 6.2,5.6" />
    </svg>
  ),
  level_up: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="2,12 5.5,7 8.5,9.5 14,3" />
      <polyline points="10,3 14,3 14,7" />
    </svg>
  ),
  payment: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="2" x2="8" y2="14" />
      <path d="M11,5 C11,5 10,3.5 8,3.5 C6,3.5 4.5,4.5 4.5,6 C4.5,7.5 6,8 8,8.5 C10,9 11.5,9.5 11.5,11 C11.5,12.5 10,13.5 8,13.5 C6,13.5 5,12 5,12" />
    </svg>
  ),
  gig_reminder: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="6" />
      <polyline points="8,4.5 8,8 10.5,9.5" />
    </svg>
  ),
  bell: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4,6.5 C4,4 5.8,2 8,2 C10.2,2 12,4 12,6.5 C12,10 13.5,11 13.5,11 L2.5,11 C2.5,11 4,10 4,6.5Z" />
      <path d="M6.5,11 C6.5,12 7.2,13 8,13 C8.8,13 9.5,12 9.5,11" />
    </svg>
  ),
};

export default function NotificationIcon({
  type,
  className = "w-4 h-4",
}: {
  type: string;
  className?: string;
}) {
  const Icon = icons[type] || icons.bell;
  return <Icon className={className} />;
}
