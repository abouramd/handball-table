import type { Team } from './types';

export const addGoal = (team: Team): Team => ({ ...team, score: team.score + 1 });

/** Score can never go below 0. Returns the same object if nothing changed. */
export const removeGoal = (team: Team): Team =>
  team.score > 0 ? { ...team, score: team.score - 1 } : team;
