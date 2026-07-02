import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './lib/cart'
import { FavoritesProvider } from './lib/favorites'
import { LanguageProvider } from './lib/language'
import { AuthProvider } from './lib/auth'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
