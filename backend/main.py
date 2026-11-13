import time
import math
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kora AI 🇲🇦 API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer"

LEAGUES = {
    "mar.1": {"name": "البطولة الاحترافية المغربية (Botola Pro)", "country": "المغرب"},
    "eng.1": {"name": "الدوري الإنجليزي الممتاز", "country": "إنجلترا"},
    "esp.1": {"name": "الدوري الإسباني (الليغا)", "country": "إسبانيا"},
    "uefa.champions": {"name": "دوري أبطال أوروبا", "country": "أوروبا"},
    "uefa.europa": {"name": "الدوري الأوروبي", "country": "أوروبا"},
    "ita.1": {"name": "الدوري الإيطالي", "country": "إيطاليا"},
    "ger.1": {"name": "الدوري الألماني", "country": "ألمانيا"},
    "fra.1": {"name": "الدوري الفرنسي", "country": "فرنسا"},
    "ksa.1": {"name": "دوري روشن السعودي", "country": "السعودية"},
    "caf.nations": {"name": "كأس إفريقيا / تصفيات CAF", "country": "إفريقيا"},
    "uefa.nations": {"name": "دوري الأمم الأوروبية", "country": "أوروبا"},
    "fifa.worldq.caf": {"name": "تصفيات كأس العالم - إفريقيا", "country": "إفريقيا"},
    "fifa.worldq.uefa": {"name": "تصفيات كأس العالم - أوروبا", "country": "أوروبا"},
    "fifa.friendly": {"name": "مباريات دولية ودية", "country": "دولي"},
}

_CACHE: Dict[str, tuple[float, Any]] = {}

def get_cache(key: str):
    if key in _CACHE:
        expires, val = _CACHE[key]
        if time.time() < expires:
            return val
    return None

def set_cache(key: str, val: Any, ttl: int = 300):
    _CACHE[key] = (time.time() + ttl, val)

async def fetch_espn(client: httpx.AsyncClient, url: str, ttl: int = 180) -> Dict[str, Any]:
    cached = get_cache(url)
    if cached is not None:
        return cached
    resp = await client.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cache(url, data, ttl)
    return data

def parse_form_points(form_str: str) -> float:
    if not form_str:
        return 1.4
    weights = [1.0, 0.9, 0.8, 0.7, 0.6]
    pts_map = {"W": 3.0, "D": 1.0, "L": 0.0}
    total_w, total_p = 0.0, 0.0
    for ch, w in zip(reversed(form_str[-5:]), weights):
        if ch.upper() in pts_map:
            total_p += pts_map[ch.upper()] * w
            total_w += w
    return (total_p / total_w) if total_w > 0 else 1.4

