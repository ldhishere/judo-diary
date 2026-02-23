
import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, parseISO 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trophy, Plus, BarChart2 } from 'lucide-react';

import { TrainingLog } from './types';
import { getLogs, saveLog, deleteLog, getFavorites, saveFavorites } from './services/storage';
import TechniqueSearch from './components/TechniqueSearch';
import LogDetail from './components/LogDetail';
import StatisticsView from './components/StatisticsView';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchingTechniques, setIsSearchingTechniques] = useState(false);
  const [isViewingStats, setIsViewingStats] = useState(false);
  
  const [formData, setFormData] = useState({ 
    techniques: '', notes: '', 
    intensity: 'medium' as 'low' | 'medium' | 'high',
    condition: 'normal' as 'bad' | 'normal' | 'good' | 'great'
  });

  useEffect(() => {
    setLogs(getLogs());
    setFavorites(getFavorites());
  }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const selectedLog = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return logs.find(log => log.date === dateStr);
  }, [selectedDate, logs]);

  const monthlyLogCount = useMemo(() => {
    return logs.filter(l => isSameMonth(parseISO(l.date), currentDate)).length;
  }, [logs, currentDate]);

  useEffect(() => {
    if (selectedLog) {
      setFormData({
        techniques: selectedLog.techniques,
        notes: selectedLog.notes,
        intensity: selectedLog.intensity,
        condition: selectedLog.condition || 'normal'
      });
    } else {
      setFormData({ techniques: '', notes: '', intensity: 'medium', condition: 'normal' });
    }
    setIsEditing(false);
    setIsSearchingTechniques(false);
    setIsViewingStats(false);
  }, [selectedLog, selectedDate]);

  const handleSave = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newLog: TrainingLog = {
      id: selectedLog?.id || crypto.randomUUID(),
      date: dateStr,
      ...formData
    };
    saveLog(newLog);
    setLogs(getLogs());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!selectedDate) return;
    deleteLog(format(selectedDate, 'yyyy-MM-dd'));
    setLogs(getLogs());
    setIsEditing(false);
  };

  const toggleTechnique = (tech: string) => {
    const currentTechs = formData.techniques ? formData.techniques.split(', ').filter(t => t.length > 0) : [];
    if (currentTechs.includes(tech)) {
      setFormData({ ...formData, techniques: currentTechs.filter(t => t !== tech).join(', ') });
    } else {
      setFormData({ ...formData, techniques: [...currentTechs, tech].join(', ') });
    }
  };

  const toggleFavorite = (e: React.MouseEvent, tech: string) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(tech) ? favorites.filter(f => f !== tech) : [...favorites, tech];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 shadow-xl pb-24 sm:pb-0 relative overflow-x-hidden">
      {/* Overlay Screens */}
      {isSearchingTechniques && (
        <TechniqueSearch 
          onClose={() => setIsSearchingTechniques(false)}
          selectedTechniques={formData.techniques}
          onToggleTechnique={toggleTechnique}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {isViewingStats && (
        <StatisticsView 
          currentDate={currentDate}
          logs={logs}
          onClose={() => setIsViewingStats(false)}
        />
      )}

      {/* Main UI */}
      <header className="bg-blue-700 text-white p-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            유도 일지
          </h1>
          <button 
            onClick={() => setIsViewingStats(true)}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <BarChart2 className="w-4 h-4" /> 통계
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-blue-600 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-xl font-semibold">{format(currentDate, 'yyyy년 M월', { locale: ko })}</h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-blue-600 rounded-full transition-colors"><ChevronRight className="w-6 h-6" /></button>
        </div>
      </header>

      <main className="flex-1 p-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 mb-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={idx} className={`text-center text-xs font-bold py-2 ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              // 해당하는 달이 아니면 빈 공간으로 표시
              if (!isCurrentMonth) {
                return <div key={idx} className="aspect-square" />;
              }

              const dayLog = logs.find(log => isSameDay(parseISO(log.date), day));
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button key={idx} onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                    ${dayLog ? 'text-white bg-blue-600' : 'text-slate-700 bg-transparent'}
                    ${isSelected 
                      ? 'ring-2 ring-blue-500 font-bold z-10 shadow-sm bg-blue-100' 
                      : (dayLog ? 'hover:bg-blue-700' : 'hover:bg-slate-100')}
                    ${isToday && !isSelected && !dayLog ? 'border border-blue-200 bg-blue-50/30' : ''}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Summary Bar */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">이번 달 수련 현황</span>
          <span className="text-sm font-black text-blue-700">{monthlyLogCount}일 수련</span>
        </div>

        <section className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-800">{selectedDate ? format(selectedDate, 'M월 d일 (E)', { locale: ko }) : '날짜를 선택하세요'}</h3>
            {selectedLog && !isEditing && <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-blue-600">수정하기</button>}
          </div>

          {selectedDate && (
            <LogDetail 
              selectedDate={selectedDate}
              selectedLog={selectedLog || null}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onDelete={handleDelete}
              onOpenSearch={() => setIsSearchingTechniques(true)}
            />
          )}
        </section>
      </main>

      <div className="fixed bottom-6 right-6 sm:hidden">
        {!isEditing && !isSearchingTechniques && !isViewingStats && selectedDate && !selectedLog && (
           <button onClick={() => setIsEditing(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    </div>
  );
};

export default App;
