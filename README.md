# Lucas Melo — Interactive Portfolio

Public source of my portfolio: https://lucasmeloo.netlify.app/

An interactive, bilingual portfolio built with Next.js, React and TypeScript, combining scroll choreography, a persistent Three.js world, a purple mascot, a creative gallery and three playable prototypes.

## Experiences

- Click-to-enter mascot introduction and scroll-driven geometric composition.
- Published projects: Jorak Editor and OHM Engenharia, with project context, contribution and live links.
- Desktop project transitions; tab-based project navigation on mobile.
- Three original games: Passage (parkour), Crossing (timing), and Fragments (collect and rebuild).
- Eight gallery pieces exploring particles, Lorenz trajectories, Gray–Scott patterns, typography, networks and 3D forms.
- Skills and academic background, Portuguese/English content and animated section introductions.
- Movable AI mascot chat, with server-side provider integration and input/rate guards.
- Copy-to-clipboard contact email and an automatically rotating contact sculpture with restrained purple glitch.
- Adaptive rendering, touch controls, visibility-aware animation and reduced-motion support.

## Stack

Next.js, React, TypeScript, GSAP/ScrollTrigger, Lenis, Three.js, React Three Fiber, Rapier, Canvas 2D, SVG, CSS and Zod. Deployment uses Netlify.

## Run locally

Use Node.js 22 or newer. Install dependencies with `npm ci`, then start with `npm run dev`. Open http://127.0.0.1:3000/.

The portfolio runs without API credentials. To enable the AI chat, copy `.env.example` to `.env.local` and supply your own server-side provider key. Never commit that file or prefix secret variables with `NEXT_PUBLIC_`. For production, set `SITE_URL` to your deployed origin and configure credentials in the hosting dashboard.

Optional remote content settings are documented in `.env.example`; the default content source is local.

## Checks

- `npm run typecheck`
- `npm test`
- `npm run build`

## Publication boundaries

This repository contains the public portfolio only. Private administrative routes, authentication/session code, application records, n8n workflows, deployment account files and real environment values are excluded. The private application-management system is maintained separately.

Public professional links remain available. The résumé links to the document on the live portfolio; the document itself is not stored here.

## Credits

Website development and interaction design by Lucas Melo, with AI-assisted development and human review. Audiovisual works shown in Jorak Editor remain credited to their original authors. Dependency license notices are in `docs/licencas` and installed packages. Third-party branding and media remain the property of their respective owners. No general redistribution license for the complete portfolio is granted by this repository.
