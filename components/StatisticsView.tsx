
import React, { useMemo, useState, useRef } from 'react';
import { format, isSameMonth, parseISO, subMonths, startOfMonth, eachMonthOfInterval, isWithinInterval, endOfMonth, max, eachDayOfInterval, getDate, startOfYear, endOfYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, PieChart as PieChartIcon, AlertCircle, Calendar, TrendingUp, Frown, Smile, Zap, Meh, Download, Upload, Database } from 'lucide-react';
import { TrainingLog } from '../types';
import { exportAllData, importAllData } from '../services/storage';

interface Props {
  currentDate: Date;
  logs: TrainingLog[];
  onClose: () => void;
}

const CONDITION_MAP: Record<string, number> = {
  'bad': 1,
  'normal': 2,
  'good': 3,
  'great': 4
};

const INTENSITY_MAP: Record<string, number> = {
  'low': 1,
  'medium': 2.5,
  'high': 4
};

const StatisticsView: React.FC<Props> = ({ currentDate, logs, onClose }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'all'>('monthly');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLogs = useMemo(() => {
    if (activeTab === 'monthly') {
      return logs.filter(log => isSameMonth(parseISO(log.date), currentDate));
    }
    return logs;
  }, [logs, currentDate, activeTab]);

  const conditionSummary = useMemo(() => {
    const bad = filteredLogs.filter(log => log.condition === 'bad').length;
    const normal = filteredLogs.filter(log => log.condition === 'normal' || !log.condition).length;
    const good = filteredLogs.filter(log => log.condition === 'good').length;
    const great = filteredLogs.filter(log => log.condition === 'great').length;
    
    return { bad, normal, good, great };
  }, [filteredLogs]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      if (log.techniques) {
        const dayTechniques = new Set<string>(log.techniques.split(', ').filter(t => t.length > 0));
        for (const tech of dayTechniques) {
          counts[tech] = (counts[tech] || 0) + 1;
        }
      }
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    return Object.entries(counts)
      .map(([name, count]) => ({ 
        name, 
        count, 
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  const totalTechniqueInstances = useMemo(() => stats.reduce((acc, curr) => acc + curr.count, 0), [stats]);

  const monthlyActivity = useMemo(() => {
    const today = new Date();
    let baseDate = today;
    if (logs.length > 0) {
      const logDates = logs.map(l => parseISO(l.date));
      const latestLogDate = max(logDates);
      if (latestLogDate > today) baseDate = latestLogDate;
    }
    if (currentDate > baseDate) baseDate = currentDate;

    const last6Months = eachMonthOfInterval({
      start: subMonths(startOfMonth(baseDate), 5),
      end: startOfMonth(baseDate)
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(monthStart);
      const monthLogs = logs.filter(log => isWithinInterval(parseISO(log.date), { start: monthStart, end: monthEnd }));
      
      return {
        label: format(month, 'M월'),
        count: monthLogs.length,
      };
    });
  }, [logs, currentDate]);

  const yearlyTrendActivity = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(yearStart);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(monthStart);
      const monthLogs = logs.filter(log => isWithinInterval(parseISO(log.date), { start: monthStart, end: monthEnd }));
      
      return {
        label: format(month, 'M월'),
        hasData: monthLogs.length > 0,
        avgCondition: monthLogs.length > 0 ? monthLogs.reduce((acc, curr) => acc + (CONDITION_MAP[curr.condition || 'normal'] || 2), 0) / monthLogs.length : null,
        avgIntensity: monthLogs.length > 0 ? monthLogs.reduce((acc, curr) => acc + (INTENSITY_MAP[curr.intensity || 'medium'] || 2.5), 0) / monthLogs.length : null,
      };
    });
  }, [logs, currentDate]);

  const dailyStatsData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const log = logs.find(l => {
        const d1 = parseISO(l.date);
        return d1.getFullYear() === day.getFullYear() && d1.getMonth() === day.getMonth() && d1.getDate() === day.getDate();
      });
      return {
        day: getDate(day),
        condition: log ? (CONDITION_MAP[log.condition || 'normal'] || 2) : null,
        intensity: log ? (INTENSITY_MAP[log.intensity || 'medium'] || 2.5) : null
      };
    });
  }, [logs, currentDate]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (confirm('현재 기기의 수련 기록을 백업 파일 데이터로 교체하시겠습니까? (기존 데이터는 삭제됩니다)')) {
        const success = importAllData(content);
        if (success) {
          alert('데이터 복원이 완료되었습니다. 앱을 다시 시작합니다.');
          window.location.reload();
        } else {
          alert('유효하지 않은 백업 파일입니다.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset for next selection
  };

  const getTechColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ff8469', '#928fc4'];
    return colors[index % colors.length];
  };

  const renderPieChart = () => {
    if (stats.length === 0) return null;
    let cumulativePercent = 0;
    const slices = stats.slice(0, 5).map((item, index) => {
      const percent = item.count / totalTechniqueInstances;
      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += percent;
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);
      const largeArcFlag = percent > 0.5 ? 1 : 0;
      const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
      return <path key={item.name} d={pathData} fill={getTechColor(index)} stroke="white" strokeWidth="0.01" />;
    });
    
    if (stats.length > 5) {
      const remainingPercent = 1 - cumulativePercent;
      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      const endX = Math.cos(0);
      const endY = Math.sin(0);
      const largeArcFlag = remainingPercent > 0.5 ? 1 : 0;
      const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
      slices.push(<path key="others" d={pathData} fill="#e2e8f0" stroke="white" strokeWidth="0.01" />);
    }

    return (
      <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
        {slices}
        <circle cx="0" cy="0" r="0.65" fill="white" />
      </svg>
    );
  };

  const renderTrendChart = () => {
    const width = 300;
    const height = 140; 
    const paddingLeft = 35;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40; 
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const conditionData = activeTab === 'monthly' 
      ? dailyStatsData.map(d => ({ x: d.day, y: d.condition }))
      : yearlyTrendActivity.map((m, i) => ({ x: i, y: m.avgCondition }));

    const intensityData = activeTab === 'monthly'
      ? dailyStatsData.map(d => ({ x: d.day, y: d.intensity }))
      : yearlyTrendActivity.map((m, i) => ({ x: i, y: m.avgIntensity }));

    const hasAnyData = conditionData.some(d => d.y !== null);
    if (!hasAnyData) return <p className="text-center text-xs text-slate-400 py-8">추세를 표시하기 위한 데이터가 부족합니다.</p>;

    const minX = activeTab === 'monthly' ? 1 : 0;
    const maxX = activeTab === 'monthly' ? endOfMonth(currentDate).getDate() : yearlyTrendActivity.length - 1;
    const minY = 1;
    const maxY = 4;

    const getXPos = (val: number) => paddingLeft + ((val - minX) / Math.max(maxX - minX, 1)) * chartWidth;
    const getYPos = (val: number) => height - paddingBottom - ((val - minY) / (maxY - minY)) * chartHeight;

    const renderSegments = (data: {x: number, y: number | null}[], color: string, isDashed: boolean = false) => {
      const segments = [];
      for (let i = 1; i < data.length; i++) {
        const p1 = data[i - 1];
        const p2 = data[i];
        if (p1.y !== null && p2.y !== null) {
          segments.push(
            <line 
              key={`${i}-${color}`}
              x1={getXPos(p1.x)} y1={getYPos(p1.y)}
              x2={getXPos(p2.x)} y2={getYPos(p2.y)}
              stroke={color} strokeWidth={isDashed ? 2 : 3}
              strokeLinecap="round"
              strokeDasharray={isDashed ? "4 2" : "none"}
              className={isDashed ? "opacity-40" : "drop-shadow-sm"}
            />
          );
        }
      }
      return segments;
    };

    const xLabels = activeTab === 'monthly' 
      ? [1, 10, 20, maxX].map(d => ({ pos: getXPos(d), label: `${d}일` }))
      : [0, 2, 4, 6, 8, 10, 11].map(i => ({ pos: getXPos(i), label: yearlyTrendActivity[i].label }));

    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">컨디션</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">운동강도</span>
          </div>
        </div>

        <div className="relative h-40 w-full">
          <div className="absolute left-0 top-0 bottom-[40px] flex flex-col justify-between text-[9px] font-bold text-blue-500/60 pointer-events-none w-8 text-left py-1">
            <span>최상</span><span>좋음</span><span>보통</span><span>나쁨</span>
          </div>
          <div className="absolute right-0 top-0 bottom-[40px] flex flex-col justify-between text-[9px] font-bold text-red-500/60 pointer-events-none w-8 text-right py-1">
            <span>고</span><span style={{ marginBottom: '15%' }}>중</span><span>하</span>
          </div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {[1, 2, 3, 4].map(y => (
              <line key={y} x1={paddingLeft} y1={getYPos(y)} x2={width - paddingRight} y2={getYPos(y)} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e2e8f0" strokeWidth="1" />
            {xLabels.map((xl, i) => (
              <g key={i}>
                <line x1={xl.pos} y1={height - paddingBottom} x2={xl.pos} y2={height - paddingBottom + 4} stroke="#e2e8f0" strokeWidth="1" />
                <text x={xl.pos} y={height - paddingBottom + 14} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#94a3b8">{xl.label}</text>
              </g>
            ))}
            
            {renderSegments(intensityData, "#ef4444", true)}
            {renderSegments(conditionData, "#3b82f6", false)}

            {conditionData.map((d, i) => d.y !== null && (
              <circle key={`c-${i}`} cx={getXPos(d.x)} cy={getYPos(d.y)} r="3.5" fill="white" stroke="#3b82f6" strokeWidth="2" />
            ))}
            {intensityData.map((d, i) => d.y !== null && (
              <circle key={`i-${i}`} cx={getXPos(d.x)} cy={getYPos(d.y)} r="2.5" fill="#ef4444" className="opacity-60" />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    return (
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> 월별 수련일 (최근 6개월)
        </h3>
        <div className="flex h-44 gap-1">
          <div className="w-8 flex flex-col justify-between text-[10px] font-black text-slate-300 pb-8 pt-0">
            <span className="h-0 flex items-center">30</span>
            <span className="h-0 flex items-center">20</span>
            <span className="h-0 flex items-center">10</span>
            <span className="h-0 flex items-center">0</span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-3 px-2 relative border-l border-slate-100">
            <div className="absolute inset-0 pb-8 pointer-events-none">
              {[0, 10, 20, 30].map(val => (
                <div key={val} className="absolute w-full border-t border-slate-50" style={{ bottom: `${(val / 31) * 100}%` }} />
              ))}
            </div>
            {monthlyActivity.map((month, idx) => {
              const heightPercent = (month.count / 31) * 100;
              const isLast = idx === monthlyActivity.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 relative z-10">
                  <div className="w-full relative flex flex-col justify-end h-32">
                    {month.count > 0 && (
                      <div className={`absolute left-1/2 -translate-x-1/2 mb-1 text-[10px] font-black whitespace-nowrap ${isLast ? 'text-blue-700' : 'text-slate-500'}`} style={{ bottom: `${heightPercent}%` }}>
                        {month.count}일
                      </div>
                    )}
                    <div className={`w-full rounded-t-lg transition-all duration-700 shadow-sm ${isLast ? 'bg-blue-600' : 'bg-blue-400 opacity-60'}`} style={{ height: `${heightPercent}%`, minHeight: month.count > 0 ? '4px' : '0px' }} />
                  </div>
                  <span className={`text-[11px] font-bold ${isLast ? 'text-blue-700' : 'text-slate-400'}`}>{month.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300 z-50 fixed inset-0 overflow-hidden">
      <header className="bg-blue-700 text-white px-4 pt-12 pb-2 rounded-b-3xl shadow-lg flex-shrink-0">
        <div className="flex justify-between items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-blue-600 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold">수련 통계</h2>
          </div>
        </div>
        <div className="flex bg-blue-800/50 p-1 rounded-2xl mb-4">
          <button onClick={() => setActiveTab('monthly')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100'}`}>
            {format(currentDate, 'M월', { locale: ko })} 기록
          </button>
          <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100'}`}>
            전체 기록
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {filteredLogs.length === 0 && activeTab === 'monthly' ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="bg-slate-50 p-4 rounded-full"><AlertCircle className="w-12 h-12 text-slate-300" /></div>
            <p className="text-slate-500 font-medium">이 달의 기록이 없습니다.</p>
          </div>
        ) : (
          <>
            {activeTab === 'all' && renderBarChart()}
            
            <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" /> 기술 숙련도 종합 분석
              </h3>
              <div className="flex flex-col gap-6">
                <div className="relative w-48 h-48 mx-auto">
                  {renderPieChart()}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-blue-700">{filteredLogs.length}일</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">총 수련일</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2 px-2">
                  {stats.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getTechColor(index) }} />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> 추세 {activeTab === 'all' ? `(${format(currentDate, 'yyyy년')})` : ''}
              </h3>
              {renderTrendChart()}
            </section>

            {/* 데이터 관리 섹션 추가 */}
            <section className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" /> 데이터 관리
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                기기를 변경하거나 다른 브라우저(엣지, 크롬 등)에서 사용하고 싶을 때 데이터를 백업하고 복원할 수 있습니다.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={exportAllData}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:bg-slate-50"
                >
                  <Download className="w-4 h-4" /> 백업하기
                </button>
                <button 
                  onClick={handleImportClick}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:bg-slate-50"
                >
                  <Upload className="w-4 h-4" /> 불러오기
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </section>
          </>
        )}
      </main>

      <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 sticky bottom-0 flex-shrink-0">
        <button onClick={onClose} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all">닫기</button>
      </footer>
    </div>
  );
};

export default StatisticsView;
