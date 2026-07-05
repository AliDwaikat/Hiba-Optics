import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './lib/cart'
import { FavoritesProvider } from './lib/favorites'
import { LanguageProvider } from './lib/language'
import { AuthProvider } from './lib/auth'
import { CustomerAuthProvider } from './lib/customerAuth'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <LanguageProvider>
            <CartProvider>
              <FavoritesProvider>
                <App />
              </FavoritesProvider>
            </CartProvider>
          </LanguageProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
