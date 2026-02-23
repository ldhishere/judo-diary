
export interface TrainingLog {
  id: string;
  date: string; // YYYY-MM-DD
  techniques: string;
  notes: string;
  intensity: 'low' | 'medium' | 'high';
  condition: 'bad' | 'normal' | 'good' | 'great';
}

export interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  hasLog: boolean;
}
