const bcrypt = require("bcrypt")
const { findUserByNid, createUser } = require("../models/passengerModel")
const generateToken = require("../utils/generateToken")

const register = async (req,res)=>{
    const {name,nid,password} = req.body

    const hashed = await bcrypt.hash(password,10)

    await createUser(name,nid,hashed)

    res.json({message:"registered"})
}

const login = async (req,res)=>{
    const {nid,password} = req.body

    const user = await findUserByNid(nid)

    if(!user) return res.status(401).json({message:"invalid"})

    const valid = await bcrypt.compare(password,user.password)

    if(!valid) return res.status(401).json({message:"invalid"})

    const token = generateToken(user)

    res.json({token})
}

module.exports = { register, login }