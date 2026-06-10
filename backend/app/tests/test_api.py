from fastapi.testclient import TestClient


def signup(client: TestClient, email: str = "ada@example.com", password: str = "password123"):
    return client.post("/auth/signup", json={"email": email, "password": password})


def create_task(client: TestClient, title: str, **overrides):
    payload = {
        "title": title,
        "description": "A task created by the test suite",
        "status": "todo",
        "priority": "medium",
        "due_date": "2026-07-01T12:00:00Z",
    }
    payload.update(overrides)
    return client.post("/tasks", json=payload)


def test_signup_login_and_me_roundtrip(client: TestClient) -> None:
    signup_response = signup(client)
    assert signup_response.status_code == 201
    assert signup_response.json()["user"]["email"] == "ada@example.com"
    assert "access_token" in signup_response.cookies

    logout_response = client.post("/auth/logout")
    assert logout_response.status_code == 204
    assert client.get("/auth/me").status_code == 401

    login_response = client.post(
        "/auth/login",
        json={"email": "ada@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200

    me_response = client.get("/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["user"]["email"] == "ada@example.com"


def test_unauthorized_session_check_includes_production_cors_header(
    client: TestClient,
) -> None:
    response = client.get(
        "/auth/me",
        headers={"Origin": "https://task-mgmt-app.vercel.app"},
    )

    assert response.status_code == 401
    assert response.headers["access-control-allow-origin"] == (
        "https://task-mgmt-app.vercel.app"
    )


def test_task_routes_are_protected_and_user_scoped(client: TestClient) -> None:
    protected_response = client.get("/tasks")
    assert protected_response.status_code == 401

    signup(client, "owner@example.com")
    task = create_task(client, "Private roadmap").json()
    assert client.get(f"/tasks/{task['id']}").status_code == 200

    client.post("/auth/logout")
    signup(client, "other@example.com")
    forbidden_lookup = client.get(f"/tasks/{task['id']}")
    forbidden_update = client.patch(f"/tasks/{task['id']}", json={"title": "Nope"})

    assert forbidden_lookup.status_code == 404
    assert forbidden_update.status_code == 404


def test_task_list_filters_search_sort_and_pagination_compose(client: TestClient) -> None:
    signup(client)
    create_task(
        client,
        "Write product spec",
        status="todo",
        priority="high",
        due_date="2026-06-20T12:00:00Z",
    )
    create_task(
        client,
        "Polish product UI",
        status="todo",
        priority="medium",
        due_date="2026-06-18T12:00:00Z",
    )
    create_task(
        client,
        "Book dentist",
        status="completed",
        priority="low",
        due_date="2026-06-10T12:00:00Z",
    )

    response = client.get(
        "/tasks",
        params={
            "status": "todo",
            "search": "product",
            "sort": "due_date",
            "order": "asc",
            "page": 1,
            "limit": 1,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["pages"] == 2
    assert len(body["items"]) == 1
    assert body["items"][0]["title"] == "Polish product UI"


def test_validation_errors_use_consistent_shape(client: TestClient) -> None:
    signup(client)
    response = client.post("/tasks", json={"title": "", "priority": "urgent"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_activity_log_records_task_changes(client: TestClient) -> None:
    signup(client)
    task = create_task(client, "Ship assessment").json()

    update_response = client.patch(
        f"/tasks/{task['id']}",
        json={"status": "completed", "priority": "high"},
    )
    assert update_response.status_code == 200

    activity_response = client.get(f"/tasks/{task['id']}/activity")
    assert activity_response.status_code == 200
    activities = activity_response.json()

    assert [activity["action"] for activity in activities] == ["completed", "created"]
    assert activities[0]["changes"]["status"] == {"from": "todo", "to": "completed"}
