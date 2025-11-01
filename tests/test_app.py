import sys
import copy
from pathlib import Path

# Ensure the src directory is importable as a module location
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import app as app_module
from fastapi.testclient import TestClient


@staticmethod
def _client():
    return TestClient(app_module.app)


import pytest


@pytest.fixture(autouse=True)
def reset_activities():
    # Deep copy the activities dict and restore after each test to keep tests isolated
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(original))


def test_get_activities():
    client = _client()
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Check one expected activity exists and has participants
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_remove_participant():
    client = _client()
    activity = "Chess Club"
    new_email = "test_student@mergington.edu"

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={new_email}")
    assert resp.status_code == 200
    assert new_email in app_module.activities[activity]["participants"]

    # Remove participant
    resp = client.delete(f"/activities/{activity}/participants?email={new_email}")
    assert resp.status_code == 200
    payload = resp.json()
    assert "message" in payload
    assert new_email not in payload.get("participants", [])


def test_remove_nonexistent_participant_returns_404():
    client = _client()
    activity = "Chess Club"
    non_existent = "noone@nowhere.edu"

    resp = client.delete(f"/activities/{activity}/participants?email={non_existent}")
    assert resp.status_code == 404
    data = resp.json()
    assert data.get("detail") == "Participant not found in this activity"
