import Sidebar from '../components/Sidebar'
import Link from 'next/link'
export default function Lobby(){
  const rooms = [
    {id:'ruby', name:'ط؛ط±ظپط© ط§ظ„ظٹط§ظ‚ظˆطھ', table:'/assets/table_ruby.png'},
    {id:'emerald', name:'ط؛ط±ظپط© ط§ظ„ط²ظ…ط±ط¯', table:'/assets/table_emerald.png'},
    {id:'gold', name:'ط§ظ„ط؛ط±ظپط© ط§ظ„ط°ظ‡ط¨ظٹط©', table:'/assets/table_gold.png'}
  ]
  return (
    <div className='min-h-screen flex'>
      <Sidebar />
      <main className='flex-1 p-6'>
        <h2 className='text-3xl mb-4'>ط§ظ„ط؛ط±ظپ ط§ظ„ظ…طھط§ط­ط©</h2>
        <div className='grid md:grid-cols-3 gap-6'>
          {rooms.map(r=>(
            <div key={r.id} className='rounded-lg overflow-hidden shadow bg-white/5'>
              <img src={r.table} alt={r.name} className='w-full h-48 object-cover'/>
              <div className='p-4'>
                <h3 className='text-xl mb-2'>{r.name}</h3>
                <p className='text-sm mb-3'>ظ…ظ…ظٹط²ط§طھ ط®ط§طµط©طŒ ط±ظ‡ط§ظ†ط§طھ ظˆظ…ط¸ظ‡ط± ظ…ط®طھظ„ظپ ظ„ظƒظ„ ط؛ط±ظپط©.</p>
                <Link href={/room/}><a className='inline-block px-4 py-2 bg-emerald-500 rounded'>ط¯ط®ظˆظ„ ط§ظ„ط؛ط±ظپط©</a></Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
