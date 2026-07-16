import Link from "next/link"
import { ClockIcon, MapPinIcon, PhoneIcon, ArrowRightIcon } from "@heroicons/react/24/outline"

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/products`, { cache: "no-store" })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/categories`, { cache: "no-store" })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
}

export default async function LandingPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()])

  const featured = products.filter((p: any) => p.isActive).slice(0, 8)

  return (
    <div className="min-h-screen bg-off-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-off-white/95 backdrop-blur-md border-b border-cream-dark">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center">
              <span className="text-white font-serif font-bold text-sm">FC</span>
            </div>
            <span className="font-serif font-semibold text-brown text-lg">Forever Caffe</span>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#menu" className="text-sm text-brown-light hover:text-brown transition-colors hidden sm:block">Menu</a>
            <a href="#info" className="text-sm text-brown-light hover:text-brown transition-colors hidden sm:block">Informasi</a>
            <Link href="/login" className="px-4 py-2 rounded-xl border border-cream-dark text-brown text-sm font-medium hover:bg-cream transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative pt-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cream via-off-white to-cream-dark/30" />
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream border border-cream-dark text-brown text-sm mb-6">
                  <span className="w-2 h-2 rounded-full bg-terracotta" />
                  Kafe Kampus
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brown leading-tight">
                  Tempat Nongkrong<br />
                  <span className="text-terracotta">Favorit</span> Mahasiswa
                </h1>
                <p className="mt-4 text-base md:text-lg text-brown-light leading-relaxed max-w-lg">
                  Kopi kekinian, snack enak, dan suasana hangat buat ngerjain tugas atau sekadar ngopi santai.
                </p>
                <div className="flex items-center gap-4 mt-8">
                  <a href="#menu" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta text-white font-semibold hover:bg-terracotta-light transition-colors shadow-lg shadow-terracotta/20">
                    Lihat Menu
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-terracotta/20 via-gold/10 to-cream-dark overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-8xl mb-4">☕</div>
                        <p className="text-brown font-serif text-xl">Forever Caffe</p>
                        <p className="text-brown-light text-sm">Since 2026</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center -z-10" />
                  <div className="absolute -top-4 -left-4 w-24 h-24 rounded-2xl bg-terracotta/10 border border-terracotta/20 -z-10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="menu" className="py-20 px-6 bg-cream">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-brown">Menu Kami</h2>
              <p className="text-brown-light mt-2">Nikmati pilihan makanan & minuman favoritmu</p>
            </div>

            {featured.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featured.map((product: any) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl overflow-hidden border border-cream-dark hover:shadow-lg hover:shadow-brown/5 transition-all hover:-translate-y-1"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">☕</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif font-semibold text-brown">{product.name}</h3>
                      {product.description && (
                        <p className="text-brown-light text-xs mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-terracotta">{formatPrice(product.price)}</span>
                        {product.stockQty <= 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Habis</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "Kopi Susu", price: 18000, emoji: "☕" },
                  { name: "Americano", price: 15000, emoji: "☕" },
                  { name: "Matcha Latte", price: 22000, emoji: "🍵" },
                  { name: "Croissant", price: 12000, emoji: "🥐" },
                  { name: "Nasi Goreng", price: 25000, emoji: "🍚" },
                  { name: "French Fries", price: 15000, emoji: "🍟" },
                  { name: "Milk Shake", price: 20000, emoji: "🥤" },
                  { name: "Espresso", price: 12000, emoji: "☕" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-cream-dark hover:shadow-lg hover:shadow-brown/5 transition-all hover:-translate-y-1">
                    <div className="aspect-[4/3] bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center text-5xl">
                      {item.emoji}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif font-semibold text-brown">{item.name}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-terracotta">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="info" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-brown text-center mb-12">Informasi Kafe</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-cream-dark text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-serif font-semibold text-brown text-lg mb-2">Jam Buka</h3>
                <div className="text-brown-light space-y-1 text-sm">
                  <p>Senin - Jumat: 08.00 - 21.00</p>
                  <p>Sabtu: 09.00 - 22.00</p>
                  <p>Minggu: 10.00 - 18.00</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-cream-dark text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
                  <MapPinIcon className="w-7 h-7 text-terracotta" />
                </div>
                <h3 className="font-serif font-semibold text-brown text-lg mb-2">Lokasi</h3>
                <p className="text-brown-light text-sm leading-relaxed">
                  Area Kampus Universitas <br />
                  (Jl. Kampus No. 1)
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-cream-dark text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-brown/10 flex items-center justify-center mx-auto mb-4">
                  <PhoneIcon className="w-7 h-7 text-brown" />
                </div>
                <h3 className="font-serif font-semibold text-brown text-lg mb-2">Kontak</h3>
                <p className="text-brown-light text-sm">
                  WhatsApp: 0812-xxxx-xxxx
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-brown py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                <span className="text-brown font-serif font-bold text-xs">FC</span>
              </div>
              <span className="font-serif font-semibold text-cream">Forever Caffe</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-cream-dark">
              <a href="#menu" className="hover:text-cream transition-colors">Menu</a>
              <a href="#info" className="hover:text-cream transition-colors">Informasi</a>
              <Link href="/login" className="hover:text-cream transition-colors">Login</Link>
            </div>
            <p className="text-cream-dark text-sm">&copy; 2026 Forever Caffe</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
