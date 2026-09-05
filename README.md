# Scarpa Parts Vault

Build "Scarpa" — a free, open-source-style library for 3D-printable car part files (brackets, housings, covers, trim — non-safety-critical parts only), aimed at car enthusiasts, restorers, and DIY builders working on high-performance and exotic cars (Porsche, Lamborghini, Ferrari, etc.).

Core features for this MVP:

1. HOMEPAGE
- Clean, technical/engineering aesthetic (think blueprint/workshop, not flashy). Warm off-white background, deep graphite text, a muted engineering blue and a brass/amber accent color. Pair a distinctive serif display font (like Fraunces) with a clean technical sans (like IBM Plex Sans), and use a monospace font for part numbers/technical data.
- Headline: "A shared library of 3D-printable parts for cars nobody else supports."
- Subhead explaining: enthusiasts already figure out how to adapt and fabricate rare parts for exotic and high-performance cars — this is a place to share those solved problems instead of losing them in old forum threads.
- Clear CTA: "Browse the library" and "Upload a file"

2. UPLOAD FLOW
- Fields: part name, description, vehicle(s) it fits (make, model, year range — allow multiple), category (bracket / housing / cover / trim / other — explicitly NOT brakes/suspension/structural/fuel system), file upload (accept STL and STEP formats), optional notes on how they solved the problem (like a forum writeup)
- Required checkbox before submitting: "I created this file or have the right to share it, and I grant Scarpa a license to host and redistribute it under [Creative Commons Attribution license]." Do not let submission proceed without this checked.
- After submission, show a message: "Thanks — this is queued for a quick review before it goes live."
- Store submissions with a status field defaulting to "pending" — do NOT show pending items in the public library yet, only approved ones. Include a simple internal admin view (e.g. at /admin, no auth needed for this MVP) where I can see all pending submissions and approve or reject them.

3. LIBRARY / BROWSE PAGE
- Grid or list of approved files only, filterable by vehicle make/model and category
- Each listing shows: part name, vehicle fitment, category, uploader's notes/writeup, download button
- Empty state message when there's nothing yet: "Nothing here yet — be the first to share a fix."

4. LEGAL / FOOTER
- Simple disclaimer footer: "Files are shared by the community and are for non-safety-critical parts only. Verify fit and function before use. Scarpa does not guarantee fitment or safety."

Set up a database (Supabase) to actually store submissions and files persistently. Keep this scoped as a lean MVP — no user accounts/login required yet, just the upload form, admin review, and public library.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zenthi3d.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/42f80507-2bce-498a-8440-39af4b9d99ab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
