import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// ============================================
// State — single source of truth
// ============================================
const state = {
  lenis: null,
  video: null,
  canvas: null,
  ctx: null,
  isVideoReady: false,
  videoDuration: 0,
  scrollScrubInitialized: false, // guard against duplicate init
  heroAnimationPlayed: false,    // guard against duplicate hero anim
}

// ============================================
// Lenis Smooth Scroll
// ============================================
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  })

  // Connect Lenis to GSAP's ticker for perfect sync
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000) // Lenis expects ms, GSAP ticker gives seconds
  })
  gsap.ticker.lagSmoothing(0) // Prevent GSAP from throttling on tab switch

  // Sync ScrollTrigger when Lenis scrolls
  lenis.on('scroll', ScrollTrigger.update)

  state.lenis = lenis
  return lenis
}

// ============================================
// Age Gate
// ============================================
function initAgeGate() {
  const ageGate = document.getElementById('age-gate')
  const enterBtn = document.getElementById('age-enter')
  const exitBtn = document.getElementById('age-exit')

  if (!ageGate || !enterBtn || !exitBtn) return

  // Clear legacy localStorage
  localStorage.removeItem('ageVerified')

  // If already verified this session, hide immediately
  if (sessionStorage.getItem('ageVerified') === 'true') {
    ageGate.style.display = 'none'
    return
  }

  enterBtn.addEventListener('click', () => {
    sessionStorage.setItem('ageVerified', 'true')
    ageGate.classList.add('hidden')
    // Play hero animation when gate starts fading
    playHeroEntryAnimation()
    // Remove from DOM after transition
    setTimeout(() => { ageGate.style.display = 'none' }, 700)
  })

  exitBtn.addEventListener('click', () => {
    window.location.href = 'https://www.google.com'
  })
}

// ============================================
// Hero Entry Animation
// ============================================
function playHeroEntryAnimation() {
  if (state.heroAnimationPlayed) return
  state.heroAnimationPlayed = true

  const tl = gsap.timeline()

  tl.from('.hero-badge', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    ease: 'power3.out'
  })
  .from('.title-line', {
    y: 60,
    opacity: 0,
    scale: 0.95,
    duration: 0.8,
    ease: 'expo.out'
  }, '-=0.4')
  .from('.title-subtitle', {
    y: 20,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out'
  }, '-=0.5')
  .from('.hero-subtitle', {
    x: -30,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.5')
  .from('.scroll-indicator', {
    opacity: 0,
    duration: 0.6
  }, '-=0.3')
}

// ============================================
// Show Main Content (loading → content)
// ============================================
function showMainContent() {
  const loading = document.getElementById('loading')
  const mainContent = document.getElementById('main-content')

  if (loading) {
    loading.classList.add('hidden')
    setTimeout(() => { loading.style.display = 'none' }, 600)
  }

  // Reveal main content
  if (mainContent) {
    mainContent.classList.add('visible')
  }

  // If already age-verified (returning session), play hero now
  if (sessionStorage.getItem('ageVerified') === 'true') {
    playHeroEntryAnimation()
  }
}

// ============================================
// Background Video Handler
// ============================================
function initBackgroundVideo() {
  const video = document.getElementById('hero-video')
  if (!video) {
    showMainContent()
    return
  }

  // Use 'loadeddata' or 'canplay'
  video.addEventListener('loadeddata', () => {
    state.isVideoReady = true
    showMainContent()
  }, { once: true })

  // Error fallback
  video.addEventListener('error', (e) => {
    console.error('Video load error:', e)
    showMainContent()
  }, { once: true })

  // Safety timeout
  setTimeout(() => {
    if (!state.isVideoReady) {
      console.warn('Video timeout — showing content anyway')
      showMainContent()
    }
  }, 5000)

  // Ensure it plays on mobile (some browsers need programmatic play even with autoplay)
  video.play().catch(e => console.warn('Autoplay prevented:', e))
}

// ============================================
// Section Scroll Animations
// ============================================
function initScrollAnimations() {
  // Animate all sections except hero (hero has its own entry)
  const sections = gsap.utils.toArray('.section:not(.hero-section)')

  sections.forEach(section => {
    // Animate the section title if present
    const title = section.querySelector('.section-title')
    if (title) {
      gsap.from(title, {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
      })
    }

    // Animate cards and content elements
    const cards = section.querySelectorAll(
      '.product-card, .collection-card, .offer-card, .footer-brand, .footer-info, .footer-legal'
    )

    if (cards.length > 0) {
      gsap.from(cards, {
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      })
    }
  })
}

// ============================================
// Init
// ============================================
function init() {
  initLenis()
  initAgeGate()
  initBackgroundVideo()
  initScrollAnimations()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
