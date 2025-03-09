const mongoose = require('mongoose');

const ConnectDB = async()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    }catch(err){
        console.log("Some thing wrong with db: ",err);
    }
};

module.exports = ConnectDB;