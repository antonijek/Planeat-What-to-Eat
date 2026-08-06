import { CalorieDayLog } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "./storage";

const key = STORAGE_KEYS.calorieLog;

export async function getAllLogs(): Promise<CalorieDayLog[]> {
  return (await getItem<CalorieDayLog[]>(key)) ?? [];
}

export async function getDay(dateKey: string): Promise<CalorieDayLog | null> {
  const all = await getAllLogs();
  return all.find((d) => d.dateKey === dateKey) ?? null;
}

export async function saveDay(day: CalorieDayLog): Promise<void> {
  const all = await getAllLogs();
  const idx = all.findIndex((d) => d.dateKey === day.dateKey);
  if (idx >= 0) all[idx] = day;
  else all.push(day);
  // zadrži poslednjih ~180 dana
  await setItem(key, all.sort((a, b) => (a.dateKey > b.dateKey ? -1 : 1)).slice(0, 180));
}