def run_prediction_engine(
    home_name: str,
    away_name: str,
    home_form: str,
    away_form: str,
    home_record: str,
    away_record: str,
    home_stats: Dict[str, float],
    away_stats: Dict[str, float],
    injuries: List[Dict[str, str]],
) -> Dict[str, Any]:
    rng = np.random.default_rng(abs(hash(f"{home_name}-{away_name}")) % (2**32))
    n_sims = 10_000

    h_form_pts = parse_form_points(home_form)
    a_form_pts = parse_form_points(away_form)

    home_elo = 1500.0 + (h_form_pts - 1.4) * 95.0
    away_elo = 1500.0 + (a_form_pts - 1.4) * 95.0

    league_avg = 1.38
    h_att = home_stats.get("gf_avg", 1.45) / league_avg
    a_def = away_stats.get("ga_avg", 1.30) / league_avg
    a_att = away_stats.get("gf_avg", 1.35) / league_avg
    h_def = home_stats.get("ga_avg", 1.25) / league_avg

    elo_diff = (home_elo + 65.0) - away_elo
    elo_mult_h = 10 ** (elo_diff / 850.0)
    elo_mult_a = 10 ** (-elo_diff / 850.0)

    home_inj = sum(1 for i in injuries if i["team"] == home_name)
    away_inj = sum(1 for i in injuries if i["team"] == away_name)

    lambda_h = float(np.clip(league_avg * h_att * a_def * 1.12 * (elo_mult_h ** 0.35) * max(0.85, 1 - 0.03 * home_inj), 0.30, 4.2))
    lambda_a = float(np.clip(league_avg * a_att * h_def * (elo_mult_a ** 0.35) * max(0.85, 1 - 0.03 * away_inj), 0.25, 3.9))

    sim_h = rng.poisson(lambda_h, n_sims)
    sim_a = rng.poisson(lambda_a, n_sims)
    tot = sim_h + sim_a

    p_home = round(float(np.mean(sim_h > sim_a)) * 100, 1)
    p_draw = round(float(np.mean(sim_h == sim_a)) * 100, 1)
    p_away = round(float(np.mean(sim_h < sim_a)) * 100, 1)

    btts_yes = round(float(np.mean((sim_h > 0) & (sim_a > 0))) * 100, 1)
    over_15 = round(float(np.mean(tot > 1.5)) * 100, 1)
    over_25 = round(float(np.mean(tot > 2.5)) * 100, 1)
    over_35 = round(float(np.mean(tot > 3.5)) * 100, 1)

    counts: Dict[str, int] = {}
    for hg, ag in zip(sim_h, sim_a):
        k = f"{min(hg, 5)}-{min(ag, 5)}"
        counts[k] = counts.get(k, 0) + 1

    exact_scores = sorted(
        [{"score": k, "probability": round(v / n_sims * 100, 1)} for k, v in counts.items()],
        key=lambda x: x["probability"],
        reverse=True,
    )[:5]

    probs = [max(p_home / 100, 1e-6), max(p_draw / 100, 1e-6), max(p_away / 100, 1e-6)]
    entropy = -sum(p * math.log(p) for p in probs)
    sharpness = 1.0 - (entropy / math.log(3))
    conf_score = round(min(92.0, max(38.0, (sharpness * 75.0) + 28.0)), 1)
    conf_label = "عالية" if conf_score >= 68 else ("متوسطة" if conf_score >= 48 else "منخفضة")

    if p_home > p_away + 12:
        verdict = f"الموديل الإحصائي كيرجّح فوز {home_name} بنسبة {p_home}%، مستافد من عامل الأرض والجمهور وقوة الفعالية الهجومية (xG متوقع: {lambda_h:.2f})."
    elif p_away > p_home + 12:
        verdict = f"رغم اللعب خارج الديار، {away_name} عندو الأفضلية بنسبة {p_away}% بفضل الفورمة القوية ديالو فالماتشات الأخيرة."
    else:
        verdict = f"ماتش متقارب بزاف وصعيب! الحظوظ متوازنة بين {home_name} ({p_home}%) و {away_name} ({p_away}%)، مع احتمال تعادل كيوصل لـ {p_draw}%."

    stronger_att = home_name if lambda_h >= lambda_a else away_name
    stronger_def = home_name if home_stats.get("ga_avg", 1.3) <= away_stats.get("ga_avg", 1.3) else away_name

    darija_analysis = {
        "verdict": verdict,
        "attack": f"هجوميًا، {stronger_att} كيبان أخطر حسب معدل الأهداف المتوقعة (xG: {lambda_h:.2f} لـ {home_name} مقابل {lambda_a:.2f} لـ {away_name}).",
        "defense": f"دفاعيًا، {stronger_def} أكثر تنظيماً وصلابة بناءً على معدل الأهداف المستقبلة هاد الموسم.",
        "injuries": (
            f"الغيابات المسجلة فالمصدر الرسمي: {', '.join(i['player'] + ' (' + i['team'] + ')' for i in injuries[:4])}."
            if injuries
            else "ما كايناش إصابات أو غيابات مؤكدة منشورة لحد الساعة فالمصدر الرسمي."
        ),
        "scenarios": [
            f"إلى جا هدف مبكر فأول 20 دقيقة، سيناريو Over 2.5 (نسبة {over_25}%) غادي يولي قريب بزاف.",
            f"نسبة تسجيل الفريقين بجوج (BTTS) هي {btts_yes}% بناءً على توازن الهجوم والدفاع.",
            "هاد الأرقام خارجة من 10,000 محاكاة Monte Carlo وما كتعنيش نتيجة مضمونة 100%.",
        ],
    }

    return {
        "expected_goals": {"home": round(lambda_h, 2), "away": round(lambda_a, 2)},
        "elo": {"home": round(home_elo), "away": round(away_elo)},
        "probabilities": {
            "home_win": p_home,
            "draw": p_draw,
            "away_win": p_away,
            "btts_yes": btts_yes,
            "over_1_5": over_15,
            "over_2_5": over_25,
            "over_3_5": over_35,
        },
        "exact_scores": exact_scores,
        "confidence": {"score": conf_score, "label": conf_label, "simulations": n_sims},
        "darija_analysis": darija_analysis,
    }

