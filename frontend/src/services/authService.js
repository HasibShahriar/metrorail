import API from "../api/axios"

export const registerUser = (data)=>{
    return API.post("/auth/register",data)
}

export const loginUser = (data)=>{
    return API.post("/auth/login",data)
}

export const getProfile = ()=>{
    return API.get("auth/profile")
}

export const updateProfile = (data)=>{
    return API.put("/auth/profile",data)
}

export const deleteProfile = ()=>{
    return API.delete("/auth/profile")
}