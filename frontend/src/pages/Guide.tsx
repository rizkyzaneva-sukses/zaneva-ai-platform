import React from 'react';

export default function Guide() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Buku Panduan Tim (User Guide)</h1>
        <p className="text-muted-foreground mt-2">Selamat datang di Zaneva AI Platform. Panduan ini akan membantu Anda dan tim memahami alur kerja dan cara memanfaatkan semua fitur dengan optimal.</p>
      </div>

      {/* Workflow Utama */}
      <section className="glass-card p-6 rounded-xl border border-border space-y-4">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Alur Kerja Utama (Core Workflow)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-card p-4 rounded-lg border border-white/5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center font-bold text-blue-400">1</div>
            <h3 className="font-semibold text-foreground mt-2">Upload Data</h3>
            <p className="text-sm text-muted-foreground mt-1">Export CSV dari IG/TikTok dan upload ke menu <b>Upload CSV</b>.</p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-white/5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center font-bold text-purple-400">2</div>
            <h3 className="font-semibold text-foreground mt-2">AI Extraction</h3>
            <p className="text-sm text-muted-foreground mt-1">Sistem otomatis membaca produk (Catalina, dll), kreator, dan tipe Hook.</p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-white/5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center font-bold text-pink-400">3</div>
            <h3 className="font-semibold text-foreground mt-2">Minta AI Analisis</h3>
            <p className="text-sm text-muted-foreground mt-1">Gunakan <b>AI Analysis</b> untuk prediksi viral atau bedah performa.</p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-white/5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center font-bold text-emerald-400">4</div>
            <h3 className="font-semibold text-foreground mt-2">Eksekusi Tasks</h3>
            <p className="text-sm text-muted-foreground mt-1">Jadikan saran AI sebagai Todo-list di menu <b>Tasks</b>.</p>
          </div>
        </div>
      </section>

      {/* Penjelasan Modul */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <section className="glass-card p-6 rounded-xl border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground">📁 Upload & TikTok Mapper</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <b>Cara Pakai:</b> Buka menu Upload CSV. Pilih brand dan platform.<br/><br/>
            Khusus <b>TikTok</b>, karena formatnya sering berubah, sistem akan memunculkan fitur "Mapper". Anda tinggal mencocokkan mana kolom yang berarti <i>Views</i>, mana yang <i>Saves</i>, dsb. Pastikan tidak tertukar!<br/><br/>
            <i>Catatan:</i> Saat upload, nama produk yang disebut di caption (misal "Gamis Catalina") otomatis masuk ke sistem.
          </p>
        </section>

        <section className="glass-card p-6 rounded-xl border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground">🤖 AI Analysis</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Menu AI adalah "otak" dari Zaneva AI Platform. Ada 3 fungsi:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li><b>Prediksi Viral:</b> Masukkan draf caption sebelum diposting. AI akan kasih skor potensi viral dan saran perbaikan.</li>
            <li><b>Optimasi Caption:</b> AI akan merombak caption mentah menjadi lebih *engaging* dengan Hook yang kuat.</li>
            <li><b>AI Chat:</b> Tanya apapun ("Kenapa konten minggu ini turun?", "Gamis apa yang lagi viral?"). AI akan menjawab berdasarkan data asli kita.</li>
          </ul>
        </section>

        <section className="glass-card p-6 rounded-xl border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground">📊 Products & Creators</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Digunakan untuk pantauan intelijen harian:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li><b>Products:</b> Ketahuan langsung misal "Davira" tinggi views-nya, tapi "Sandrine" <i>Underperforming</i>. Segera instruksikan tim kreatif bikin konten Sandrine!</li>
            <li><b>Creators:</b> Papan peringkat afiliator / UGC. Ketahuan siapa influencer yang bawa <i>reach</i> paling tinggi.</li>
          </ul>
        </section>

        <section className="glass-card p-6 rounded-xl border border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground">📈 Reports (Ranking & Ekspor PDF)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Menu untuk <b>evaluasi bulanan/mingguan</b>.<br/>
            Pilih "UGC" jika ingin lihat ranking khusus video kreator luar, atau "Brand Organic" untuk video tim internal.<br/>
            Klik tombol <b>"Export to PDF"</b> untuk mem-print laporan rapi yang siap dibawa saat meeting divisi.
          </p>
        </section>

      </div>

      {/* Akses & Keamanan */}
      <section className="bg-card p-6 rounded-xl border border-yellow-500/20 space-y-3">
        <h2 className="text-lg font-bold text-yellow-500">🔒 Aturan Hak Akses (RBAC)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
          <div>
            <h3 className="font-bold text-foreground mb-1">Akses OWNER (Admin)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bisa melihat semua brand.</li>
              <li>Bisa membuat Brand baru.</li>
              <li>Bisa membuat akun PIC dan menugaskannya ke Brand.</li>
              <li>Bisa mengatur setting API Key AI (Gemini/OpenAI).</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-1">Akses PIC BRAND</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hanya bisa melihat dashboard brand yang di-*assign* kepadanya.</li>
              <li>Data brand lain terisolasi rapat (tidak akan bocor).</li>
              <li>Fokus pada upload data, AI analysis, dan task management.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
