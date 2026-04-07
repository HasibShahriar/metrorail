import { useState } from "react"
import { registerUser } from "../services/authService"
import { useNavigate } from "react-router-dom"
import { Train, Eye, EyeOff, Shield } from "lucide-react"

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registerUser({ name, nid, password });
      alert("Registered");
      navigate("/login");
    } catch (err) {
      let msg = "Registration failed. Please check your input.";
      if (err?.response?.data?.message) msg = err.response.data.message;
      setError(msg);
    }
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
                Create Account
              </h1>
            </div>
            {error && (
              <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="flex flex-col gap-4">

              {/* Name Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                             transition-all duration-200"
                  style={{ fontSize: "0.88rem" }}
                />
              </div>

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
                    placeholder="Create password"
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
                Submit
              </button>
            </form>

            {/* SSL badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-400">
              <Shield style={{ width: "0.8rem", height: "0.8rem" }} />
              <span style={{ fontSize: "0.7rem" }}>
                Secured with 256-bit SSL encryption
              </span>
            </div>
          </div>
        </div>

        {/* Login link */}
        <p className="text-center text-blue-200 mt-4" style={{ fontSize: "0.8rem" }}>
          Already have an account?{" "}
          <a href="/login" className="text-white font-semibold hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  )
}

export default Register