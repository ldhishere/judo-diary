
import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Dumbbell, Plus, Search, Save, Trash2, Activity, Frown, Meh, Smile, Zap } from 'lucide-react';
import { TrainingLog } from '../types';

interface Props {
  selectedDate: Date;
  selectedLog: TrainingLog | null;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  formData: any;
  setFormData: (v: any) => void;
  onSave: () => void;
  onDelete: () => void;
  onOpenSearch: () => void;
}

const LogDetail: React.FC<Props> = ({
  selectedDate, selectedLog, isEditing, setIsEditing, formData, setFormData, onSave, onDelete, onOpenSearch
}) => {
  const getConditionIcon = (condition: string, className: string = "w-4 h-4") => {
    switch (condition) {
      case 'bad': return <Frown className={className} />;
      // Fix: Changed '偏' to 'Meh' which is imported from lucide-react
      case 'normal': return <Meh className={className} />;
      case 'good': return <Smile className={className} />;
      case 'great': return <Zap className={className} />;
      default: return <Meh className={className} />;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'bad': return '나쁨';
      case 'normal': return '보통';
      case 'good': return '좋음';
      case 'great': return '최상';
      default: return '보통';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'bad': return 'text-red-500 bg-red-50 border-red-100';
      case 'normal': return 'text-slate-500 bg-slate-50 border-slate-100';
      case 'good': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'great': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      {!selectedLog && !isEditing ? (
        <div className="text-center py-8">
          <Dumbbell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">이날의 수련 기록이 없습니다.</p>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 기록 추가
          </button>
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">연습한 기술</label>
            <button 
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div className="flex-1 overflow-hidden">
                {formData.techniques ? (
                  <div className="flex flex-wrap gap-1">
                    {formData.techniques.split(', ').map((tech: string, idx: number) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{tech}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">기술을 검색하여 추가하세요</span>
                )}
              </div>
              <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 ml-2 flex-shrink-0" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">수련 기록</label>
            <textarea 
              rows={3}
              placeholder="기억할 점과 다음 수련에 참고할 점을 적어보세요."
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">강도</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFormData({...formData, intensity: lvl})}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    formData.intensity === lvl 
                      ? lvl === 'high' ? 'bg-red-600 border-red-600 text-white' : lvl === 'medium' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {lvl === 'low' ? '가볍게' : lvl === 'medium' ? '보통' : '고강도'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">컨디션</label>
            <div className="grid grid-cols-4 gap-2">
              {(['bad', 'normal', 'good', 'great'] as const).map((cond) => (
                <button
                  key={cond}
                  onClick={() => setFormData({...formData, condition: cond})}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    formData.condition === cond 
                      ? cond === 'great' ? 'bg-amber-100 border-amber-400 text-amber-700' : cond === 'good' ? 'bg-blue-100 border-blue-400 text-blue-700' : cond === 'normal' ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-red-100 border-red-400 text-red-700'
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {getConditionIcon(cond, "w-5 h-5")}
                  {getConditionLabel(cond)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button onClick={onSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Save className="w-5 h-5" /> 저장
            </button>
            {selectedLog && (
              <button onClick={onDelete} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
              selectedLog?.intensity === 'high' ? 'bg-red-100 text-red-600' : selectedLog?.intensity === 'medium' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <Activity className="w-3 h-3 mr-1" />
              {selectedLog?.intensity === 'low' ? '가벼운 운동' : selectedLog?.intensity === 'medium' ? '적당한 운동' : '고강도 운동'}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${getConditionColor(selectedLog?.condition || 'normal')}`}>
              {getConditionIcon(selectedLog?.condition || 'normal', "w-3 h-3 mr-1")}
              컨디션 {getConditionLabel(selectedLog?.condition || 'normal')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLog?.techniques ? selectedLog.techniques.split(', ').map((tech: string, idx: number) => (
              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">{tech}</span>
            )) : <span className="text-sm text-slate-400 italic">기록된 기술 없음</span>}
          </div>
          {selectedLog?.notes && <div className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">{selectedLog.notes}</div>}
        </div>
      )}
    </div>
  );
};

export default LogDetail;
