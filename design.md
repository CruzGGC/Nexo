# Nexo Design System
This document outlines the design language used in the Nexo homepage redesign. Use these guidelines to replicate the "flashy", "cyberpunk", and "premium" aesthetic across other pages.
## 1. Core Philosophy
- **Theme**: Dark, Neon, Cyberpunk, Glassmorphism.
- **Keywords**: Flashy, Catchy, Unique, Premium, Fun.
- **Interaction**: Everything should feel alive. Hover effects, tilts, and smooth transitions are mandatory.
## 2. Color Palette
### Backgrounds
- **Main Background**: `#030014` (Deep dark blue/purple).
- **Glass Card**: `rgba(255, 255, 255, 0.03)` with blur.
- **Glass Hover**: `rgba(255, 255, 255, 0.08)`.
### Accents (Neon)
- **Primary Blue**: `#00f3ff` (Cyan/Electric Blue) - Used for borders, glows, and text highlights.
- **Primary Purple**: `#bc13fe` (Electric Purple) - Used for gradients and secondary glows.
- **Game Colors**:
  - Blue: `#3b82f6`
  - Purple: `#a855f7`
  - Pink: `#ec4899`
  - Green: `#22c55e`
### Text
- **Foreground**: `#ffffff` (White).
- **Muted**: `rgba(255, 255, 255, 0.6)` (60% opacity white).
- **Gradient Text**: `bg-gradient-to-r from-blue-400 to-purple-600`.
## 3. Typography
- **Font**: Inter (or system default sans-serif).
- **Headings**: Uppercase, Heavy/Black weight, tight tracking (`tracking-tighter`).
- **Body**: Light/Regular weight, relaxed leading.
## 4. Glassmorphism (The "Glass" Effect)
Use the following CSS classes (defined in `globals.css`) for glass elements:
### `.glass`
Used for navbars and simple containers.
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.05);
```
### `.glass-card`
Used for interactive cards (Game Cards, Feature Cards).
```css
background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
```
## 5. Animations (Framer Motion)
### Entrance Animations
- **Staggered Fade Up**: Elements should fade in and move up (`y: 20 -> 0`).
- **Spring Scale**: Logos and main elements should pop in (`scale: 0.5 -> 1`) with a spring transition.
### Hover Effects
- **Scale**: `hover:scale-105`.
- **Glow**: Box shadow glow matching the element's color.
- **3D Tilt**: Use `framer-motion`'s `useMotionValue` to calculate rotation based on mouse position (see `GameCard.tsx`).
## 6. UI Components
### Buttons
- **Primary**: White background, black text, bold. Hover: Scale up + Shadow.
- **Secondary/Ghost**: Glass background, white text, border. Hover: White background (low opacity).
### Background Elements
- **Grid**: A subtle SVG grid pattern (`/grid.svg`) masked with a radial gradient.
- **Orbs**: Large, blurred (`blur-[120px]`) colored circles (Blue/Purple) moving slowly in the background.
## 7. Code Snippets
### Neon Text Utility
```css
.neon-text-blue {
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.5),
               0 0 20px rgba(0, 243, 255, 0.3),
               0 0 30px rgba(0, 243, 255, 0.1);
}
```
### Gradient Text
```tsx
<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
  TEXTO AQUI
</span>
```
