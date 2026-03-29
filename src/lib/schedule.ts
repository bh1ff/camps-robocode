import { CampData, Area } from './types';

export function getGroupSchedule(data: CampData, groupId: string): { session: string; time: string; area: Area }[] {
  const rotation = data.schedule.rotation[groupId];
  if (!rotation) return [];

  return data.schedule.sessions.map((session, index) => {
    const areaId = rotation[index];
    const area = data.schedule.areas.find(a => a.id === areaId)!;
    return {
      session: session.name,
      time: session.time,
      area
    };
  });
}

export function getAreaSchedule(data: CampData, areaId: string): { session: string; time: string; groups: string[] }[] {
  return data.schedule.sessions.map((session, sessionIndex) => {
    const groups: string[] = [];
    Object.entries(data.schedule.rotation).forEach(([groupId, rotation]) => {
      if (rotation[sessionIndex] === areaId) {
        groups.push(groupId);
      }
    });
    return {
      session: session.name,
      time: session.time,
      groups
    };
  });
}

export function getKidSchedule(data: CampData, kidId: string): { session: string; time: string; area: Area; group: string }[] {
  // Find which group the kid belongs to
  let kidGroup: string | null = null;

  for (const [groupId, group] of Object.entries(data.groups)) {
    if (group.kids.some(k => k.id === kidId)) {
      kidGroup = groupId;
      break;
    }
  }

  if (!kidGroup) return [];

  return getGroupSchedule(data, kidGroup).map(s => ({
    ...s,
    group: kidGroup!
  }));
}

export function getCurrentSession(data: CampData): { session: typeof data.schedule.sessions[0]; index: number } | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  for (let i = 0; i < data.schedule.sessions.length; i++) {
    const session = data.schedule.sessions[i];
    const [start, end] = session.time.split(' - ').map(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    });

    if (currentTime >= start && currentTime < end) {
      return { session, index: i };
    }
  }

  return null;
}

export function getAreaTypeColor(type: string): string {
  switch (type) {
    case 'robotics': return 'bg-blue-500';
    case 'gamedev': return 'bg-green-500';
    case '3dprinting': return 'bg-purple-500';
    case 'game': return 'bg-orange-500';
    case 'mechanical': return 'bg-blue-500';
    case 'electronic': return 'bg-yellow-500';
    case 'physical': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

export function getAreaTypeBgLight(type: string): string {
  switch (type) {
    case 'robotics': return 'bg-blue-100 border-blue-300';
    case 'gamedev': return 'bg-green-100 border-green-300';
    case '3dprinting': return 'bg-purple-100 border-purple-300';
    case 'game': return 'bg-orange-100 border-orange-300';
    case 'mechanical': return 'bg-blue-100 border-blue-400';
    case 'electronic': return 'bg-amber-100 border-amber-400';
    case 'physical': return 'bg-emerald-100 border-emerald-400';
    default: return 'bg-gray-100 border-gray-300';
  }
}
