'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';

let registered = false;

if (typeof window !== 'undefined' && !registered) {
  gsap.registerPlugin(ScrollTrigger, Observer);
  // Mobile Safari/Chrome show/hide the URL bar on scroll, which resizes
  // the viewport and would otherwise re-fire ScrollTrigger.refresh() —
  // making pinned sections visibly jump. ignoreMobileResize stops that.
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export { gsap, ScrollTrigger, Observer };
export default gsap;
