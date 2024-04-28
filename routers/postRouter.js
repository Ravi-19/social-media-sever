const router  = require('express').Router(); 
const  postControllers = require('../controllers/postControllers') ; 
const requireUser = require('../middlewares/requireUser') ; 


router.get('/all' ,requireUser , postControllers.getMyPostController ) ;  
router.post('/' , requireUser , postControllers.createPostController) ; 
router.post('/like' , requireUser , postControllers.likeAndUnlikePostController); 
router.put('/' , requireUser  , postControllers.updatePostController) ; 
router.delete('/' , requireUser  , postControllers.deletePostController) ; 
router.get('/user' , requireUser  , postControllers.getUserPost) ; 

module.exports = router ; 