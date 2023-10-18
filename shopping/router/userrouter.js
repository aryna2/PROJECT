const router=require("express").Router()
const Category=require("../model/categorys")
const auth=require("../middleware/userauth")
const Product=require("../model/product")
const User=require("../model/usermodel")
const jwt=require("jsonwebtoken")
const bcrypt=require("bcryptjs")

router.get("/index",auth,async(req,resp)=>{
    try {
        const pdata=await Product.find()

        resp.render("index",{pdata:pdata})
    } catch (error) {
        console.log(error);
    }
})

router.get("/registration",(req,resp)=>{
    resp.render("registration")
})

router.get("/userlogin",(req,resp)=>{
    resp.render("userlogin")
})

router.post("/do_register",async(req,resp)=>{
    try {
        const user=new User(req.body)
        await user.save()

        resp.render("registration",{msg:"registration succesfully done.."})
    } catch (error) {
        console.log(error);
    }
})

router.post("/do_login",async(req,resp)=>{
    try {
        const user=await User.findOne({email:req.body.email})
        const isvalid=await bcrypt.compare(req.body.pass,user.pass)
        
        if (isvalid) {
            const token=await jwt.sign({_id:user._id},process.env.U_KEY)

            resp.cookie("ujwt",token)
            resp.redirect("index")
        } else {
            resp.render("login",{err:"invalid credentials"})
        }
    } catch (error) {
        resp.render("login",{err:"invalid credentials"})
    }
})

router.get("/shop",async(req,resp)=>{
    try {
        const catdata=await Category.find()

        resp.render("shop",{catdata:catdata})
    } catch (error) {
        console.log(error);
    }
}) 

router.get("/contact",(req,resp)=>{
    resp.render("contact")
})

/**********cart**********/

const Cart=require("../model/cart")

router.get("/add_cart",auth,async(req,resp)=>{
    const uid=req.user._id
    const pid=req.query.pid

    try {
        const cartdata=await Cart.findOne({$and : [{uid:uid},{pid:pid}]})
        if (cartdata) {
            var qty=cartdata.qty
            qty++
            var price=cartdata.price*qty
            await Cart.findByIdAndUpdate(cartdata._id,{qty:qty,total:price})

            resp.send("product added to cart..")
        } else {
            const pdata=await Product.findOne({_id:pid})
            const cart=new Cart({uid:uid,pid:pid,price:pdata.price,qty:1,total:pdata.price})
            await cart.save()

            resp.send("product added to cart..")
        }
    } catch (error) {
        console.log(error);
    }
})

router.get("/cart",auth,async(req,resp)=>{
    const user=req.user
    try {
        const cartdata = await Cart.aggregate([
            { $match: { uid: user._id } },
            { $lookup: { 
                from: "products",
                localField: "pid",
                foreignField: "_id",
                as: "product" 
            }} ])

            var sum=0
            for(var i=0;i<cartdata.length;i++)
            {
                sum=sum + cartdata[i].total
            }
            resp.render("cart",{cartdata:cartdata,total:sum})
    } catch (error) {
        console.log(error);
    }
})

router.get("/changeqty",auth,async(req,resp)=>{
    try {
        const cid=req.query.cid
        const value=req.query.value
        const cartdata=await Cart.findOne({_id:cid})

        var qty=cartdata.qty+Number(value)

        if (qty!=0) {
            var price=cartdata.price*qty
            await Cart.findByIdAndUpdate(cid,{qty:qty,total:price})

            resp.send()
        } else {
            resp.send()       
        }
    } catch (error) {
        console.log(error);
    }
})

router.get("/removefromcart",auth,async(req,resp)=>{
    try {
        const cid=req.query.pid
        await Cart.findByIdAndDelete(cid)

        resp.send()
    } catch (error) {
        console.log(error);
    }
})

/**********payment **********/

const Razorpay=require("razorpay")

router.get("/payment",(req,resp)=>{
    const amt=req.query.amt
    const Razorpay = require('razorpay');
    var instance = new Razorpay({ key_id: 'rzp_test_D8tPFLfczfnnK6', key_secret: 'i59j2xt83PRaYffVT2t1rfl6' })

    var options = {
        amount: Number(amt)*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function(err, order) {
    resp.send(order)
    });
})

/**********order**********/

const Order=require("../model/order")
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'other112001@gmail.com',
      pass: 'jecepcsgvvejzcbs'
    }
  });

router.get("/confirmOrder",auth,async(req,resp)=>{
    try {
        const uid=req.user._id
        const payid=req.query.pid

        const cartdata=await Cart.find({uid:uid})
        var productlist=[]
        var alltotal=0
        var row=""

        for(var i=0;i<cartdata.length;i++)
        {
            const pdata=await Product.findOne({_id:cartdata[i].pid})

            var pname=pdata.pname
            var price=pdata.price
            var qty=cartdata[i].qty
            var total=Number(price)*Number(qty)

            productlist[i]={
                pname:pname,
                price:price,
                qty:qty,
                total:total
            }
            alltotal=alltotal+total
            row=row+"<tr><td>"+pname+"</td><td>"+price+"</td><td>"+qty+"</td><td>"+total+"</td><tr/>"

            const order=new Order({uid:uid,payid:payid,product:productlist,total:alltotal})
            await order.save()

            var mailOptions = {
                from: 'other112001@gmail.com',
                to: 'other852369@gmail.com',
                subject: 'order confirmed',
                html:"<table border='1'><tr><th>Product name</th><th>Price</th><th>qty</th><th>Total</tr>"+row+"<tr><td>"+alltotal+"</td></tr></table>"
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                    resp.send("order confirmed..")
                }
              });

            resp.send("order confirmed..")
        }
    } catch (error) {
        console.log(error);
    }
})

module.exports=router 