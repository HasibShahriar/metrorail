import { useEffect, useState } from "react"
import { getProfile } from "../services/authService"
import { logout } from "../utils/auth"

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getProfile()
        setUser(res.data.user)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  if (!user) return <div className="text-center mt-20 text-white">Loading...</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-600 to-blue-500 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-96 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-500 mb-6">{user.email}</p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}