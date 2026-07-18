import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import AdminLayout from '../components/admin/AdminLayout'
import AuthLayout from '../components/layout/AuthLayout'
import CustomerLayout from '../components/layout/CustomerLayout'
import PublicLayout from '../components/layout/PublicLayout'
import StaffLayout from '../components/staff/StaffLayout'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import GoogleCallbackPage from '../pages/auth/GoogleCallbackPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import ResetSuccessPage from '../pages/auth/ResetSuccessPage'
import VerifyOtpPage from '../pages/auth/VerifyOtpPage'
import AdminAccountDetailPage from '../pages/admin/AdminAccountDetailPage'
import AdminAccountsPage from '../pages/admin/AdminAccountsPage'
import AdminCreateStaffPage from '../pages/admin/AdminCreateStaffPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import BookingSuccessPage from '../pages/customer/BookingSuccessPage'
import BusinessRequestDetailPage from '../pages/customer/BusinessRequestDetailPage'
import BusinessRequestsPage from '../pages/customer/BusinessRequestsPage'
import CancelOrderPage from '../pages/customer/CancelOrderPage'
import ChangePasswordPage from '../pages/customer/ChangePasswordPage'
import CreateBookingPage from '../pages/customer/CreateBookingPage'
import CreateBusinessRequestPage from '../pages/customer/CreateBusinessRequestPage'
import OrderDetailPage from '../pages/customer/OrderDetailPage'
import OrdersPage from '../pages/customer/OrdersPage'
import PaymentPage from '../pages/customer/PaymentPage'
import ProfilePage from '../pages/customer/ProfilePage'
import ReviewOrderPage from '../pages/customer/ReviewOrderPage'
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
import StaffBusinessRequestDetailPage from '../pages/staff/StaffBusinessRequestDetailPage'
import StaffBusinessRequestsPage from '../pages/staff/StaffBusinessRequestsPage'
import StaffChangePasswordPage from '../pages/staff/StaffChangePasswordPage'
import StaffAccountsPage from '../pages/staff/StaffAccountsPage'
import StaffDashboardPage from '../pages/staff/StaffDashboardPage'
import StaffLoginPage from '../pages/staff/StaffLoginPage'
import StaffNewsCreatePage from '../pages/staff/StaffNewsCreatePage'
import StaffNewsDetailPage from '../pages/staff/StaffNewsDetailPage'
import StaffNewsEditPage from '../pages/staff/StaffNewsEditPage'
import StaffNewsPage from '../pages/staff/StaffNewsPage'
import StaffOrderDetailPage from '../pages/staff/StaffOrderDetailPage'
import StaffOrdersPage from '../pages/staff/StaffOrdersPage'
import StaffPromotionCreatePage from '../pages/staff/StaffPromotionCreatePage'
import StaffPromotionDetailPage from '../pages/staff/StaffPromotionDetailPage'
import StaffPromotionEditPage from '../pages/staff/StaffPromotionEditPage'
import StaffPromotionsPage from '../pages/staff/StaffPromotionsPage'
import StaffTourCreatePage from '../pages/staff/StaffTourCreatePage'
import StaffTourDetailPage from '../pages/staff/StaffTourDetailPage'
import StaffTourEditPage from '../pages/staff/StaffTourEditPage'
import StaffToursPage from '../pages/staff/StaffToursPage'

const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    element: (
      <ProtectedRoute roles={['AD']} loginPath="/admin/login">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/admin', element: <AdminDashboardPage /> },
      { path: '/admin/accounts', element: <AdminAccountsPage /> },
      { path: '/admin/accounts/create-staff', element: <AdminCreateStaffPage /> },
      { path: '/admin/accounts/:id', element: <AdminAccountDetailPage /> },
    ],
  },
  {
    path: '/staff/login',
    element: <StaffLoginPage />,
  },
  {
    element: (
      <ProtectedRoute roles={['NV', 'AD']} loginPath="/staff/login">
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/staff', element: <StaffDashboardPage /> },
      { path: '/staff/accounts', element: <StaffAccountsPage /> },
      { path: '/staff/tours', element: <StaffToursPage /> },
      { path: '/staff/tours/create', element: <StaffTourCreatePage /> },
      { path: '/staff/tours/:id', element: <StaffTourDetailPage /> },
      { path: '/staff/tours/:id/edit', element: <StaffTourEditPage /> },
      { path: '/staff/orders', element: <StaffOrdersPage /> },
      { path: '/staff/orders/:id', element: <StaffOrderDetailPage /> },
      { path: '/staff/promotions', element: <StaffPromotionsPage /> },
      { path: '/staff/promotions/create', element: <StaffPromotionCreatePage /> },
      { path: '/staff/promotions/:id', element: <StaffPromotionDetailPage /> },
      { path: '/staff/promotions/:id/edit', element: <StaffPromotionEditPage /> },
      { path: '/staff/news', element: <StaffNewsPage /> },
      { path: '/staff/news/create', element: <StaffNewsCreatePage /> },
      { path: '/staff/news/:id', element: <StaffNewsDetailPage /> },
      { path: '/staff/news/:id/edit', element: <StaffNewsEditPage /> },
      { path: '/staff/business-requests', element: <StaffBusinessRequestsPage /> },
      { path: '/staff/business-requests/:id', element: <StaffBusinessRequestDetailPage /> },
      { path: '/staff/change-password', element: <StaffChangePasswordPage /> },
    ],
  },
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
    element: (
      <ProtectedRoute roles={['KH']}>
        <CustomerLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/profile', element: <ProfilePage /> },
      { path: '/change-password', element: <ChangePasswordPage /> },
      { path: '/bookings/create/:tourId', element: <CreateBookingPage /> },
      { path: '/payments/:orderId', element: <PaymentPage /> },
      { path: '/booking-success/:orderId', element: <BookingSuccessPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/orders/:id', element: <OrderDetailPage /> },
      { path: '/orders/:id/cancel', element: <CancelOrderPage /> },
      { path: '/orders/:id/review', element: <ReviewOrderPage /> },
      { path: '/business-requests/create', element: <CreateBusinessRequestPage /> },
      { path: '/business-requests', element: <BusinessRequestsPage /> },
      { path: '/business-requests/:id', element: <BusinessRequestDetailPage /> },
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
