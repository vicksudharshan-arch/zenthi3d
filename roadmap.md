# Roadmap

- [x] Sign-in gates: upload, post request, fulfil request, admin actions
- [x] Google sign-in on /auth with return path
- [x] "Search the web" tab + nav link
- [x] external_leads table + suggest button + admin queue
- [x] Homepage capabilities list (library, upload, requests board, web search)
- [x] Replace Sketchfab/Thingiverse search with Brave Search API
  - [x] app_secrets table (key_name, key_value), RLS locked to service role
  - [x] Server fn builds structured query, reads key server-side
  - [x] Results: title, domain, snippet, link out in new tab
  - [x] "Search is not yet configured" empty state when key missing
