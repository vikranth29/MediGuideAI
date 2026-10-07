import app as app_module


def test_emergency_route_is_public_and_preserves_existing_content():
    client = app_module.app.test_client()

    response = client.get("/emergency")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Emergency Contacts" in html
    assert 'href="tel:911"' in html
    assert 'href="tel:18002221222"' in html
    assert "Important Emergency Reminder" in html


def test_emergency_route_does_not_require_authentication():
    client = app_module.app.test_client()

    response = client.get("/emergency")

    assert response.status_code != 302
    assert response.status_code != 401
