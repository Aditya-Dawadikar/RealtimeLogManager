const express = require('express')
const LogController = require('../controllers/LogController')


const router = express.Router()

router.get("/logs",(req,res,next)=>{LogController.LogQueryController(req,res)})
router.get("/logs/aggregate/top-videos",(req,res,next)=>{LogController.LogTopVideosController(req,res)})
router.get("/logs/aggregate/top-users",(req,res,next)=>{LogController.LogTopUsersController(req,res)})
router.get("/logs/aggregate/event-distribution",(req,res,next)=>{LogController.LogEventDistributionController(req,res)})
router.get("/logs/aggregate/time-interval",(req,res,next)=>{LogController.LogTimeIntrevalController(req,res)})

module.exports = {router}
