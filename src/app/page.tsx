import Link from "next/link"
import { ClockIcon, MapPinIcon, PhoneIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/react/20/solid"
import MenuSection from "@/components/landing/MenuSection"

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
            <Link
              href="/order"
              className="px-5 py-2 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta-light transition-colors shadow-sm"
            >
              Pesan
            </Link>
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
                  <Link href="/order" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta text-white font-semibold hover:bg-terracotta-light transition-colors shadow-lg shadow-terracotta/20">
                    Pesan Sekarang
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <a href="#menu" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cream-dark text-brown font-semibold hover:bg-cream transition-colors">
                    Lihat Menu
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

        <MenuSection products={featured} categories={categories} />

        <section id="info" className="py-20 px-6 scroll-mt-16">
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

        <section className="py-20 px-6 bg-cream/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-brown text-center mb-12">Kata Mereka</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Aulia Rahma", role: "Mahasiswa", text: "Tempat favorit buat ngerjain tugas! Kopinya enak, suasananya cozy. Wi-Fi-nya juga kenceng.", rating: 5 },
                { name: "Dimas Pratama", role: "Mahasiswa", text: "Espresso-nya mantap, harganya ramah di kantong. Jadi langganan tiap minggu.", rating: 5 },
                { name: "Sari Indah", role: "Dosen", text: "Suasananya tenang, cocok buat baca atau ngoreksi tugas. Pelayanan ramah banget.", rating: 4 },
              ].map((testimonial, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-cream-dark hover:shadow-md transition-shadow">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <StarIconSolid key={j} className={`w-4 h-4 ${j < testimonial.rating ? "text-gold" : "text-cream-dark"}`} />
                    ))}
                  </div>
                  <p className="text-brown text-sm leading-relaxed italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-cream-dark/50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta/30 to-gold/30 flex items-center justify-center text-brown font-semibold text-sm shrink-0">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brown">{testimonial.name}</p>
                      <p className="text-xs text-brown-light">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-br from-terracotta to-terracotta-light relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 text-8xl">☕</div>
            <div className="absolute bottom-10 right-10 text-8xl">🥐</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl">🍵</div>
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Siap Ngopi?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
              Pesan sekarang langsung dari kampus. Takeaway atau dine-in, terserah kamu!
            </p>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-terracotta font-semibold hover:bg-cream transition-colors shadow-lg shadow-black/10"
            >
              Pesan Sekarang
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
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
              <Link href="/order" className="hover:text-cream transition-colors">Pesan</Link>
              <Link href="/login" className="hover:text-cream transition-colors">Login</Link>
            </div>
            <p className="text-cream-dark text-sm">&copy; 2026 Forever Caffe</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
