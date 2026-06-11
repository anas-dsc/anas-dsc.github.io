import profile from './profile.json';

export const site = {
  name: profile.name,
  tagline: profile.tagline,
  location: profile.location,
  email: profile.email,
  description: profile.description,
  social: profile.social,
  nav: [
    { href: '/', label: 'Home' },
    { href: '/#about', label: 'About' },
    { href: '/cv/', label: 'CV' },
    { href: '/projects/', label: 'Projects' },
    { href: '/blog/', label: 'Blog' },
  ],
};
