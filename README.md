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
├── _data/               # Data files
│   ├── certifications.yml   # Certification entries for about page
│   ├── cv.yml               # CV data
│   └── project_categories.yml # Project category definitions with tech stacks
├── _includes/           # Reusable components (header, footer)
│   ├── projects.liquid      # Project card template
│   └── ...
├── _layouts/            # Page templates
├── _sass/               # SCSS stylesheets
│   ├── _base.scss          # Base styles including project cards
│   └── ...
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
4. **Projects** → Categorized entries from `_projects/` with enhanced card layout:
   - **Categories**: Defined in `_data/project_categories.yml` (work, fun)
   - **Structure per category**:
     - Category name and description
     - Tech stack overview showing:
       - Machine Learning & AI tools
       - Web & Mobile Development frameworks
       - Cloud & Infrastructure technologies
       - Data & Analytics libraries
   - **Project cards**:
     - Image height: 250px (optimized for visibility)
     - Project thumbnail using web screenshots
     - Title and description
     - Tech stack tags (first 4 shown, +N indicator if more)
     - GitHub repository link with star count
5. **Certifications** → Displayed on the about (home) page, sourced from `_data/certifications.yml`:
   - Microsoft AI Product Manager (Coursera)
   - Microsoft AI & ML Engineering (Coursera)
   - AWS Cloud Solutions Architect (Coursera)
   - Neo4j Graph Data Science Certification (Neo4j GraphAcademy)
   - Neo4j Certified Professional (Neo4j GraphAcademy)
   - Each entry includes: `name`, `issuer`, `date`, `credential_id`, `credential_url`, `description`
   - Rendered via `_includes/certifications.liquid` with year badge and linked title
6. **CV** → Generated from `assets/json/resume.json` or `_data/cv.yml`
7. **Publications** → Generated from `_bibliography/papers.bib` (currently hidden)

## Configuration Notes

- **Theme Color**: #B71D1D (custom red)
- **Theme Toggle**: Light/Dark mode toggle (no system option)
- **Navbar Fixed**: Yes (scrolls with page)
- **Search**: Enabled (Ctrl+K or click search icon)

## Social Links Configuration

Social icons are displayed at the bottom of the about page. Configure them in `_data/socials.yml`:

| Platform | Config Key | Example Value |
|----------|-----------|---------------|
| GitHub | `github_username` | `adhitaazizi` |
| LinkedIn | `linkedin_username` | `adhita-azizi` |
| X (Twitter) | `x_username` | `adhitaazizi` |
| Email | `email` | `your@gmail.com` |

The icons use Font Awesome 6 for modern, up-to-date logos.

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
