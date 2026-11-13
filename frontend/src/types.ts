export interface TeamSummary {
  id: string;
  name: string;
  short_name?: string;
  logo: string;
  score: string;
  form: string;
  record?: string;
}

export interface MatchItem {
  id: string;
  league_code: string;
  league_name: string;
  date: string;
  status: 'pre' | 'in' | 'post';
  status_detail: string;
  venue: string;
  home: TeamSummary;
  away: TeamSummary;
}

export interface MatchAnalysisResponse {
  match: {
    id: string;
    league_code: string;
    league_name: string;
    date: string;
    status: string;
    status_detail: string;
    home: TeamSummary & { stats: Record<string, number> };
    away: TeamSummary & { stats: Record<string, number> };
  };
  injuries: { team: string; player: string; status: string }[];
  lineups: { team: string; players: { name: string; position: string; starter: boolean }[] }[];
  h2h: { date: string; score: string }[];
  prediction: {
    expected_goals: { home: number; away: number };
    elo: { home: number; away: number };
    probabilities: {
      home_win: number;
      draw: number;
      away_win: number;
      btts_yes: number;
      over_1_5: number;
      over_2_5: number;
      over_3_5: number;
    };
    exact_scores: { score: string; probability: number }[];
    confidence: { score: number; label: string; simulations: number };
    darija_analysis: {
      verdict: string;
      attack: string;
      defense: string;
      injuries: string;
      scenarios: string[];
    };
  };
}
