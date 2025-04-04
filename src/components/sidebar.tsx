'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  AiOutlineHome,
  AiOutlineFileText,
  AiOutlineTeam,
  AiOutlineInbox,
  AiOutlineBarChart,
  AiOutlineSetting
} from 'react-icons/ai';

const menuItems = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: AiOutlineHome },
  { href: '/talepler', label: 'Talepler', icon: AiOutlineFileText },
  { href: '/departmanlar', label: 'Departmanlar', icon: AiOutlineTeam },
  { href: '/urunler', label: 'Ürünler', icon: AiOutlineInbox },
  { href: '/raporlar', label: 'Raporlar', icon: AiOutlineBarChart },
  { href: '/ayarlar', label: 'Ayarlar', icon: AiOutlineSetting },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="h-full flex flex-col">
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2.5 text-sm font-medium rounded-lg
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {session?.user && (
          <div className="p-4 border-t">
            <div className="text-sm text-gray-600">
              <div className="font-medium">{session.user.name}</div>
              <div className="text-xs">{session.user.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
} 