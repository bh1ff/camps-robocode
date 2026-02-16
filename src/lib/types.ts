export interface Kid {
  id: string;
  name: string;
  age: number;
  allergies: string;
  checkedIn: boolean;
  checkedOut: boolean;
  attended: string[]; // session IDs attended
}

export interface Group {
  ageRange: string;
  kids: Kid[];
}

export interface Session {
  id: number;
  time: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  type: 'robotics' | 'gamedev' | '3dprinting' | 'game';
}

export interface CampData {
  groups: Record<string, Group>;
  schedule: {
    sessions: Session[];
    lunch: { time: string; name: string };
    areas: Area[];
    rotation: Record<string, string[]>;
  };
}

export type UserRole = 'admin' | 'teacher';
