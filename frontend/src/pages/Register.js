import { useState } from "react"
import { registerUser } from "../services/authService"
import { useNavigate } from "react-router-dom"

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [nid, setNid] = useState("")
  const [password, setPassword] = useState("")

  const submit = async (e) => {
    e.preventDefault()

    await registerUser({ name, nid, password })

    alert("Registered")
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-600 to-blue-500 font-sans">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-96">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Register</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="NID"
            value={nid}
            onChange={e => setNid(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            className="mt-4 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register