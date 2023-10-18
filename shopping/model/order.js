const mongoose=require("mongoose")

const orderSchema=new mongoose.Schema({
    uid:{
        type:mongoose.Schema.Types.ObjectId
    },
    payid:{
        type:String
    },
    product:[{
        pname:{
            type:String
        },
        price:{
            type:Number
        },
        qty:{
            type:Number
        },
        total:{
            type:Number
        }
    }],
    total:{
        type:Number
    }
})

module.exports=new mongoose.model("Order",orderSchema)