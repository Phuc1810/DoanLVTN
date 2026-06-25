import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'
import SocialBar from './SocialBar'

export default function CustomerLayout() {
  return (
    <div className="customer-site">
      <div id="top"></div>
      <Header />
      <SocialBar />
      <Outlet />
      <Footer />
    </div>
  )
}
