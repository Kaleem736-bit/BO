const express = require('express')
const router = express.Router()
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '')
router.post('/create-checkout-session', async (req,res)=>{
  try{
    const { amount = 10, currency = 'usd', userEmail } = req.body
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency, product_data: { name: 'Top up' }, unit_amount: Number(amount)*100 }, quantity: 1 }],
      mode: 'payment',
      customer_email: userEmail,
      success_url: 'http://localhost:3000/lobby?payment=success',
      cancel_url: 'http://localhost:3000/lobby?payment=cancel'
    })
    res.json({ id: session.id, url: session.url })
  }catch(e){ console.error(e); res.status(500).json({ error: e.message }) }
})
router.post('/webhook', express.raw({ type: 'application/json' }), (req,res)=>{
  const sig = req.headers['stripe-signature']
  let event
  try{
    if(process.env.STRIPE_WEBHOOK_SECRET){
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } else { event = JSON.parse(req.body.toString()) }
  }catch(err){ console.error('Webhook signature failed', err.message); return res.status(400).send(Webhook Error: ) }
  if(event.type === 'checkout.session.completed'){
    const session = event.data.object
    const email = session.customer_email
    const amount = (session.amount_total || 0)/100
    global._userBalances = global._userBalances || {}
    global._userBalances[email] = (global._userBalances[email] || 0) + amount
    console.log('Top-up completed:', email, amount)
  }
  res.json({received:true})
})
module.exports = router
