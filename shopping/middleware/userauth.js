const jwt=require("jsonwebtoken")
const User=require("../model/usermodel")

const auth=async(req,resp,next)=>{
    const token=req.cookies.ujwt
    try {
        const data=await jwt.verify(token,process.env.U_KEY)

        if (data) {
            const user=await User.findOne({_id:data._id})
            
                req.user=user
                req.token=token
                next()
        } else {
            resp.render("userlogin",{err:"Please login first !!"})
        }
    } catch (error) {
        resp.render("userlogin",{err:"Please login first !!"})
    }
}

module.exports=auth 