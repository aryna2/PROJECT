const router=require("express").Router()
const Admin=require("../model/adminmodel")
const jwt=require("jsonwebtoken")
const auth=require("../middleware/adminauth")
const fs=require("fs")

router.get("/dashboard",auth,(req,resp)=>{
    resp.render("dashboard")
})

router.get("/adminlogin",(req,resp)=>{
    resp.render("adminlogin")
})

router.post("/admin_login",async(req,resp)=>{
    try {
        const admin=await Admin.findOne({uname:req.body.uname})

        if (admin.pass==req.body.pass) {
            const token=await jwt.sign({_id:admin._id},process.env.A_KEY)

            resp.cookie("ajwt",token)
            resp.render("dashboard")
        } else {
            resp.render("adminlogin",{err:"Invalid credentials"})
        }
    } catch (error) {
        resp.render("adminlogin",{err:"Invalid credentials"})
    }
}) 

router.get("/admin_logout",auth,(req,resp)=>{
    resp.clearCookie("ajwt")
    resp.render("adminlogin")
})

router.get("/orders",auth,(req,resp)=>{
    resp.render("orders")
})

/**********category**********/

const Category=require("../model/categorys")

router.get("/view_category",auth,async(req,resp)=>{
    try {
        const catdata=await Category.find()

        resp.render("category",{catdata:catdata})
    } catch (error) {
        console.log(error);
    }
})

router.post("/add_category",auth,async(req,resp)=>{
    try {
        if (req.body.id=="") {
            const catadd=new Category(req.body)
            await catadd.save()

            resp.redirect("view_category")
        } else {
            await Category.findByIdAndUpdate(req.body.id,{catname:req.body.catname})

            resp.redirect("view_category")
        }
    } catch (error) {
        console.log(error);
    }
})

router.get("/delete_category",async(req,resp)=>{
    const _id=req.query.cid
    try {
        await Category.findByIdAndDelete(_id)

        resp.redirect("view_category")
    } catch (error) {
        console.log(error);
    }
})

router.get("/edit_category",async(req,resp)=>{
    const _id=req.query.cid
    try {
        const catedit=await Category.findOne({_id:_id})
        const catdata=await Category.find()

        resp.render("category",{edata:catedit,catdata:catdata})
    } catch (error) {
        console.log(error);
    }
})

/**********product**********/

const Product=require("../model/product")
const multer=require("multer")

const storageEngine=multer.diskStorage({
    destination:"./public/productimg",
    filename:(req,file,cb)=>{
        cb(null,`${Date.now()}--${file.originalname}`)
    }
})

const upload=multer({
    storage:storageEngine
})

router.get("/view_products",auth,async(req,resp)=>{
    try {
        const catdata=await Category.find()
        const pdata=await Product.aggregate([{$lookup:{
            from:"categorys",
            localField:"catid",
            foreignField:"_id",
            as:"category"}}])
        
        resp.render("products",{catdata:catdata,pdata:pdata})
    } catch (error) {
        console.log(error);
    }
})

router.post("/add_product",upload.single("img"),auth,async(req,resp)=>{
    try {
        if(req.body.id==""){
        const padd=new Product({
            catid:req.body.catid,
            pname:req.body.pname,
            price:req.body.price,
            qty:req.body.qty,
            img:req.file.filename
        })
        const dt=await padd.save()
        
        resp.redirect("view_products")
        }else{
            await Product.findByIdAndUpdate(req.body.id,{
                catid:req.body.catid,
                pname:req.body.pname,
                price:req.body.price,
                qty:req.body.qty,
                img:req.file.filename})

            resp.redirect("view_products")
        }
    } catch (error) {
        console.log(error);
    }
})

router.get("/delete_product",async(req,resp)=>{
    try {
        const _id=req.query.cid
        const pdelete=await Product.findByIdAndDelete(_id)

        fs.unlinkSync("public/productimg/"+ pdelete.img)
        
        resp.redirect("view_products")
    } catch (error) {
        console.log(error);
    }
})

router.get("/edit_product",async(req,resp)=>{
    const _id=req.query.cid
    try {
        const pedit=await Product.findOne({_id:_id})
        const catdata=await Category.find()
        const pdata=await Product.aggregate([{ $lookup: {
            from:"categorys",
            localField:"catid", 
            foreignField:"_id",
            as:"category"
        }}])

        resp.render("products",{edata:pedit,catdata:catdata,pdata:pdata})
    } catch (error) {
        console.log(error);
    }
})

/**********order**********/

const User=require("../model/usermodel")

router.get("/view_users",auth,async(req,resp)=>{
    try {
        const usersdata=await User.find()

        resp.render("users",{usersdata:usersdata})
    } catch (error) {
        console.log(error);
    }
})

module.exports=router 