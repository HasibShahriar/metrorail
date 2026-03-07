import { useState } from "react"
import { loginUser } from "../services/authService"
import { setToken } from "../utils/auth"
import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()
  const [nid, setNid] = useState("")
  const [password, setPassword] = useState("")

  const submit = async (e) => {
    e.preventDefault()

    const res = await loginUser({ nid, password })
    setToken(res.data.token)

    alert("Logged in")
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-600 to-blue-500 font-sans">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-96">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="NID"
            value={nid}
            onChange={e => setNid(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login