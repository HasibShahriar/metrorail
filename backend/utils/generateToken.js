const jwt = require("jsonwebtoken")

const generateToken = (user)=>{
    return jwt.sign(
        {id:user.passenger_id,nid:user.nid,role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
}

module.exports = generateToken