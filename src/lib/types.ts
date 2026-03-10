export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  hasSEND: boolean;
  hasEHCP: boolean;
  ehcpDetails?: string;
  hasAllergies: boolean;
  allergyDetails?: string;
  photoPermission: boolean;
  checkedIn?: boolean;
  checkedOut?: boolean;
  attended: string[];
}

export interface Kid {
  id: string;
  name: string;
  age: number;
  allergies: string;
  checkedIn: boolean;
  checkedOut: boolean;
  attended: string[];
}

export interface Group {
  ageRange: string;
  color?: string;
  kids: Kid[];
  children?: Child[];
}

export interface Session {
  id: string | number;
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
    lunch: { time: string; name?: string };
    areas: Area[];
    rotation: Record<string, string[]>;
  };
}

export type UserRole = 'admin' | 'teacher';
