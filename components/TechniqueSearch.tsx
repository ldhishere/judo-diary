
import React, { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, Star, Plus } from 'lucide-react';
import { JUDO_TECHNIQUES } from '../data/techniques';

interface Props {
  onClose: () => void;
  selectedTechniques: string;
  onToggleTechnique: (tech: string) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, tech: string) => void;
}

interface TechniqueItemProps {
  tech: string;
  isSelected: boolean;
  isFav: boolean;
  onToggleTechnique: (tech: string) => void;
  onToggleFavorite: (e: React.MouseEvent, tech: string) => void;
}

const TechniqueItem: React.FC<TechniqueItemProps> = ({ 
  tech, 
  isSelected, 
  isFav, 
  onToggleTechnique, 
  onToggleFavorite 
}) => (
  <button 
    onClick={() => onToggleTechnique(tech)}
    className={`w-full text-left px-4 py-4 flex justify-between items-center transition-colors border-b border-slate-100 last:border-none ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-100/30'}`}
  >
    <div className="flex items-center gap-3">
      <button 
        onClick={(e) => onToggleFavorite(e, tech)}
        className="p-1 hover:bg-slate-200 rounded-full transition-colors"
      >
        <Star className={`w-5 h-5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      </button>
      <span className={`text-sm ${isSelected ? 'font-bold text-blue-700' : 'text-slate-700'}`}>{tech}</span>
    </div>
    {isSelected ? <X className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-slate-400" />}
  </button>
);

const TechniqueSearch: React.FC<Props> = ({ 
  onClose, 
  selectedTechniques, 
  onToggleTechnique, 
  favorites, 
  onToggleFavorite 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedList = selectedTechniques.split(', ').filter(t => t.length > 0);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filterFn = (t: string) => t.toLowerCase().includes(query);
    return {
      nage: JUDO_TECHNIQUES.nage.filter(filterFn),
      katame: JUDO_TECHNIQUES.katame.filter(filterFn),
      favorites: favorites.filter(filterFn)
    };
  }, [searchQuery, favorites]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col animate-in slide-in-from-right duration-300 z-50 fixed inset-0">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">기술 검색</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            autoFocus
            type="text"
            placeholder="기술 이름을 검색하세요..."
            className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full">
              <X className="w-3 h-3 text-slate-600" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        {filtered.favorites.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-3 px-2 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 즐겨찾기
            </h3>
            <div className="bg-amber-50/30 rounded-2xl overflow-hidden border border-amber-100">
              {filtered.favorites.map((tech, idx) => (
                <TechniqueItem 
                  key={`fav-${idx}`} 
                  tech={tech} 
                  isSelected={selectedList.includes(tech)} 
                  isFav={true} 
                  onToggleTechnique={onToggleTechnique}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3 px-2">메치기 (Nage-waza)</h3>
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            {filtered.nage.length > 0 ? filtered.nage.map((tech, idx) => (
              <TechniqueItem 
                key={`nage-${idx}`} 
                tech={tech} 
                isSelected={selectedList.includes(tech)} 
                isFav={favorites.includes(tech)} 
                onToggleTechnique={onToggleTechnique}
                onToggleFavorite={onToggleFavorite}
              />
            )) : <p className="p-4 text-sm text-slate-400 text-center">검색 결과가 없습니다.</p>}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3 px-2">굳히기 (Katame-waza)</h3>
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            {filtered.katame.length > 0 ? filtered.katame.map((tech, idx) => (
              <TechniqueItem 
                key={`katame-${idx}`} 
                tech={tech} 
                isSelected={selectedList.includes(tech)} 
                isFav={favorites.includes(tech)} 
                onToggleTechnique={onToggleTechnique}
                onToggleFavorite={onToggleFavorite}
              />
            )) : <p className="p-4 text-sm text-slate-400 text-center">검색 결과가 없습니다.</p>}
          </div>
        </section>
      </main>

      <footer className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
        <button onClick={onClose} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-[0.98] transition-all">
          선택 완료
        </button>
      </footer>
    </div>
  );
};

export default TechniqueSearch;
