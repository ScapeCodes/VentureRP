import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { siteConfig } from '../config'

const links = [
  { to: '/', label: 'Home' },
  { to: '/join', label: 'Join us' },
  { to: '/rules', label: 'Rules' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="nav-inner">
        <NavLink className="brand" to="/" onClick={() => setOpen(false)} aria-label="Venture Roleplay home">
          <img src="/logo.png" alt="" />
          <span><b>VENTURE</b><small>ROLEPLAY</small></span>
        </NavLink>

        <nav className={`nav-links ${open ? 'nav-links--open' : ''}`} aria-label="Main navigation">
          {links.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span>0{index + 1}</span>{link.label}
            </NavLink>
          ))}
          <a className="button button--small nav-discord" href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
            Discord <ArrowUpRight size={15} />
          </a>
        </nav>

        <button className="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
