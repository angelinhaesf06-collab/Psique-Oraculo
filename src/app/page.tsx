import { Metadata } from 'next';
import { Sparkles, History, LayoutDashboard, Settings, User } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Psiquê Oráculo | Painel Administrativo',
  description: 'Aconselhamento terapêutico e autoconhecimento de alta classe em pisiqueoraculo.com.br',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gold/10 p-8 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white shadow-lg shadow-gold/20">
            <Sparkles size={20} />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Psiquê Oráculo</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/admin" className="flex items-center gap-4 px-4 py-3 bg-gold/5 text-gold rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gold/10 transition-all">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link href="/admin/leituras" className="flex items-center gap-4 px-4 py-3 text-foreground/60 hover:bg-gold/5 hover:text-gold rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <History size={16} /> Histórico
          </Link>
          <Link href="/admin/usuarios" className="flex items-center gap-4 px-4 py-3 text-foreground/60 hover:bg-gold/5 hover:text-gold rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <User size={16} /> Usuários
          </Link>
        </nav>

        <div className="pt-8 border-t border-gold/10">
          <Link href="/admin/config" className="flex items-center gap-4 px-4 py-3 text-foreground/40 hover:text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <Settings size={16} /> Configurações
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12">
          <h2 className="text-3xl font-light text-foreground mb-2">Bem-vinda ao seu <span className="font-bold text-gold">Oráculo</span></h2>
          <p className="text-foreground/40 text-sm tracking-wide italic">"Conhece-te a ti mesmo e conhecerás o universo e os deuses."</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-[32px] border border-gold/10 shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-gold/10 text-gold rounded-2xl">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full uppercase tracking-tighter">Ativo</span>
            </div>
            <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">Total de Leituras</h3>
            <p className="text-3xl font-bold text-foreground">1,284</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-[32px] border border-gold/10 shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-ruby/10 text-ruby rounded-2xl">
                <History size={20} />
              </div>
              <span className="text-[10px] font-black text-gold bg-gold/5 px-3 py-1 rounded-full uppercase tracking-tighter">+12% hoje</span>
            </div>
            <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">Consultas IA</h3>
            <p className="text-3xl font-bold text-foreground">856</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-[32px] border border-gold/10 shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-foreground/5 text-foreground/60 rounded-2xl">
                <User size={20} />
              </div>
            </div>
            <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">Novas Almas</h3>
            <p className="text-3xl font-bold text-foreground">42</p>
          </div>
        </div>

        {/* Recent Activity */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Leituras Recentes</h3>
            <button className="text-[10px] font-black text-gold uppercase tracking-widest hover:underline">Ver todas</button>
          </div>

          <div className="bg-white rounded-[40px] border border-gold/10 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gold/5 border-b border-gold/10">
                  <th className="px-8 py-6 text-[10px] font-black text-gold uppercase tracking-widest">Usuário</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold uppercase tracking-widest">Oráculo</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold uppercase tracking-widest text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-gold/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center text-[10px] font-black text-gold uppercase">
                          U{i}
                        </div>
                        <span className="text-sm font-semibold text-foreground">Alma #{i * 123}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-foreground/60 uppercase tracking-tighter bg-foreground/5 px-2 py-1 rounded-md">Baralho Cigano</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-foreground/40 italic">Sim ou Não</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Concluída</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[10px] font-bold text-foreground/30 tabular-nums">20 MAI 2026</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