def normalize_event(ev: Dict[str, Any], league_code: str) -> Dict[str, Any]:
    comp = ev["competitions"][0]
    competitors = comp["competitors"]
    home = next(c for c in competitors if c["homeAway"] == "home")
    away = next(c for c in competitors if c["homeAway"] == "away")

    status_type = ev["status"]["type"]["state"]
    status_detail = ev["status"]["type"].get("shortDetail", "")

    return {
        "id": ev["id"],
        "league_code": league_code,
        "league_name": LEAGUES.get(league_code, {}).get("name", league_code),
        "date": ev["date"],
        "status": status_type,
        "status_detail": status_detail,
        "venue": comp.get("venue", {}).get("fullName", "ملعب غير محدد"),
        "home": {
            "id": home["team"]["id"],
            "name": home["team"]["displayName"],
            "short_name": home["team"].get("shortDisplayName", home["team"]["displayName"]),
            "logo": home["team"].get("logo", ""),
            "score": home.get("score", "0"),
            "form": home.get("form", ""),
            "record": home.get("records", [{}])[0].get("summary", "0-0-0") if home.get("records") else "0-0-0",
        },
        "away": {
            "id": away["team"]["id"],
            "name": away["team"]["displayName"],
            "short_name": away["team"].get("shortDisplayName", away["team"]["displayName"]),
            "logo": away["team"].get("logo", ""),
            "score": away.get("score", "0"),
            "form": away.get("form", ""),
            "record": away.get("records", [{}])[0].get("summary", "0-0-0") if away.get("records") else "0-0-0",
        },
    }

@app.get("/api/leagues")
def get_leagues():
    return [{"code": k, **v} for k, v in LEAGUES.items()]

@app.get("/api/matches")
async def get_matches(
    days: int = Query(default=7, ge=1, le=14),
    league: Optional[str] = Query(default=None),
):
    target_leagues = [league] if (league and league in LEAGUES) else list(LEAGUES.keys())
    seen_ids = set()
    all_matches: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=12.0) as client:
        # 1) Fetch default scoreboard (always returns current/today's active matchday from ESPN server clock)
        default_tasks = [
            fetch_espn(client, f"{ESPN_BASE}/{code}/scoreboard", ttl=120)
            for code in target_leagues
        ]
        results = await asyncio.gather(*default_tasks, return_exceptions=True)

        for code, res in zip(target_leagues, results):
            if isinstance(res, dict):
                for ev in res.get("events", []):
                    if ev["id"] not in seen_ids:
                        seen_ids.add(ev["id"])
                        all_matches.append(normalize_event(ev, code))

        # 2) Also fetch upcoming window relative to ESPN's real calendar date if available
        now = datetime.now(timezone.utc)
        start_str = (now - timedelta(days=1)).strftime("%Y%m%d")
        end_str = (now + timedelta(days=days)).strftime("%Y%m%d")
        date_range = f"{start_str}-{end_str}"

        range_tasks = [
            fetch_espn(client, f"{ESPN_BASE}/{code}/scoreboard?dates={date_range}", ttl=180)
            for code in target_leagues
        ]
        range_results = await asyncio.gather(*range_tasks, return_exceptions=True)

        for code, res in zip(target_leagues, range_results):
            if isinstance(res, dict):
                for ev in res.get("events", []):
                    if ev["id"] not in seen_ids:
                        seen_ids.add(ev["id"])
                        all_matches.append(normalize_event(ev, code))

    all_matches.sort(key=lambda m: m["date"])
    return {"count": len(all_matches), "matches": all_matches}

