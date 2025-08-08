import Sidebar from '../components/Sidebar'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home(){
  return (
    <div className='min-h-screen flex'>
      <Sidebar />
      <main className='flex-1 p-6'>
        <div className='relative h-64 rounded-lg overflow-hidden shadow-lg'>
          <Image src='/assets/home.jpg' alt='home' fill style={{objectFit:'cover'}} />
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.8}} className='absolute inset-0 flex items-center justify-center'>
            <div className='bg-black/40 p-6 rounded text-center'>
              <h1 className='text-3xl font-bold'>ظ…ط±ط­ط¨ط§ ط¨ظƒ ظپظٹ ظ„ط¹ط¨ط© ط¨ظˆظƒط± â€” طھطµظ…ظٹظ… ط¬ط¹ظپط± ط§ظ„ط³ظٹط¯</h1>
              <p className='mt-2'>ظˆط§ط¬ظ‡ط© ط§ط­طھط±ط§ظپظٹط© ظ…طھط­ط±ظƒط© ظˆطھط¹ظ…ظ„ ط¹ظ„ظ‰ ط§ظ„ط¬ظˆط§ظ„ ظˆط§ظ„ظˆظٹط¨</p>
              <div className='mt-4 flex gap-2 justify-center'>
                <Link href='/lobby'><a className='px-4 py-2 bg-emerald-500 rounded'>ط§ظ„ط¯ط®ظˆظ„ ط¥ظ„ظ‰ ط§ظ„ظ„ظˆط¨ظٹ</a></Link>
                <Link href='/auth/register'><a className='px-4 py-2 bg-ruby-600 rounded'>ط§ظ„طھط³ط¬ظٹظ„</a></Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
