import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SocialBar from './SocialBar'

export default function PublicLayout() {
  return (
    <>
      <div id="top"></div>
      <Header />
      <SocialBar />
      <Outlet />
      <Footer />
    </>
  )
}
