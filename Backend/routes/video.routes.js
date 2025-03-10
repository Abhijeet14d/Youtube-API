const express = require('express');
const videoRouter = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/video.model.js');
const User = require('../models/user.model.js');
const cloudinary = require('../config/cloudinary.js');
const checkAuth = require('../middleware/auth.middleware.js');


// Upload
videoRouter.post('/upload', checkAuth ,async (req, res)=>{
    try {
        const { title , description, category, tags } = req.body;
        if(!req.files || !res.files.video || !req.files.thumbnail){
            return res.status(400).json({msg: 'Please upload a video and a thumbnail'});
        }
        const videoUpload = await cloudinary.uploader.upload(req.files.video.tempFilePath, { resource_type: 'video', folder: 'videos' });
        const thumbnailUpload = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, { folder: 'thumbnails' });

        const newvideo = new Video({
            _id: new mongoose.Types.ObjectId(),
            title,
            description,
            user_id: req.user._id,
            videoUrl: videoUpload.secure_url,
            videoId: videoUpload.public_id,
            thumbnailUrl: thumbnailUpload.secure_url,
            thumbnailId: thumbnailUpload.public_id,
            category,
            tags: tags? tags.split(","): [],
        });

        await newvideo.save();
        res.status(201).json({msg: 'Video uploaded successfully', video: newvideo });
    } catch (error) {
        res.status(500).json({msg: 'Error uploading video', error: error.message});
    }
});

// Update
videoRouter.put('/update/:id', checkAuth, async (req, res)=>{
    try{
        const { title, description, category, tags } = req.body;
        const videoId = req.params.id;
        const video = await Video.findById(videoId);
        if(!video){
            return res.status(404).json({msg: 'Video not found'});
        }
        if(video.user_id.toString() !== req.user._id.toString()){
            return res.status(403).json({msg: 'You are not authorized to update this video'});
        }
        if(req.files && req.files.thumbnail){
            await cloudinary.uploader.destroy(video.thumbnailId);

            const thumbnailUpload = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, { folder: 'thumbnails' });

            video.thumbnailUrl = thumbnailUpload.secure_url;
            video.thumbnailId = thumbnailUpload.public_id;
        }
        video.title = title || video.title;
        video.description = description || video.description;
        video.category = category || video.category;
        video.tags = tags? tags.split(","): video.tags;
        await video.save();

        res.status(200).json({msg: 'Video updated successfully', video: updatedVideo});
    }catch(error){
        res.status(500).json({msg: 'Error updating video', error: error.message});
    }
});

// Delete
videoRouter.delete('/delete/:id', checkAuth, async (req, res)=>{
    try {
        const videoId = req.params.id;
        const video = await Video.findById(`video/${videoId}`);
        if(!video){
            return res.status(404).json({msg: 'Video not found'});
        }
        if(video.user_id.toString() !== req.user._id.toString()){
            return res.status(403).json({msg: 'You are not authorized to delete this video'});
        }

        await cloudinary.uploader.destroy(video.videoId);
        await cloudinary.uploader.destroy(video.thumbnailId);
        await video.findByIdAndDelete(videoId);
        res.status(200).json({msg: 'Video deleted successfully'});
    } catch (error) {
        res.status(500).json({msg: 'Error deleting video', error: error.message});
    }
});

// get own videos
videoRouter.get('/my-videos', checkAuth, async (req, res)=>{
    try {
        const videos = await Video.find({ user_id: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({videos});
    } catch (error) {
        res.status(500).json({msg: 'Error fetching videos', error: error.message});
    }
});

// get all videos
videoRouter.get("/all", async (req, res) => {
    try {
        const videos = await Video.find({ user_id: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({videos});
    } catch (error) {
        res.status(500).json({msg: 'Error fetching videos', error: error.message});
    }
});

// get video by id
videoRouter.get('/:id', checkAuth, async (req, res)=>{
    try {
        const videoId = req.params.id;
        const userId = req.user._id;

        const video = await Video.findByIdAndUpdate(videoId, {
            $addToSet: { viewedBy: userId },
        },
        { new: true }
        );
        if(!video) return res.status(404).json({msg: 'Video not found'});
        res.status(200).json({video
        });
    } catch (error) {
        res.status(500).json({msg: 'Error fetching video', error: error.message});
    }
});

// get video by category
videoRouter.get("/category/:category", async (req, res) => {
    try {
        const video = await Video.find({ category: req.params.category }).sort({ createdAt: -1 });
        res.status(200).json({video});
    } catch (error) {
        res.status(500).json({msg: 'Error fetching videos', error: error.message});
    }
});

// get video by tag
videoRouter.get("/tag/:tag", async (req, res) => {
    try {
        const tag = req.params.tag;
        const videos = await Video.find({ tags: tag }).sort({ createdAt: -1 });
        res.status(200).json({videos});
    } catch (error) {
        res.status(500).json({msg: 'Error fetching videos', error: error.message
        });
    }
});

// Like video
videoRouter.post("/like", checkAuth, async (req, res) =>{
    try {
        const { videoId } = req.body;
        await Video.findByIdAndUpdate(videoId, {
            $addToSet: { likedBy: req.user._id },
            $pull : { dislikedBy: req.user._id },
        });
        res.status(200).json({msg: 'Video liked successfully'});
    } catch (error) {
        res.status(500).json({msg: 'Error liking video', error: error.message});
    }
});

// Dislike video
videoRouter.post("/dislike", checkAuth, async (req, res) =>{
    try {
        const { videoId } = req.body;
        await Video.findByIdAndUpdate(videoId, {
            $addToSet: { dislikedBy: req.user._id },
            $pull : { likedBy: req.user._id },
        });
        res.status(200).json({msg: 'Video disliked successfully'});
    } catch (error) {
        res.status(500).json({msg: 'Error disliking video', error: error.message});
    }
});

module.exports = videoRouter;