@app.get("/api/matches/{league_code}/{event_id}")
async def get_match_analysis(league_code: str, event_id: str):
    if league_code not in LEAGUES:
        raise HTTPException(status_code=404, detail="الدوري غير مدعوم")

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            summary = await fetch_espn(client, f"{ESPN_BASE}/{league_code}/summary?event={event_id}", ttl=120)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"تعذر جلب معطيات الماتش: {str(e)}")

    header = summary.get("header", {})
    comp = header.get("competitions", [{}])[0]
    competitors = comp.get("competitors", [])
    if len(competitors) < 2:
        raise HTTPException(status_code=404, detail="معطيات الماتش غير مكتملة")

    home = next(c for c in competitors if c["homeAway"] == "home")
    away = next(c for c in competitors if c["homeAway"] == "away")

    home_name = home["team"]["displayName"]
    away_name = away["team"]["displayName"]

    box_teams = summary.get("boxscore", {}).get("teams", [])
    def extract_stats(team_id: str) -> Dict[str, float]:
        stats = {"gf_avg": 1.45, "ga_avg": 1.25, "possession": 50.0, "shots": 11.0, "shots_on_target": 4.0, "corners": 5.0, "yellow_cards": 2.0}
        for bt in box_teams:
            if bt.get("team", {}).get("id") == team_id:
                for s in bt.get("statistics", []):
                    name = s.get("name", "")
                    try:
                        val = float(str(s.get("displayValue", "0")).replace("%", ""))
                        if name == "possessionPct":
                            stats["possession"] = val
                        elif name == "totalShots":
                            stats["shots"] = val
                        elif name == "shotsOnTarget":
                            stats["shots_on_target"] = val
                        elif name == "wonCorners":
                            stats["corners"] = val
                        elif name == "yellowCards":
                            stats["yellow_cards"] = val
                    except ValueError:
                        pass
        return stats

    h_stats = extract_stats(home["team"]["id"])
    a_stats = extract_stats(away["team"]["id"])

    injuries: List[Dict[str, str]] = []
    for team_inj in summary.get("injuries", []):
        t_name = team_inj.get("team", {}).get("displayName", "")
        for item in team_inj.get("injuries", []):
            injuries.append({
                "team": t_name,
                "player": item.get("athlete", {}).get("displayName", "لاعب غير محدد"),
                "status": item.get("status", "مصاب"),
            })

    rosters = []
    for r in summary.get("rosters", []):
        players = []
        for p in r.get("roster", [])[:11]:
            players.append({
                "name": p.get("athlete", {}).get("displayName", ""),
                "position": p.get("position", {}).get("abbreviation", ""),
                "starter": p.get("starter", False),
            })
        rosters.append({
            "team": r.get("team", {}).get("displayName", ""),
            "players": players,
        })

    h2h = []
    for g in summary.get("headToHeadGames", []):
        for ev in g.get("events", [])[:5]:
            h2h.append({
                "date": ev.get("gameDate", "")[:10],
                "score": ev.get("score", "-"),
            })

    prediction = run_prediction_engine(
        home_name=home_name,
        away_name=away_name,
        home_form=home.get("form", ""),
        away_form=away.get("form", ""),
        home_record=home.get("record", [{}])[0].get("summary", "") if home.get("record") else "",
        away_record=away.get("record", [{}])[0].get("summary", "") if away.get("record") else "",
        home_stats=h_stats,
        away_stats=a_stats,
        injuries=injuries,
    )

    return {
        "match": {
            "id": event_id,
            "league_code": league_code,
            "league_name": LEAGUES[league_code]["name"],
            "date": comp.get("date", ""),
            "status": comp.get("status", {}).get("type", {}).get("state", "pre"),
            "status_detail": comp.get("status", {}).get("type", {}).get("shortDetail", ""),
            "home": {
                "id": home["team"]["id"],
                "name": home_name,
                "logo": home["team"].get("logos", [{}])[0].get("href", ""),
                "score": home.get("score", "0"),
                "form": home.get("form", "غير متوفر"),
                "stats": h_stats,
            },
            "away": {
                "id": away["team"]["id"],
                "name": away_name,
                "logo": away["team"].get("logos", [{}])[0].get("href", ""),
                "score": away.get("score", "0"),
                "form": away.get("form", "غير متوفر"),
                "stats": a_stats,
            },
        },
        "injuries": injuries,
        "lineups": rosters,
        "h2h": h2h,
        "prediction": prediction,
    }