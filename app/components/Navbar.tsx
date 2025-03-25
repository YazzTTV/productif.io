import Link from 'next/link'

const Navbar = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <div className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center space-x-4">
            <Link
              href="/dashboard/analytics"
              className={`${
                pathname === '/dashboard/analytics'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } rounded-md px-3 py-2 text-sm font-medium`}
            >
              Statistiques
            </Link>
            <Link
              href="/dashboard/habits"
              className={`${
                pathname === '/dashboard/habits'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } rounded-md px-3 py-2 text-sm font-medium`}
            >
              Habitudes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar 