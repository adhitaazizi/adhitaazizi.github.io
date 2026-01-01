# Adhita Azizi - Portfolio

Personal portfolio website built with Jekyll using the [al-folio](https://github.com/alshedivat/al-folio) theme.

## 🌐 Live Site

[adhitaazizi.github.io](https://adhitaazizi.github.io)

## System Architecture

```
portfolio/
├── _config.yml          # Site configuration (baseurl, theme settings)
├── _pages/              # Static pages (about, blog, cv, projects)
├── _posts/              # Blog posts in markdown
├── _projects/           # Project entries
├── _bibliography/       # BibTeX files for publications
├── _includes/           # Reusable components (header, footer)
├── _layouts/            # Page templates
├── _sass/               # SCSS stylesheets
└── assets/              # Images, PDFs, and static files
```

## Navigation Structure

| Page | Route | Description |
|------|-------|-------------|
| About | `/` | Home page with personal info |
| Blog | `/blog/` | Blog posts listing |
| Projects | `/projects/` | Portfolio projects |
| CV | `/cv/` | Curriculum Vitae |
| Publications | `/publications/` | Academic publications (hidden, configure later) |

## Application Flow

1. **User visits site** → Jekyll serves static HTML
2. **Navigation** → Pages rendered from `_pages/` with corresponding layouts from `_layouts/`
3. **Blog** → Posts from `_posts/` rendered with pagination
4. **Projects** → Entries from `_projects/` displayed in grid layout
5. **CV** → Generated from `assets/json/resume.json` or `_data/cv.yml`
6. **Publications** → Generated from `_bibliography/papers.bib` (currently hidden)

## Configuration Notes

- **Theme Toggle**: Light/Dark mode toggle (no system option)
- **Navbar Fixed**: Yes (scrolls with page)
- **Search**: Enabled (Ctrl+K or click search button)

## Local Development

```bash
# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# Open http://localhost:4000
```

## Deployment

Automatically deployed to GitHub Pages via GitHub Actions on push to main branch.

## Credits

Built on [al-folio](https://github.com/alshedivat/al-folio) theme by [Maruan Al-Shedivat](https://alshedivat.com/).
