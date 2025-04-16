"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"

export function SiteFooter() {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState("")
  const footerRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (footerRef.current) {
      observer.observe(footerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Parallax effect
  useEffect(() => {
    const handleParallax = () => {
      if (!parallaxRef.current) return;
      
      const scrolled = window.scrollY;
      const rate = scrolled * 0.15;
      
      parallaxRef.current.style.transform = `translate3d(0, ${rate}px, 0)`;
    };

    window.addEventListener('scroll', handleParallax);
    
    return () => {
      window.removeEventListener('scroll', handleParallax);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically handle the newsletter subscription
    alert(`Thanks for subscribing with ${email}!`)
    setEmail("")
  }

  return (
    <footer 
      ref={footerRef}
      className={`bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative overflow-hidden ${isVisible ? 'footer-visible' : ''}`}
    >
      {/* Parallax background effect */}
      <div ref={parallaxRef} className="parallax-bg" aria-hidden="true"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start mb-16">
          <div className="mb-8 md:mb-0 footer-item max-w-xs">
            <div className="logo-text text-2xl font-playfair font-bold mb-2">Beyond Measure</div>
            <p className="text-sm font-inter text-gray-500 dark:text-gray-400 mb-6">Connecting teachers with donors to fund educational projects that make a difference in students' lives.</p>
            
            <div className="social-links">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="https://fb.me/GoBeyondMeasure.org" className="social-icon-wrapper">
                  <span className="sr-only">Facebook</span>
                  <svg className="social-icon facebook-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/gobeyondmeasure" className="social-icon-wrapper">
                  <span className="sr-only">Instagram</span>
                  <svg className="social-icon instagram-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com/BeyondMeasureGo" className="social-icon-wrapper">
                  <span className="sr-only">X (Twitter)</span>
                  <svg className="social-icon twitter-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.6823 10.6218L20.2391 3H18.5778L12.9336 9.61788L8.41036 3H3.26562L10.0836 13.0074L3.26562 21H4.92702L10.8323 14.0113L15.5897 21H20.7344L13.6823 10.6218ZM11.5336 13.0371L10.6553 11.6697L5.18352 4.2971H7.14168L11.5835 10.1533L12.4617 11.5207L18.1559 19.1631H16.1977L11.5336 13.0371Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
            <div className="footer-item delay-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Navigate</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="footer-link">Home</Link>
                </li>
                <li>
                  <Link href="/about" className="footer-link">About</Link>
                </li>
                <li>
                  <Link href="/contact" className="footer-link">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="footer-item delay-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/faq" className="footer-link">FAQ</Link>
                </li>
                <li>
                  <Link href="/projects" className="footer-link">Projects</Link>
                </li>
                <li>
                  <Link href="/dashboard" className="footer-link">Dashboard</Link>
                </li>
              </ul>
            </div>
            <div className="footer-item delay-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-of-use" className="footer-link">Terms of Use</Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="footer-link">Cookie Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="footer-item delay-4 w-full md:w-auto md:min-w-[300px]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Subscribe to Our Newsletter</h3>
            <p className="text-sm text-gray-500 mb-4">Stay updated with the latest projects and opportunities.</p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky text-sm font-inter"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-navy to-sky text-white rounded-md hover:opacity-90 transition-all duration-200 text-sm font-medium font-inter"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-500 dark:text-gray-400 footer-item delay-5">
          <p className="font-inter">© {new Date().getFullYear()} Beyond Measure. All rights reserved.</p>
        </div>
      </div>

      <style jsx global>{`
        /* Component styles */
        .footer-item {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .footer-visible .footer-item {
          opacity: 1;
          transform: translateY(0);
        }

        .delay-1 {
          transition-delay: 0.2s;
        }

        .delay-2 {
          transition-delay: 0.4s;
        }

        .delay-3 {
          transition-delay: 0.6s;
        }

        .delay-4 {
          transition-delay: 0.8s;
        }
        
        .delay-5 {
          transition-delay: 1s;
        }
        
        .parallax-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 30% 20%, rgba(58, 181, 233, 0.03) 0%, transparent 200px),
            radial-gradient(circle at 70% 60%, rgba(14, 93, 127, 0.03) 0%, transparent 200px),
            radial-gradient(circle at 90% 90%, rgba(168, 191, 135, 0.03) 0%, transparent 200px);
          will-change: transform;
          z-index: 1;
        }

        .logo-text {
          background: linear-gradient(135deg, #0E5D7F 0%, #3AB5E9 50%, #0E5D7F 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: gradientMove 8s ease infinite;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .footer-link {
          position: relative;
          color: #6B7280;
          font-size: 0.875rem;
          font-family: var(--font-inter);
          transition: color 0.3s ease;
          padding-left: 0;
          display: inline-block;
        }
        
        .footer-link::before {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #3AB5E9, #0E5D7F);
          transition: width 0.3s ease;
        }
        
        .footer-link:hover {
          color: #3AB5E9;
        }
        
        .footer-link:hover::before {
          width: 100%;
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
          100% {
            background-position: 0% center;
          }
        }

        .social-icon-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .social-icon-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(45deg, transparent, transparent);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .social-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #777;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .social-icon-wrapper:hover::before {
          opacity: 1;
          background: linear-gradient(
            45deg, 
            #3AB5E9, /* sky */
            #E96951, /* salmon */
            #A8BF87  /* grass */
          );
          animation: rotate 1.5s linear infinite;
        }

        .social-icon-wrapper:hover .facebook-icon {
          color: #3AB5E9; /* sky */
        }

        .social-icon-wrapper:hover .instagram-icon {
          color: #E96951; /* salmon */
        }

        .social-icon-wrapper:hover .twitter-icon {
          color: #0E5D7F; /* navy */
        }

        .social-icon-wrapper:hover::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.15;
          transform: scale(1);
          animation: pulse 1.5s ease-out infinite;
        }
        
        .newsletter-form input {
          background-color: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .newsletter-form input:focus {
          box-shadow: 0 0 0 2px rgba(58, 181, 233, 0.3);
        }
        
        .newsletter-form button {
          position: relative;
          overflow: hidden;
        }
        
        .newsletter-form button:after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: all 0.8s ease;
        }
        
        .newsletter-form button:hover:after {
          left: 100%;
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.3;
          }
        }

        @media (hover: hover) {
          .social-icon-wrapper:hover::before {
            opacity: 1;
          }
        }
        
        /* Improved responsive styling */
        @media (max-width: 768px) {
          .footer-item {
            margin-bottom: 2rem;
          }
          
          .newsletter-form {
            width: 100%;
          }
          
          .newsletter-form input,
          .newsletter-form button {
            width: 100%;
          }
        }
      `}</style>
    </footer>
  )
}
