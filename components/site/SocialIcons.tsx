type SocialIconProps = {
  className?: string;
};

export function WhatsAppIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.5 2 2.08 6.42 2.08 11.96c0 1.75.46 3.46 1.33 4.96L2 22l5.24-1.37a9.88 9.88 0 0 0 4.8 1.23h.01c5.54 0 10.04-4.5 10.04-10.04C22.09 6.42 17.58 2 12.04 2Zm0 18.36a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.11.81.83-3.03-.2-.31a8.16 8.16 0 0 1-1.26-4.38c0-4.52 3.68-8.2 8.2-8.2a8.2 8.2 0 0 1 8.2 8.2c0 4.52-3.68 8.23-8.19 8.23Zm4.5-6.14c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18a7.2 7.2 0 0 1-1.33-1.65c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.61.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.43-.58 1.63-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14.2 8.6h3.1V5h-3.1c-2.29 0-3.9 1.55-3.9 3.85V11.3H7.2v3.6h3.1V22h3.8v-7.1h3.1l.55-3.6h-3.65V9.1c0-.32.22-.5.5-.5Z" />
    </svg>
  );
}
