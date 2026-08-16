# Tinlance Design System

## Direction

Tinlance uses a restrained technical editorial aesthetic: high-contrast typography, generous whitespace, compact navigation, subtle borders, and a single electric-lime accent. The visual language should feel like an engineering firm rather than a generic AI SaaS template.

## Principles

1. **Clarity over decoration.** Every visual element should communicate hierarchy or action.
2. **Technical credibility.** Use monospace labels, precise language, diagrams, and evidence where appropriate.
3. **Editorial scale.** Large headlines create a strong information hierarchy without excessive gradients or visual noise.
4. **Accessible interaction.** Maintain visible focus states, sufficient contrast, keyboard navigation, semantic HTML, and reduced-motion support.
5. **Performance first.** Avoid unnecessary client JavaScript, third-party fonts that block rendering, and decorative animation that does not improve comprehension.

## Tokens

- Background: `#f6f7f2`
- Surface: `#ffffff`
- Muted surface: `#eceee8`
- Ink: `#111411`
- Muted text: `#5f665e`
- Border: `#d9ddd5`
- Accent: `#b8f34a`
- Accent strong: `#8fd42a`
- Radius: `18px`
- Content width: `1180px`

## Typography

The intended pairing is a modern sans-serif for interface/content and JetBrains Mono for technical labels. Font loading must not become a critical rendering dependency; production font delivery should be self-hosted or otherwise optimized during the implementation phase.

## Components

Reusable primitives belong in `apps/web/components/`. Page-specific composition should stay in the relevant route unless a pattern is genuinely shared.
