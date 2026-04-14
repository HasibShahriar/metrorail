import { Link } from "react-router-dom"

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-purple-600 to-blue-500 font-sans">
      <div className="bg-white rounded-3xl shadow-xl p-12 text-center w-96">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome</h1>
        <p className="text-gray-500 mb-8">Please login or register</p>
        <div className="flex justify-center gap-6">
          <Link to="/login">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">
              Login
            </button>
          </Link>
          <Link to="/register">
            <button className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition">
              Register
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing