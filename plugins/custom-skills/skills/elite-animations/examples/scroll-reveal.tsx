/**
 * GSAP ScrollTrigger Section with Pinning and Scrub
 * A section that pins while content animates in sequence as user scrolls.
 *
 * Dependencies: npm install gsap @gsap/react
 * Usage: <ScrollRevealSection />
 */
"use client"

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

interface FeatureItem {
  title: string
  description: string
  icon: string
}

const FEATURES: FeatureItem[] = [
  {
    title: 'Real-Time Scheduling',
    description: 'Assign crews, manage timelines, and track progress in real time.',
    icon: '01',
  },
  {
    title: 'Expense Tracking',
    description: 'Capture receipts, categorize costs, and generate reports instantly.',
    icon: '02',
  },
  {
    title: 'Team Management',
    description: 'Onboard crew members, manage roles, and coordinate field operations.',
    icon: '03',
  },
]

export default function ScrollRevealSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          start: 'top top',
          end: '+=2500',
          scrub: 1,
          snap: {
            snapTo: 'labels',
            duration: { min: 0.2, max: 0.8 },
            delay: 0.1,
            ease: 'power1.inOut',
          },
        },
      })

      // Phase 1: Headline fades in
      tl.addLabel('start')
        .from('.scroll-headline', {
          opacity: 0,
          y: 60,
          duration: 1,
        })
        .addLabel('headline')

      // Phase 2: Subtext appears
        .from('.scroll-subtext', {
          opacity: 0,
          y: 30,
          duration: 0.8,
        })
        .addLabel('subtext')

      // Phase 3: Feature cards stagger in
        .from('.feature-card', {
          opacity: 0,
          y: 50,
          scale: 0.95,
          stagger: 0.3,
          duration: 1,
        })
        .addLabel('cards')

      // Phase 4: Background shifts
        .to('.scroll-bg', {
          backgroundColor: '#111111',
          duration: 1,
        })
        .addLabel('end')
    },
    { scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className="scroll-bg relative min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-8"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h2 className="scroll-headline text-5xl font-bold font-mohave text-[#F5F5F5] mb-4">
          Built for the Field
        </h2>

        {/* Subtext */}
        <p className="scroll-subtext text-lg text-[#A0A0A0] font-kosugi mb-16 max-w-2xl mx-auto">
          Everything your crew needs, designed for the job site.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.icon}
              className="feature-card bg-[#0D0D0D] border border-[#2A2A2A] rounded-[5px] p-6 text-left"
            >
              <span className="text-3xl font-bebas text-[#597794] block mb-3">
                {feature.icon}
              </span>
              <h3 className="text-lg font-mohave font-semibold text-[#F5F5F5] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#A0A0A0] font-kosugi">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
