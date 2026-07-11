import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Branches from './pages/Branches'
import Contact from './pages/Contact'
import Favorites from './pages/Favorites'
import Brands from './pages/Brands'
import Book from './pages/Book'
import BookingSuccess from './pages/BookingSuccess'
import Finder from './pages/Finder'
import EyeExam from './pages/EyeExam'
import AccountLogin from './pages/account/Login'
import AccountRegister from './pages/account/Register'
import Account from './pages/account/Account'
import AccountOrders from './pages/account/Orders'
import AccountProfile from './pages/account/Profile'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminProductForm from './pages/admin/ProductForm'
import AdminOrders from './pages/admin/Orders'
import AdminCustomers from './pages/admin/Customers'
import AdminBookings from './pages/admin/Bookings'
import AdminReviews from './pages/admin/Reviews'
import AdminBranches from './pages/admin/Branches'
import AdminBrands from './pages/admin/Brands'

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/finder" element={<Finder />} />
        <Route path="/services/eye-exam" element={<EyeExam />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/book" element={<Book />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/account/register" element={<AccountRegister />} />
        <Route path="/account/login" element={<AccountLogin />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/orders" element={<AccountOrders />} />
        <Route path="/account/profile" element={<AccountProfile />} />
      </Route>

      {/* Admin — login is public; everything else is guarded */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="brands" element={<AdminBrands />} />
        </Route>
      </Route>
    </Routes>
  )
}
