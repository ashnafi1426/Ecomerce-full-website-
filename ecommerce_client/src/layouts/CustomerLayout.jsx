import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatWidget from '../components/chat/ChatWidget'

const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ width: '100%', margin: 0, padding: 0 }}>
      <Header />
      <main className="flex-1" style={{ width: '100%', margin: 0, padding: 0 }}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default CustomerLayout
