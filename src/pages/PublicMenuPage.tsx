import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { MenuItem, Restaurant } from '@/types'

export function PublicMenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) return

    async function load() {
      // Load restaurant
      const { data: resto } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle()

      if (!resto) { setLoading(false); return }
      setRestaurant(resto)

      // Load menu + items
      const { data: menus } = await supabase
        .from('menus')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (menus && menus.length > 0) {
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('*')
          .eq('menu_id', menus[0].id)
          .order('position', { ascending: true })

        if (menuItems) setItems(menuItems)
      }

      setLoading(false)
    }

    load()
  }, [restaurantId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-gray-400">Menu introuvable</p>
      </div>
    )
  }

  const categories = [...new Set(items.map((i) => i.categorie).filter(Boolean))]

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2C2622] to-[#3D352F] text-white px-5 py-8 text-center">
        {restaurant.style_photo_url && (
          <img
            src={restaurant.style_photo_url}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
          />
        )}
        <h1 className="text-2xl font-bold font-serif">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="text-white/50 text-sm mt-2 max-w-md mx-auto">{restaurant.description}</p>
        )}
        {restaurant.address && (
          <p className="text-white/30 text-xs mt-2">{restaurant.address}</p>
        )}
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {categories.map((category) => {
          const catItems = items.filter((i) => i.categorie === category)
          return (
            <section key={category}>
              <h2 className="text-xs font-bold text-[#C9A961] uppercase tracking-wider mb-3">{category}</h2>
              <div className="space-y-3">
                {catItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.nom}
                        className="w-24 h-24 object-cover shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-[#2C2622] leading-tight">{item.nom}</p>
                        {item.prix && (
                          <span className="text-sm font-bold text-[#C9A961] shrink-0">{item.prix}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-[#2C2622]/40 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Footer */}
        <p className="text-center text-[10px] text-[#2C2622]/20 pt-4 pb-8">
          Menu par Auguste
        </p>
      </div>
    </div>
  )
}
