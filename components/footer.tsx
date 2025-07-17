"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn("bg-muted/40 border-t", className)}>
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--aus-green))] to-[hsl(var(--aus-gold))]"></div>
              <h3 className="text-lg font-bold">Energi Hive</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Australia's premier marketplace for home battery systems, solar solutions, and energy management.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>123 Energy Way, Sydney NSW 2000</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>1300 ENERGY (367 349)</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>support@energihive.com.au</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/batteries" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  Battery Systems
                </Link>
              </li>
              <li>
                <Link href="/solar" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  Solar Solutions
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  Energy Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Australian Energy Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Australian Energy</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.cleanenergycouncil.org.au/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm flex items-center hover:text-[hsl(var(--energy-primary))] transition-colors"
                >
                  Clean Energy Council
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.aer.gov.au/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm flex items-center hover:text-[hsl(var(--energy-primary))] transition-colors"
                >
                  Australian Energy Regulator
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.energy.gov.au/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm flex items-center hover:text-[hsl(var(--energy-primary))] transition-colors"
                >
                  Department of Energy
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.aemc.gov.au/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm flex items-center hover:text-[hsl(var(--energy-primary))] transition-colors"
                >
                  Australian Energy Market Commission
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <Link href="/rebates" className="text-sm hover:text-[hsl(var(--energy-primary))] transition-colors">
                  Australian Rebates & Incentives
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Stay Connected</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for the latest energy news and exclusive offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 text-sm rounded-md border border-input bg-background"
              />
              <Button 
                size="sm" 
                className="bg-[hsl(var(--aus-green))] hover:bg-[hsl(var(--aus-green)/0.9)] text-white"
              >
                Subscribe
              </Button>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-[hsl(var(--energy-primary)/0.1)] transition-colors"
              >
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--energy-primary))]" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-[hsl(var(--energy-primary)/0.1)] transition-colors"
              >
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--energy-primary))]" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-[hsl(var(--energy-primary)/0.1)] transition-colors"
              >
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--energy-primary))]" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-[hsl(var(--energy-primary)/0.1)] transition-colors"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--energy-primary))]" />
              </a>
            </div>
          </div>
        </div>

        {/* Australian Energy Certifications */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--aus-green)/0.1)] flex items-center justify-center">
              <span className="text-[hsl(var(--aus-green))] font-bold text-xs">CEC</span>
            </div>
            <span className="text-xs text-muted-foreground">Clean Energy Council Approved Retailer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--aus-gold)/0.1)] flex items-center justify-center">
              <span className="text-[hsl(var(--aus-gold))] font-bold text-xs">5★</span>
            </div>
            <span className="text-xs text-muted-foreground">5 Star Energy Rating Provider</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--energy-primary)/0.1)] flex items-center justify-center">
              <span className="text-[hsl(var(--energy-primary))] font-bold text-xs">AES</span>
            </div>
            <span className="text-xs text-muted-foreground">Australian Energy Storage Council Member</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Energi Hive Pty Ltd. ABN 12 345 678 901. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/accessibility" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Accessibility
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4 max-w-xl mx-auto">
            Energi Hive is committed to Australia's renewable energy future. We acknowledge the Traditional Owners of country throughout Australia and recognize their continuing connection to land, waters and culture.
          </p>
        </div>
      </div>
    </footer>
  )
}
