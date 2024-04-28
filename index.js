const express = require('express') ; 
const dotenv = require('dotenv') ; 
const dbConnect = require('./db/dbConncet'); 
const morgan = require('morgan') ; 
const mainRouter = require('./routers/index') ; 
const cookieParser = require('cookie-parser') ; 
const cors = require ('cors');
const cloudinaryConnect = require('./cloudinary/cloudinaryConnect') ; 

dotenv.config('./.env') ; 
const app = express() ; 

const origin = process.env.CORS_ORIGIN;

// middleware 
app.use(express.json({limit:'20mb'})) ; 
app.use(morgan())  ;
app.use(cookieParser()) ; 
app.use(cors({
    credentials:true , 
    origin
}) )  ; 

cloudinaryConnect() ; 

//this api testing purpose 
app.get('/' , (req , res) => {
    res.status(200).send("server is working well"); 
})

app.use('/api' , mainRouter)  ; 

const PORT  = process.env.PORT|| 4000 ; 

dbConnect() ; 
app.listen(PORT , () => {
    console.log(`server is listening on ${PORT}`) ; 

})

