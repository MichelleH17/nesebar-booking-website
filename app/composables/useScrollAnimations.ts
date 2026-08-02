import type { Ref } from 'vue'
import { gsap } from 'gsap'

interface RevealUpOptions {
  y?: number
  duration?: number
  ease?: string
  stagger?: number
  start?: string
}

interface ScrollAnimationApi {
  gsap: typeof gsap
  revealUp: (targets: gsap.TweenTarget, trigger?: Element | string | null, options?: RevealUpOptions) => void
}

/**
 * GSAP scroll animation composable.
 * The scope element is captured once in onMounted; elements behind v-if/async content at mount are not animated.
 * Ensure the scope exists at mount time.
 */
export function useScrollAnimations(scopeRef: Ref<Element | null | undefined>, cb: (api: ScrollAnimationApi) => void) {
  let ctx: gsap.Context | undefined

  onMounted(() => {
    const scope = scopeRef.value
    if (!scope) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set('.gs-hidden', { opacity: 1 })
        return
      }

      const revealUp: ScrollAnimationApi['revealUp'] = (targets, trigger, options = {}) => {
        // Explicit fromTo (not `from`): the end state must be opacity 1 regardless of the
        // `html.js .gs-hidden { opacity: 0 }` rule. With `from`, gsap records the *current*
        // opacity as the end — which is 0 during client-side navigation (the `js` class is
        // already present), leaving content permanently invisible.
        gsap.fromTo(
          targets,
          { y: options.y ?? 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: options.duration ?? 0.7,
            ease: options.ease ?? 'power2.out',
            stagger: options.stagger ?? 0.08,
            scrollTrigger: {
              trigger: trigger ?? (targets as Element),
              start: options.start ?? 'top 85%',
              toggleActions: 'play none none none',
            },
          },
        )
      }

      cb({ gsap, revealUp })
    }, scope)
  })

  onUnmounted(() => {
    ctx?.revert()
  })
}
