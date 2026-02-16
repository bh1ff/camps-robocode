import { CampData, Kid } from './types';
import initialData from '@/data/kids.json';

const STORAGE_KEY = 'campData';

export function loadData(): CampData {
  if (typeof window === 'undefined') {
    return initialData as CampData;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as CampData;
    } catch {
      return initialData as CampData;
    }
  }
  return initialData as CampData;
}

export function saveData(data: CampData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function updateKid(kidId: string, updates: Partial<Kid>): CampData {
  const data = loadData();

  for (const [groupId, group] of Object.entries(data.groups)) {
    const kidIndex = group.kids.findIndex(k => k.id === kidId);
    if (kidIndex !== -1) {
      data.groups[groupId].kids[kidIndex] = {
        ...data.groups[groupId].kids[kidIndex],
        ...updates
      };
      break;
    }
  }

  saveData(data);
  return data;
}

export function findKid(kidId: string): { kid: Kid; groupId: string } | null {
  const data = loadData();

  for (const [groupId, group] of Object.entries(data.groups)) {
    const kid = group.kids.find(k => k.id === kidId);
    if (kid) {
      return { kid, groupId };
    }
  }

  return null;
}

export function searchKids(query: string): { kid: Kid; groupId: string }[] {
  const data = loadData();
  const results: { kid: Kid; groupId: string }[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [groupId, group] of Object.entries(data.groups)) {
    for (const kid of group.kids) {
      if (kid.name.toLowerCase().includes(lowerQuery)) {
        results.push({ kid, groupId });
      }
    }
  }

  return results;
}

export function getAllKids(): { kid: Kid; groupId: string }[] {
  const data = loadData();
  const results: { kid: Kid; groupId: string }[] = [];

  for (const [groupId, group] of Object.entries(data.groups)) {
    for (const kid of group.kids) {
      results.push({ kid, groupId });
    }
  }

  return results;
}

export function getGroupKids(groupId: string): Kid[] {
  const data = loadData();
  return data.groups[groupId]?.kids || [];
}

export function checkInKid(kidId: string): CampData {
  return updateKid(kidId, { checkedIn: true });
}

export function checkOutKid(kidId: string): CampData {
  return updateKid(kidId, { checkedOut: true });
}

export function setAllergy(kidId: string, allergies: string): CampData {
  return updateKid(kidId, { allergies });
}

export function markAttended(kidId: string, sessionId: string): CampData {
  const result = findKid(kidId);
  if (!result) return loadData();

  const attended = result.kid.attended.includes(sessionId)
    ? result.kid.attended
    : [...result.kid.attended, sessionId];

  return updateKid(kidId, { attended });
}
