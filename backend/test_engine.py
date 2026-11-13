from main import run_prediction_engine

def test_monte_carlo_probabilities_sum_to_100():
    res = run_prediction_engine(
        home_name="الرجاء الرياضي",
        away_name="الوداد الرياضي",
        home_form="WWDWW",
        away_form="WDLWW",
        home_record="10-3-1",
        away_record="9-3-2",
        home_stats={"gf_avg": 1.8, "ga_avg": 0.8},
        away_stats={"gf_avg": 1.5, "ga_avg": 1.0},
        injuries=[],
    )
    probs = res["probabilities"]
    total = probs["home_win"] + probs["draw"] + probs["away_win"]
    assert 99.5 <= total <= 100.5
    assert res["confidence"]["simulations"] == 10_000
    assert len(res["exact_scores"]) == 5
    assert "الموديل" in res["darija_analysis"]["verdict"]
