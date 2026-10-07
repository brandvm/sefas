import Lenis from 'lenis';

export function initLenis() {
  if (window.Webflow?.env?.('editor')) return;

  const gsap = window.gsap;
  const scrollTrigger = window.ScrollTrigger;
  if (!gsap || !scrollTrigger) {
    throw new Error('Webflow GSAP/ScrollTrigger globals are unavailable');
  }

  // Keep the release-v1.0.0 behavior and options while bundling the exact
  // Lenis version instead of loading another footer script.
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  } as ConstructorParameters<typeof Lenis>[0]);

  window.lenis = lenis;
  lenis.on('scroll', scrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
