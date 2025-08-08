import Link from 'next/link'
export default function Sidebar(){
  return (
    <aside className='w-64 bg-sidebar p-4 min-h-screen hidden md:block'>
      <div className='mb-6 text-center'><img src='/assets/logo.png' alt='logo' className='w-40 mx-auto'/></div>
      <nav className='space-y-2'>
        <Link href='/'><a className='block p-3 rounded hover:bg-white/5'>ط§ظ„طµظپط­ط© ط§ظ„ط±ط¦ظٹط³ط©</a></Link>
        <Link href='/lobby'><a className='block p-3 rounded hover:bg-white/5'>ظ„ظˆط¨ظٹ ط§ظ„ط؛ط±ظپ</a></Link>
        <Link href='/auth/register'><a className='block p-3 rounded hover:bg-white/5'>ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨</a></Link>
        <Link href='/auth/login'><a className='block p-3 rounded hover:bg-white/5'>ط¯ط®ظˆظ„</a></Link>
        <Link href='/wallet/charge'><a className='block p-3 rounded hover:bg-white/5'>ط´ط­ظ† ط§ظ„ط±طµظٹط¯</a></Link>
      </nav>
    </aside>
  )
}
