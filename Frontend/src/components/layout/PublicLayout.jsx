import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SocialBar from './SocialBar'

export default function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className={`public-site ${isHome ? 'public-home-shell' : ''}`}>
      <div id="top"></div>
      <Header />
      <SocialBar />
      <Outlet />
      <Footer />
    </div>
  )
}
