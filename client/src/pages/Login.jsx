import { useState } from "react"
import { loginUser } from "../services/authService"
import { setToken } from "../utils/auth"
import { useNavigate } from "react-router-dom"
import { Train, Eye, EyeOff } from "lucide-react"

function Login() {
  const navigate = useNavigate()
  const [nid, setNid] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()

    const res = await loginUser({ nid, password })
    setToken(res.data.token)

    alert("Logged in")
    navigate("/dashboard")
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 font-sans relative overflow-hidden">

      {/* Background decorative blobs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Horizontal accent lines */}
      <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent pointer-events-none" />
      <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 mb-3">
            <Train className="w-6 h-6 text-white" />
          </div>
          <span className="text-white tracking-tight" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            MetroRail
          </span>
          <span className="text-blue-300 tracking-widest uppercase" style={{ fontSize: "0.58rem", fontWeight: 500 }}>
            Management System
          </span>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/50 overflow-hidden w-full">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

          <div className="px-8 py-7">
            {/* Heading */}
            <div className="mb-6 text-center px-1">
              <h1 className="text-gray-900 mb-0.5" style={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.2 }}>
                Welcome back
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="flex flex-col gap-4">

              {/* NID Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  National ID (NID)
                </label>
                <input
                  type="text"
                  placeholder="Enter NID"
                  value={nid}
                  onChange={e => setNid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                             transition-all duration-200"
                  style={{ fontSize: "0.88rem" }}
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                               transition-all duration-200"
                    style={{ fontSize: "0.88rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: "1rem", height: "1rem" }} />
                      : <Eye style={{ width: "1rem", height: "1rem" }} />
                    }
                  </button>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end mt-0.5">
                  <a
                    href="#"
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    style={{ fontSize: "0.76rem", fontWeight: 500 }}
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="group mt-1 w-full flex items-center justify-center gap-2.5 px-6 py-3
                           bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                           transition-all duration-200 shadow-lg shadow-blue-200
                           active:scale-[0.98]"
                style={{ fontSize: "0.92rem", fontWeight: 600 }}
              >
                Sign In
              </button>
            </form>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-blue-200 mt-4" style={{ fontSize: "0.8rem" }}>
          Don't have an account?{" "}
          <a href="/register" className="text-white font-semibold hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login