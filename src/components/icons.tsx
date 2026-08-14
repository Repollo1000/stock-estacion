import type { SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Icon>
  );
}

export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Icon>
  );
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <polyline points="6,7 7,20 17,20 18,7" />
      <line x1="9" y1="10" x2="9" y2="17" />
      <line x1="15" y1="10" x2="15" y2="17" />
      <path d="M9 7V4h6v3" />
    </Icon>
  );
}

export function IconCamera(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </Icon>
  );
}

export function IconBarChart(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props} strokeWidth={0} fill="currentColor">
      <rect x="3" y="12" width="4" height="8" rx="1" />
      <rect x="10" y="7" width="4" height="13" rx="1" />
      <rect x="17" y="4" width="4" height="16" rx="1" />
    </Icon>
  );
}

export function IconCheckCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8,12.5 11,15.5 16,9" />
    </Icon>
  );
}

export function IconAlertTriangle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 L21.5 20 H2.5 Z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconBan(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" />
    </Icon>
  );
}

export function IconTag(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polygon points="3,11 11,3 19,3 19,11 11,19" />
      <circle cx="15" cy="7" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconBox(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polyline points="3,7 3,17 12,21 21,17 21,7" />
      <polyline points="3,7 12,11 21,7" />
      <polyline points="3,7 12,3 21,7" />
      <line x1="12" y1="21" x2="12" y2="11" />
    </Icon>
  );
}

export function IconPercent(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="5" y1="19" x2="19" y2="5" />
      <circle cx="7.5" cy="7.5" r="2.3" />
      <circle cx="16.5" cy="16.5" r="2.3" />
    </Icon>
  );
}

export function IconInbox(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polygon points="5.5,5 18.5,5 21,13 21,19 3,19 3,13" />
      <polyline points="3,13 8,13 10,16 14,16 16,13 21,13" />
    </Icon>
  );
}

export function IconLogout(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polyline points="15,4 7,4 7,20 15,20" />
      <line x1="20" y1="12" x2="9" y2="12" />
      <polyline points="16,8 20,12 16,16" />
    </Icon>
  );
}

export function IconSwitch(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polyline points="17,4 21,8 17,12" />
      <line x1="21" y1="8" x2="9" y2="8" />
      <polyline points="7,20 3,16 7,12" />
      <line x1="3" y1="16" x2="15" y2="16" />
    </Icon>
  );
}

export function IconOutbox(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polyline points="3,13 3,19 21,19 21,13" />
      <line x1="12" y1="14" x2="12" y2="3" />
      <polyline points="7,8 12,3 17,8" />
    </Icon>
  );
}

export function IconHistory(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12,7 12,12 16,14" />
    </Icon>
  );
}
