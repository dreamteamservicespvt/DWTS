# 🎨 DWTS Design System Quick Reference

## Color Palette

### Primary Colors
```css
--primary: #0057FF (Blue)
--secondary: #00C4B4 (Aqua/Cyan)
--accent: #FFD700 (Gold)
```

### Gradient Combinations
```css
/* Main Gradient */
from-blue-600 via-cyan-500 to-teal-400

/* Success */
from-green-400 via-emerald-500 to-teal-500

/* Warning/Time */
from-orange-400 via-amber-500 to-yellow-400

/* Premium/Productivity */
from-purple-500 via-pink-500 to-rose-400

/* Gold Accent */
from-yellow-400 via-amber-500 to-orange-500
```

## Typography Scale

```css
/* Headings */
text-5xl (48px) - Hero titles
text-4xl (36px) - Page titles
text-3xl (30px) - Section titles
text-2xl (24px) - Card titles
text-xl (20px) - Subtitle
text-lg (18px) - Large body

/* Body */
text-base (16px) - Normal body
text-sm (14px) - Small text
text-xs (12px) - Captions
```

## Spacing System

```css
/* Padding/Margin */
p-4 (16px)
p-6 (24px)
p-8 (32px)
p-12 (48px)
p-16 (64px)

/* Gaps */
gap-4 (16px)
gap-6 (24px)
gap-8 (32px)
```

## Border Radius

```css
rounded-lg (8px) - Small elements
rounded-xl (12px) - Medium elements
rounded-2xl (16px) - Large cards
rounded-3xl (24px) - Premium cards/modals
```

## Shadows

```css
shadow-lg - Standard elevation
shadow-xl - High elevation
shadow-premium - Custom blue-tinted shadow
shadow-premium-lg - Large custom shadow
```

## Component Classes

### Glass Effects
```css
.glass-card
.glass-premium - Enhanced with more blur
```

### Buttons
```css
.btn-gradient - Primary gradient button
.btn-shine - Button with shine effect
```

### Badges
```css
.badge - Base badge
.badge-success - Green
.badge-warning - Yellow
.badge-danger - Red
.badge-info - Blue
```

### Progress
```css
.progress-bar - Container
.progress-fill - Gradient fill
```

### Text Gradients
```css
.text-gradient - Blue to cyan
.text-gradient-premium - Blue to teal
.text-gradient-gold - Yellow to orange
```

## Animation Classes

```css
.animate-glow - Pulsing glow
.animate-float - Floating motion
.animate-pulse-scale - Subtle pulse
.animate-shimmer - Loading shimmer
.animate-slide-up - Entrance from bottom
.animate-fade-in-scale - Fade + scale entrance
.animate-bounce-in - Bouncy entrance
.card-hover - Lift on hover
```

## Framer Motion Patterns

### Card Entrance
```jsx
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ delay: 0.1 }}
  whileHover={{ y: -5, scale: 1.02 }}
>
```

### Button Interaction
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

### Staggered Children
```jsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map(item => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.div>
```

## Component Usage Examples

### KPI Card
```jsx
<KPICard
  title="Work Score"
  value="85%"
  subtitle="Overall performance"
  icon={TrendingUp}
  gradient="from-blue-500 via-cyan-500 to-teal-400"
  trend="up"
  trendValue="+12%"
  delay={0}
/>
```

### Premium Modal
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
>
  <motion.div
    initial={{ scale: 0.8, y: 50 }}
    animate={{ scale: 1, y: 0 }}
    transition={{ type: 'spring' }}
    className="glass-premium rounded-3xl p-8 shadow-premium-lg"
  >
    {/* Content */}
  </motion.div>
</motion.div>
```

### Progress Ring
```jsx
<ProgressRing 
  progress={75} 
  size={180} 
  strokeWidth={14}
  showLabel={true}
/>
```

### Confetti Celebration
```jsx
import { celebrateTaskCompletion } from '../components/ConfettiCelebration';

// Trigger on success
celebrateTaskCompletion();
```

## Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Usage
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

## Dark Mode

All components support dark mode via `dark:` prefix:
```jsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

## Performance Tips

1. Use `transform` and `opacity` for animations (GPU accelerated)
2. Avoid animating `width`, `height`, `top`, `left`
3. Use `will-change` sparingly
4. Lazy load images and heavy components
5. Debounce search inputs
6. Virtualize long lists

## Accessibility

- Always include ARIA labels: `aria-label=""`
- Use semantic HTML: `<nav>`, `<main>`, `<article>`
- Ensure touch targets ≥44px
- Maintain focus indicators
- Use sufficient color contrast (WCAG AA)
- Support keyboard navigation

## Common Patterns

### Premium Input
```jsx
<div className="relative group">
  <input
    className="input-field pl-12 pr-4 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
  />
  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
</div>
```

### Gradient Button
```jsx
<motion.button
  whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(0, 87, 255, 0.4)" }}
  whileTap={{ scale: 0.97 }}
  className="relative py-4 px-8 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-white font-bold rounded-2xl shadow-premium-lg overflow-hidden group"
>
  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
  <span className="relative">Click Me</span>
</motion.button>
```

### Premium Card
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -5 }}
  className="glass-premium p-8 rounded-3xl shadow-premium relative overflow-hidden"
>
  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-full blur-3xl" />
  <div className="relative z-10">
    {/* Content */}
  </div>
</motion.div>
```

---

**Use this guide to maintain consistency throughout the app!**
