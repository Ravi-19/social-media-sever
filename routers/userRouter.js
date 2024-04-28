const router = require('express').Router() ; 
const RequireUser  = require('../middlewares/requireUser') ; 

const userControllers = require ('../controllers/userControllers') ; 
//const requireUser = require('../middlewares/requireUser');



router.post('/follow' , RequireUser ,userControllers.followUserController ) ;
router.post('/getUserProfile' , RequireUser ,userControllers.getUserDataController ) ;
router.get('/getMyInfo' , RequireUser ,userControllers.getMyInfoController ) ;
router.get('/getFeedData', RequireUser ,userControllers.getPostOfFollowingController) ;
router.delete('/' , RequireUser , userControllers.deleteuserController ) ; 
router.put('/' , RequireUser , userControllers.updateUserController) ; 

module.exports = router ; 
