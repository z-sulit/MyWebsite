# Zach's 3D Portfolio Website — Implementation Plan

A cinematic, sunset-themed single-page portfolio for a Data Science student, built with vanilla HTML, CSS, and Three.js.

## Proposed Changes

The entire site will be a **3 file** architecture for simplicity and performance:

### File Structure

```
d:\PersonalProjects\PersonalWebsite\
├── index.html          # Single HTML file with all sections
├── style.css           # All styles, animations, responsive rules
└── script.js           # Three.js scene + interactions + scroll logic
```

---

### [NEW] [index.html](file:///d:/PersonalProjects/PersonalWebsite/index.html)

The complete single-page HTML structure:

| Section | Key Elements |
|---------|-------------|
| **`<head>`** | Google Fonts (Playfair Display + JetBrains Mono), Three.js CDN, meta tags, SEO |
| **Navbar** | Sticky frosted-glass nav with warm amber tint; links to each section |
| **Hero** | Full-viewport `<canvas>` behind overlay text: "Zach", "Data Science Student", tagline, CTA button |
| **About** | Warm-glow bordered card with bio paragraph + profile photo placeholder circle |
| **Projects** | CSS Grid of project cards (6 cards) with tags (ML, NLP, F1 Analytics, etc.); hover lift + glow |
| **Skills** | Animated pill/badge layout for Python, R, SQL, TensorFlow, PyTorch, Power BI, Tableau, etc. |
| **Resume** | Vertical timeline (education + experience) with glowing connectors; PDF download button |
| **Contact** | Minimal form (name, email, message) + social icon links (LinkedIn, GitHub) |
| **Footer** | Copyright line |

**CDN Dependencies:**
- Three.js r152+ via `unpkg` or `jsdelivr`
- Google Fonts: Playfair Display (display headings), JetBrains Mono (body/technical)

---

### [NEW] [style.css](file:///d:/PersonalProjects/PersonalWebsite/style.css)

#### Design Tokens
```
--bg-deep:        #1a0a0f → #0d0510 gradient
--amber:          #f4a34d
--burnt-orange:   #e05e1e
--dusty-rose:     #c96b8a
--soft-gold:      #f7c86f
--text-primary:   #f0e6d6 (warm white)
--text-secondary: #a89080
--glass-bg:       rgba(26, 10, 15, 0.7)
```

#### Key Style Systems

| System | Details |
|--------|---------|
| **Background** | Radial gradient `#1a0a0f` → `#0d0510`; CSS noise texture overlay via pseudo-element with SVG filter |
| **Navbar** | `position: sticky; backdrop-filter: blur(16px);` warm-tinted glass |
| **Section Headers** | Glowing halo effect using radial-gradient pseudo-element behind text |
| **Cards** | `background: var(--glass-bg);` subtle warm border glow via `box-shadow` |
| **Project Cards** | Hover: `transform: translateY(-8px); box-shadow: 0 20px 60px rgba(244,163,77,0.3)` |
| **Buttons** | Gradient amber→orange fill, warm glow on hover |
| **Timeline** | Vertical line with glowing dots at each milestone |
| **Custom Cursor** | Warm amber dot (`20px` circle, `mix-blend-mode`), trailing effect via JS |
| **Scroll Animations** | `@keyframes fadeSlideUp` triggered by `.visible` class via Intersection Observer |
| **Responsive** | Mobile breakpoints at 768px and 480px; canvas scales, reduced complexity |

---

### [NEW] [script.js](file:///d:/PersonalProjects/PersonalWebsite/script.js)

#### Three.js Scene Composition

The hero canvas fills the viewport and contains:

| 3D Object | Implementation |
|-----------|---------------|
| **Wireframe Graph Nodes** | 8-12 `IcosahedronGeometry` spheres (small, wireframe) connected by `Line` segments with glowing material |
| **Scatter Plot Clusters** | `Points` geometry with ~200 points in 3 clusters, warm-colored `PointsMaterial` with size attenuation |
| **Data Polyhedron** | Large `IcosahedronGeometry(1, 1)` with wireframe + semi-transparent solid overlay, slow rotation |
| **Drifting Grid Planes** | 2-3 `PlaneGeometry` with `GridHelper`-style wireframe, tilted and slowly drifting |
| **Ember Particles** | `Points` system with ~500 particles drifting upward, fading and resetting; warm orange/gold colors |

#### Lighting
- **Ambient light**: Very dim warm (`#2a1510`)
- **Point light 1**: Amber `#f4a34d` — positioned upper-right
- **Point light 2**: Magenta `#c96b8a` — positioned lower-left  
- **Point light 3**: Soft gold `#f7c86f` — center-back

#### Interactions

| Feature | Implementation |
|---------|---------------|
| **Mouse Parallax** | `mousemove` listener → normalize to `-1..1` → offset camera or scene group position with lerp |
| **Scroll Parallax** | On scroll, translate scene group slightly on Y axis for depth |
| **Custom Cursor** | Warm amber dot follows mouse with slight delay (`lerp`); hidden on mobile |
| **Scroll Reveal** | `IntersectionObserver` adds `.visible` class to `.reveal` elements |
| **Smooth Scroll** | `scrollIntoView({ behavior: 'smooth' })` on nav links |
| **Mobile Detection** | Reduce particle count to ~150, disable cursor, simplify scene on `window.innerWidth < 768` |

#### Animation Loop
```
function animate() {
  requestAnimationFrame(animate);
  // Rotate polyhedron
  // Drift particles upward, reset when past threshold
  // Lerp camera toward mouse target
  // Update node connections
  renderer.render(scene, camera);
}
```

---

## Design Decisions

> [!IMPORTANT]
> **No profile photo included** — A glowing placeholder circle with initials "Z" will be used in the About section. You can swap in a real photo later.

> [!NOTE]  
> **Three.js loaded via CDN** — Using `https://unpkg.com/three@0.160.0/build/three.module.js` as an ES module import. No build tools needed.

> [!NOTE]
> **Project cards use placeholder data** — 6 sample data science projects will be populated (F1 Analytics, NLP Sentiment, etc.). You can customize the content after.

---

## Open Questions

1. **Profile Photo**: Do you have a photo to use, or should I keep the stylized initial placeholder?
2. **Project Details**: Should I use specific real projects, or are the sample DS project cards fine for now?
3. **Resume Content**: Should I populate with placeholder education/experience entries, or do you have specific content?
4. **Social Links**: What are the actual LinkedIn/GitHub URLs? I'll use `#` placeholders for now.
5. **Contact Form**: Should the form actually submit somewhere (e.g. Formspree, Netlify Forms), or just be visual?

---

## Verification Plan

### Automated Tests
- Open the site in a browser via the browser tool and verify:
  - Three.js canvas renders correctly with all 3D objects
  - All sections are visible and properly styled
  - Scroll animations trigger on scroll
  - Navbar glass effect works
  - Responsive layout at mobile viewport
  - Mouse parallax responds correctly

### Manual Verification
- Visual inspection of the sunset color palette and glow effects
- Performance check: smooth 60fps on the Three.js canvas
- Mobile responsiveness at 375px, 768px, and 1024px viewpoints
