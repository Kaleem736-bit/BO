import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { useRouter } from 'next/router'
export default function Register(){
  const router = useRouter()
  const [email,setEmail]=useState(''); const [code,setCode]=useState(''); const [sent,setSent]=useState(false)
  async function send(){ await fetch('/api/auth/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}); setSent(true); alert('ط±ظ…ط² ط£ط±ط³ظ„ (ظ…ظˆط¯ظٹظ„)') }
  async function verify(){ const res=await fetch('/api/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code})}); if(res.ok) router.push('/lobby'); else alert('ظپط´ظ„') }
  return (<div className='min-h-screen flex'><Sidebar /><main className='flex-1 p-6'><div className='max-w-xl mx-auto bg-white/5 p-6 rounded'><h2 className='text-2xl mb-4'>ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨</h2><input value={email} onChange={e=>setEmail(e.target.value)} placeholder='ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ' className='w-full p-2 rounded bg-slate-800 mb-2'/> {!sent ? <button onClick={send} className='button-primary'>ط¥ط±ط³ط§ظ„ ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚</button> : <div className='mt-2 flex gap-2'><input value={code} onChange={e=>setCode(e.target.value)} placeholder='ط£ط¯ط®ظ„ ط±ظ…ط²' className='flex-1 p-2 rounded bg-slate-800'/> <button onClick={verify} className='button-primary'>طھط£ظƒظٹط¯</button></div>}</div></main></div>) }
