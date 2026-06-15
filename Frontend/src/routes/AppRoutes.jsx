import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import PublicLayout from '../components/layout/PublicLayout'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import GoogleCallbackPage from '../pages/auth/GoogleCallbackPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import ResetSuccessPage from '../pages/auth/ResetSuccessPage'
import VerifyOtpPage from '../pages/auth/VerifyOtpPage'
import BusinessTourDetailPage from '../pages/public/BusinessTourDetailPage'
import BusinessToursPage from '../pages/public/BusinessToursPage'
import HomePage from '../pages/public/HomePage'
import NewsDetailPage from '../pages/public/NewsDetailPage'
import NewsPage from '../pages/public/NewsPage'
import PricingPage from '../pages/public/PricingPage'
import PromotionDetailPage from '../pages/public/PromotionDetailPage'
import PromotionsPage from '../pages/public/PromotionsPage'
import RegionToursPage from '../pages/public/RegionToursPage'
import SearchPage from '../pages/public/SearchPage'
import TourDetailPage from '../pages/public/TourDetailPage'
import ToursPage from '../pages/public/ToursPage'

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/verify-otp', element: <VerifyOtpPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
      { path: '/auth/reset-success', element: <ResetSuccessPage /> },
      { path: '/auth/google-callback', element: <GoogleCallbackPage /> },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tours', element: <ToursPage /> },
      { path: '/tours/:id', element: <TourDetailPage /> },
      { path: '/tours/region/:mien', element: <RegionToursPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/promotions', element: <PromotionsPage /> },
      { path: '/promotions/:id', element: <PromotionDetailPage /> },
      { path: '/news', element: <NewsPage /> },
      { path: '/news/:id', element: <NewsDetailPage /> },
      { path: '/business-tours', element: <BusinessToursPage /> },
      { path: '/business-tours/:id', element: <BusinessTourDetailPage /> },
      { path: '/pricing', element: <PricingPage /> },
    ],
  },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
