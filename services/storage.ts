
import { TrainingLog } from '../types';

const STORAGE_KEY = 'judo_training_logs';
const FAVORITES_KEY = 'judo_favorite_techniques';

export const getLogs = (): TrainingLog[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLog = (log: TrainingLog) => {
  const logs = getLogs();
  const existingIndex = logs.findIndex(l => l.date === log.date);
  
  if (existingIndex > -1) {
    logs[existingIndex] = log;
  } else {
    logs.push(log);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const deleteLog = (date: string) => {
  const logs = getLogs();
  const filtered = logs.filter(l => l.date !== date);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getFavorites = (): string[] => {
  const data = localStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveFavorites = (favorites: string[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

// 백업용 데이터 추출
export const exportAllData = () => {
  const logs = getLogs();
  const favorites = getFavorites();
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    logs,
    favorites
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `judo_diary_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 백업 데이터 복원
export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.logs && Array.isArray(data.logs)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.logs));
      if (data.favorites && Array.isArray(data.favorites)) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(data.favorites));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to import data:", e);
    return false;
  }
};

/**
 * Generates dummy training logs for testing purposes
 */
export const seedDummyData = () => {
  const logs: TrainingLog[] = [];
  const startDate = new Date(2025, 5, 1); 
  const endDate = new Date(2026, 0, 31);   
  
  const intensities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const conditions: ('bad' | 'normal' | 'good' | 'great')[] = ['bad', 'normal', 'good', 'great'];
  const techs = [
    "업어치기 (Seoi-nage)", "밭다리후리기 (Osoto-gari)", 
    "안다리후리기 (Ouchi-gari)", "허벅다리걸기 (Uchi-mata)",
    "곁누르기 (Kesa-gatame)", "삼각조르기 (Sankaku-jime)",
    "팔가로누워꺾기 (Ude-hishigi-juji-gatame)", "빗당겨치기 (Tai-otoshi)"
  ];

  let current = new Date(startDate);
  while (current <= endDate) {
    if (Math.random() > 0.6) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const numTechs = Math.floor(Math.random() * 3) + 1;
      const selectedTechs = [...techs]
        .sort(() => 0.5 - Math.random())
        .slice(0, numTechs);

      logs.push({
        id: crypto.randomUUID(),
        date: dateStr,
        techniques: selectedTechs.join(', '),
        notes: "자동 생성된 수련 기록입니다. 기술의 정확한 메카니즘 이해와 반복 연습에 집중했습니다.",
        intensity: intensities[Math.floor(Math.random() * intensities.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)]
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};
