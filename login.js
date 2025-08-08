import Sidebar from '../../components/Sidebar'
import { useRouter } from 'next/router'
import { useState } from 'react'
export default function Login(){ const [email,setEmail]=useState(''); const router=useRouter(); function login(){ localStorage.setItem('user_email', email); router.push('/lobby') } return (<div className='min-h-screen flex'><Sidebar /><main className='flex-1 p-6'><div className='max-w-md mx-auto bg-white/5 p-6 rounded'><h2 className='text-2xl mb-4'>طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</h2><input value={email} onChange={e=>setEmail(e.target.value)} placeholder='ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ' className='w-full p-2 rounded bg-slate-800 mb-2'/> <button onClick={login} className='button-primary'>ط¯ط®ظˆظ„</button></div></main></div>) }
