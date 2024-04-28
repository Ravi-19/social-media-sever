const Post = require('../models/Post');
const User = require('../models/User') ; 
const {error , success} = require ('../utils/responseWrapper') ; 
const mapPostOutput = require('../utils/utils');
const cloudinary = require('cloudinary').v2 ; 

const followUserController = async (req , res) => {
    try {
        const {userToFollowId} = req.body ; 
        const ownerId = req._id  ; 
        
        const currUser  = await User.findById(ownerId) ;
        const userToFollow = await User.findById(userToFollowId)  ; 
        if(!userToFollow) {
            return res.send(error(404 , "user is not found")) ; 
        }
        // if curr user and user to follow are same then we cant follow ourself
        if(userToFollowId===ownerId) {
           return  res.send(error(409 , "you can not follow yourself")) ; 
        }
        // check curr user already followed this guy , it yes then unfollow this 
        if(currUser.followings.includes(userToFollowId)) {
            // unfollow this user 
            const index = currUser.followings.indexOf(userToFollowId) ;
            currUser.followings.splice(index , 1) ; 
            await currUser.save() ;
            // also remove from followers of userTofollow 

            const i =  userToFollow.followers.indexOf(ownerId) ; 
            userToFollow.followers.splice(i , 1) ; 
            await userToFollow.save() ;     
        }
        else {
            // curr user still not followed this guy , so follow it 
            currUser.followings.push(userToFollowId) ; 
            await currUser.save() ; 
            // also add curr user to followers of user to folloe 
            userToFollow.followers.push(ownerId) ; 
            await userToFollow.save() ; 
        }
        return res.send(success(200 , {userToFollow})) ; 

    } catch (e) {
        return res.send(error(500 , e.message)) ; 
    }
}

const getPostOfFollowingController = async (req , res) => {
    try {
        const ownerId = req._id ; 
        const currUser = await User.findById(ownerId).populate('followings') ; 
        const followings = currUser.followings ; 
    
        const fullPosts = await Post.find({
            owner : {
                '$in' : followings 
            }
        }).populate('owner') ;
        
        const posts = fullPosts.map(item => mapPostOutput(item , req._iq)).reverse() ; 
        const followingsIds = currUser.followings.map(item=> item._id) ;
        // you can not be suggestion for you 
        followingsIds.push(req._id) ;  
        const suggestions = await User.find({
            _id:{
                $nin : followingsIds
            }
        }) ;
        return res.send(success(200 , {...currUser._doc ,suggestions , posts })) ;
        
    } catch (e) {
        res.send(error(500 ,e.message)) ; 
        
    } 
}

const getUserDataController = async (req,res) => {
    try {
        const {userId} = req.body ; 
        if(!userId) {
            return res.send(error(404 , "user id is required")) ; 
        }
        const user  = await User.findById(userId).populate({
            path:"posts",
            populate:{
                path:"owner" 
            }
        }) ; 
        if(!user) {
            return res.send(error(404 , "user not found")) ; 
        }

        const fullPosts = user.posts ; 

        const posts = fullPosts.map(item => mapPostOutput(item , req._id)).reverse() ;
        
        return res.send(success(200 , {...user._doc , posts})) ; 

        

    } catch (e) {
        console.log("server error under user get user data cotroller " , e) ; 
        return res.send(error(500 , e.message)) ; 
    }
}
const getMyInfoController = async (req , res) => {
    try {
        const user = await User.findById(req._id) ; 
        return res.send(success(200 , {user})) ; 
    } catch (e) {
        return res.send(error(500 , e.message)) ; 
    }
}
// delete user 

const deleteuserController = async (req , res) => {
    try {
        const userId  = req._id  ; 
        const user  = await User.findById(userId) ; 
        if(!user) {
            return res.send(error(404 , "user is not found")) ; 
        }
        // remove this user from its followers account 
        const followers = user.followers ; 
        for (let  i = 0 ; i < followers.length ; i++) {
            const currUser  = await User.findById(followers[i]) ; 
            // delete id of user from follwing of currUser 
            const index = currUser.followings.indexOf(userId) ; 
            currUser.followings.splice(index , 1) ; 
            await currUser.save() ; 
        }
        // remove this user from its followings 
        const followings = user.followings ; 
        for (let i = 0 ; i < followings.length ; i++) {
            // delete id of user from follwers of currUser 
            const currUser =  await User.findById(followings[i]) ; 
            const index = currUser.followers.indexOf(userId) ; 
            currUser.followers.splice(index , 1 ) ; 
            await currUser.save() ; 
        } 

        // delete post of this user 
        const posts = user.posts ; 
        for (let i = 0 ; i < posts.length ; i++) {
          //  const post = await Post.find({_id:posts[i]}) ; 
            await Post.deleteOne({_id:posts[i]}) ; 
        }
        // delete my self from likes of every post 
        ///post which are liked by me , removed my self from them 
        const allPost = await Post.find() ; 
        for (let i = 0 ; i < allPost.length ; i++) {
            const post = allPost[i] ; 
            if(post.likes.includes(userId)){
                const index = post.likes.indexOf(userId) ; 
                post.likes.splice(index , 1 ) ;
                await post.save() ;  
            }
        }
       // await allPost.save() ; 
        // delete cookie of this user also 
        res.clearCookie('jwt' , {
            httpOnly :true , 
            secure : true 
         }) ; 
         //finally delete this user 
        await User.deleteOne({_id:userId})
        return res.send(success(200 , "user has been deleted successfully")) ; 
        
    } catch (e) {
        return res.send(error(500 , e.message)) ; 
    }
}


const updateUserController = async (req , res) => {
    try {
    const userId = req._id ; 
    const user = await User.findById(userId) ; 
    const {name , bio , userImg} = req.body ; 
    //  console.log(user) ;
    if(name) {
        user.name = name ; 
    } 
    if(bio) {
        user.bio = bio ; 
    }
    if(userImg) {
        const cloudImg =await cloudinary.uploader.upload(userImg , {
                folder:'socialMedia/profileImage'
        })
        user.avatar = {
            publicId :cloudImg.public_id , 
            url : cloudImg.secure_url
        }
    }
    await user.save() ; 
    return res.send(success(200 , {user})) ; 

    } catch (e) {

        console.log("error : " , e) ; 
        return res.send(error(500 , e.message)); 

    }

}
// internal function 

module.exports  = {
    followUserController , 
    getUserDataController,
    getPostOfFollowingController , 
    deleteuserController , 
    getMyInfoController,
    updateUserController
}