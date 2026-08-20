---
name: Sacred Light
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444651'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#282b2c'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e4142'
  on-tertiary-container: '#abadae'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  title-md:
    fontFamily: EB Garamond
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: auto
---

## Brand & Style

The brand personality is dignified, transcendent, and profoundly welcoming. It balances the weight of ecclesiastical tradition with the accessibility of a modern mobile-first utility. The UI is designed to feel like a digital sanctuary—quiet, orderly, and illuminating.

The design style is **Corporate Modern with Liturgical Accents**. It prioritizes high-contrast clarity for outdoor readability under the bright sun of Brazzaville, while using subtle decorative motifs inspired by the architecture of the Cathedral Sacré-Cœur. We avoid heavy skeuomorphism in favor of a clean, structured layout that allows sacred imagery and scripture to take center stage.

## Colors

The palette is rooted in Catholic symbolism:
- **Marian Blue (#1E3A8A):** Used for primary navigation, headers, and key actions to convey depth, stability, and devotion.
- **Ecclesiastical Gold (#D4AF37):** Used sparingly as an accent for highlights, active states, and decorative flourishes to signify divinity and celebration.
- **Liturgical White (#FFFFFF / #F8F9FA):** The foundation of the UI, providing maximum contrast and a sense of purity.
- **High-Contrast Text (#121212):** Essential for outdoor legibility, ensuring all body text exceeds AA accessibility standards.

Backgrounds should remain primarily white or very light grey to combat screen glare in high-brightness environments.

## Typography

This design system utilizes a sophisticated typographic pairing to bridge the gap between the ancient and the contemporary:
- **Headlines (EB Garamond):** A classical serif that evokes the beauty of liturgical texts and architectural inscriptions. It should be used for section titles, quotes, and spiritual reflections.
- **Body & UI (Inter):** A clean, highly legible sans-serif designed for digital screens. Its tall x-height ensures readability for schedules, news, and functional instructions, especially on mobile devices.

For mobile-first optimization, large display type should be scaled down slightly to avoid awkward line breaks, while body text is kept at a comfortable 16-18px to assist with accessibility in diverse lighting conditions.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. On mobile devices, content spans the full width with 20px side margins to ensure touch targets are easy to hit. On larger screens, the content is capped at a readable 720px for articles or 1140px for dashboards.

A strict 8px grid governs the vertical rhythm. Information-dense areas (like mass schedules) use "sm" (12px) spacing to group related items, while spiritual reflections or prayer sections use "lg" (40px) padding to create a sense of breath and reverence.

## Elevation & Depth

To maintain a respectful and "flat" modern aesthetic, we minimize the use of heavy drop shadows which can become muddy in sunlight. Instead, we use:
- **Tonal Layering:** Surfaces are differentiated by slight shifts in background color (e.g., a white card on a light grey #F8F9FA background).
- **Gold Accents:** A 1px top-border in #D4AF37 is used to denote the "active" or "primary" surface in a stack.
- **Crisp Outlines:** Low-opacity blue (#1E3A8A at 10%) borders are used for input fields and containers to provide structure without visual clutter.

## Shapes

The shape language is **Rounded**, reflecting the soft arches and welcoming atmosphere of the Cathedral. 
- Standard UI elements like buttons and input fields use a 0.5rem (8px) corner radius.
- Imagery and large cards use "rounded-lg" (1rem) to feel approachable and organic. 
- Interactive chips for category filtering use "pill" shapes for maximum distinction from square content containers.

## Components

**Buttons:** 
Primary buttons are solid Marian Blue with White text, using a 0.5rem radius. Secondary buttons use a Marian Blue outline with a subtle Gold icon prefix.

**Cards:** 
Cards for news or events use a white background with a very subtle 1px border. The header of the card should feature the Serif typeface for the title.

**Navigation:** 
The bottom navigation bar (PWA standard) uses clear, stroke-based icons in Marian Blue. The "Active" state is indicated by a Gold underline or icon fill.

**Input Fields:** 
Labels are always visible (never placeholder-only) using the Label-MD style. The focus state uses a 2px Gold border for high visibility.

**Mass Schedule Lists:** 
Lists use high-contrast dividers and "Inter" for time-based data to ensure clarity. Use an "active" liturgical color indicator (Green, Purple, Red, White) as a small vertical stripe on the left of the list item to denote the current liturgical season.