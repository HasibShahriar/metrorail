export const setToken = (token)=>{
    sessionStorage.setItem("token",token)
}

export const getToken = ()=>{
    return sessionStorage.getItem("token")
}

export const getUserInfo = ()=>{
    const userInfo = sessionStorage.getItem("userInfo")
    return userInfo ? JSON.parse(userInfo) : null
}

export const setUserInfo = (user)=>{
    sessionStorage.setItem("userInfo", JSON.stringify(user))
}

export const logout = ()=>{
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
}