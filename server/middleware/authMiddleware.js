const jwt = require("jsonwebtoken")

const verifyToken = (req,res,next)=>{

    const bearer = req.headers.authorization
    if(!bearer) return res.sendStatus(403)

    const token = bearer.split(" ")[1]

    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err) return res.sendStatus(403)

        req.user = decoded
        next()
    })
}

module.exports = verifyToken