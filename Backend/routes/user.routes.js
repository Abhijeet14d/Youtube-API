const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user.model.js');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary.js');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/auth.middleware.js');

router.post('/register', async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const uploadImage = await cloudinary.uploader.upload(req.files.logoUrl.tempFilePath);
        const newUser = new User({
            _id: new mongoose.Types.ObjectId,
            channelName: req.body.channelName,
            email: req.body.email, 
            phone: req.body.phone,
            password: hashedPassword,
            logoUrl: uploadImage.secure_url,
            logoId: uploadImage.public_id
        });
        await newUser.save();
        res.status(201).json({msg: 'User created successfully',newUser});
    }catch(err){
        res.status(500).json({msg: 'Error creating user', error: err.message});
    }
});

router.post('/login', async (req,res) =>{
    try{
        const existingUser = await User.findOne({email: req.body.email});
        if(!existingUser){
            return res.status(404).json({msg: 'User not found'});
        }
        const isvalid = await bcrypt.compare(req.body.password, existingUser.password);
        if(!isvalid){
            return res.status(500).json({msg: 'Invalid credentials'});
        }
        const token = jwt.sign({
            _id: existingUser._id,
            channelName: existingUser.channelName,
            email: existingUser.email,
            phone: existingUser.phone,
            logoId: existingUser.logoId
        }, process.env.JWT_SECRET, {expiresIn: "2d"});

        res.status(200).json({msg: 'Login successful', existingUser, token: token});
    }catch(err){
        res.status(500).json({msg: 'Error logging in', error: err.message});
    }
});

router.put('/update-profile', checkAuth, async (req, res) =>{
    try {
        const { channelName, phone } = req.body;
        let updatedData = { channelName, phone };

        if(req.files && req.files.logo){
            const uploadImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath);
            updatedData.logoUrl = uploadImage.secure_url;
            updatedData.logoId = uploadImage.public_id;
        }

        const updatedUser = await User.findByIdAndUpdate(req.userData._id, updatedData, {new: true});

        res.status(200).json({msg: 'Profile updated successfully', updatedUser});
    } catch (error) {
        res.status(500).json({msg: 'Error updating profile', error: error.message});
    }
});

router.post('/subscribe', checkAuth, async (req, res) =>{
    try {
        const { channelId } = req.body;
        if( req.user._id === channelId){
            return res.status(400).json({msg: 'You cannot subscribe to your own channel'});
        }
        await User.findByIdAndUpdate(req.user._id, {$addToSet: {subscribedChannels: channelId}});

        await User.findByIdAndUpdate(channelId, {$inc: {subscribers: 1},});

        res.status(200).json({msg: 'Subscribed successfully'});
    } catch (error) {
        res.status(500).json({msg: 'Error subscribing', error: error.message});
    }
});

module.exports = router;