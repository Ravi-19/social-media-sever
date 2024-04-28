const Post = require("../models/Post");
const User = require("../models/User") ; 
const {success  , error} = require("../utils/responseWrapper") ; 
const mapPostOutput = require("../utils/utils");
const cloudinary = require('cloudinary').v2 ;  

const getMyPostController = async(req , res) =>{
   // res.send("here is your all post ") ; 
   try {
    const owner = req._id ; 
    const user =await User.findById(owner) ; 
    
    // let postIdArr = user.posts ;
    // if(postIdArr.length <=0) {
    //     return res.send(error(404 , "this user have not any post")) ; 
    // }
   // console.log("befone map " ,  allPosts) ; 
    // allPosts.map(async(item) => {
    //     console.log("item " , item) ; 
    //      let currPost  = await Post.findById(item) ;
    //     console.log("currPost " , currPost ) ;  
    //      return currPost ; 
    // })

   // const allPosts  = await fetchPost(postIdArr) ; 
  //  console.log("after map " , allPosts) ; 
    const allPosts = await Post.find({
        owner:owner
    }).populate('likes') ; 
    res.send(success(200 , {allPosts}))  ; 
   } catch (e) {
        res.send(error(500 , e.message)) ; 
   }
}

const getUserPost = async (req , res) => {
    try {
        const {userId} = req.body; 
       // const user =await User.findById(owner) ; 
       if(!userId) {
        return res.send(error(404, "userId is required to fetch post")) ; 
       }
        const allPosts = await Post.find({
            owner:userId
        }).populate('likes') ; 
        res.send(success(200 , {allPosts}))  ; 
       } catch (e) {
        console.log("error is " , e ) ; 
            res.send(error(500 , e.message)) ; 
       }
}

const createPostController = async (req , res) => {
  
    try {
        const {caption , postImg} = req.body ; 
        const owner= req._id ;
        const  user =await User.findById(owner) ;
        //caption must be send by user
        if(!caption || !postImg) {
            return res.send(error(500 , "caption and image is required")) ; 
        }
        // create post in post collection 
        const cloudImg = await cloudinary.uploader.upload(postImg , {
            folder:'socialMedia/postImage'
        }) ; 
        const post =await  Post.create({
            owner , 
            caption  , 
            image : {
                publicId : cloudImg.public_id , 
                url : cloudImg.url 
            } 
        }) ; 
       // save id of post int to  its owner's collection 
        user.posts.push(post._id) ; 
        await user.save() ; 
       // send post data to the frontend 
        return res.send(success(201 , {post})) ;  
    } catch (e) {
        // if error occur 
        return res.send(error(500 , e.message)) ; 
    }
}

const likeAndUnlikePostController = async (req , res) => {
    try {
        const {postId} = req.body ; 
        const currUser = req._id ; 
        const post = await Post.findById(postId).populate("owner") ; 
        // if post id is not present 
        if(!post) {
            return res.send(error(500 , "post not found")) ; 
        }

        // if user already liked post then do unlike 
        if(post.likes.includes(currUser)) {
            // remove it from like arr 
            const index = post.likes.indexOf(currUser) ; 
            post.likes.splice(index , 1 ) ; 
            await post.save() ;    
        }
        else {
            /// curr user has not liked the post so like it 
            console.log("curr user " , currUser) ; 
            post.likes.push(currUser) ; 
            await post.save() ; 
        }
        return res.send(success(200 , {post:mapPostOutput(post, currUser)})) ;

    } catch (e) {
        console.log("like and unlike error"  ,e ) ; 
        return res.send(error(500 , e.message)) ; 
    }
}

const updatePostController = async (req , res) => {
    try {
        const {postId , caption} = req.body ; 
        const ownerId = req._id ; 
        
        const post = await Post.findById(postId) ;
        if(!post) {
            return res.send(error(404 , "post is not found")) ; 
        } 
        // onnly owner can update post 
        if(post.owner.toString() !== ownerId) {
            return res.send(error(403 , "only owner can update post")) ;  
        }

        post.caption = caption ; 
        await post.save() ; 
        return res.send(success(200 , {post})) ; 

    } catch (e) {
        return res.send(error(500 , e.message)) ; 
    }
}

const deletePostController = async (req , res) => {
    try {
        const {postId} = req.body ;
        const ownerId = req._id ;  
        const post = await Post.findById(postId) ;
        if(!post) {
            return res.send(error(404 , "post is not found")) ; 
        } 
        // onnly owner can update post 
        if(post.owner.toString() !== ownerId) {
            return res.send(error(403 , "only owner can update post")) ;  
        }
        // delete post id from owner ;
        const user = await User.findById(ownerId) ; 
        const index = user.posts.indexOf(postId) ; 
        user.posts.splice(index , 1) ; 
        // not delete post
        await user.save() ; 
        await Post.deleteOne({_id:postId}) ; 
        return res.send(success(200 , "post deleted successfully")) ;
    } catch (e) {
        return res.send(error(500 , e.message));
    }
}
// internal function 
const fetchPost = async (postIdArr) => {
        let ans =[]; 
        for(let i = 0 ; i < postIdArr.length ; i++) {
            const post = await Post.findById(postIdArr[i]) ; 
            ans.push(post) ; 
        }
        return ans ; 
}

module.exports = {
    getMyPostController , 
    createPostController , 
    likeAndUnlikePostController , 
    updatePostController , 
    deletePostController ,
    getUserPost 
}