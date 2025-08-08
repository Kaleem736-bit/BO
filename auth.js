const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
})
router.post('/send-code', async (req,res)=>{
  const { email } = req.body
  if(!email) return res.status(400).json({error:'email required'})
  const code = String(Math.floor(100000 + Math.random()*900000))
  global._email_codes = global._email_codes || {}
  global._email_codes[email] = code
  try{ await transporter.sendMail({ from: '"Poker" <no-reply@example.com>', to: email, subject:'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚', text:'ط±ظ…ط²ظƒ: '+code }) }catch(e){ console.warn('mail error',e) }
  res.json({status:'ok'})
})
router.post('/verify-email', (req,res)=>{
  const { email, code } = req.body
  global._email_codes = global._email_codes || {}
  if(global._email_codes[email] && global._email_codes[email] === code){ delete global._email_codes[email]; return res.json({status:'ok'}) }
  return res.status(400).json({status:'error', message:'invalid code'})
})
module.exports = router
