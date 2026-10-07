from pathlib import Path

import app as app_module


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONTACT_PAGE = PROJECT_ROOT / "frontend" / "src" / "pages" / "Contact.tsx"
APP_TSX = PROJECT_ROOT / "frontend" / "src" / "App.tsx"


def test_contact_route_remains_public_and_preserves_existing_information():
    client = app_module.app.test_client()

    response = client.get("/contact")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Get in Touch" in html
    assert "mediguideai@project.dev" in html
    assert "github.com/mediguide-ai" in html
    assert "Within 24–48 hours" in html


def test_contact_route_has_no_server_side_post():
    client = app_module.app.test_client()

    response = client.post("/contact")

    assert response.status_code == 405


def test_react_contact_page_is_public_information_only():
    page = CONTACT_PAGE.read_text(encoding="utf-8")
    app_source = APP_TSX.read_text(encoding="utf-8")

    assert 'path="/contact"' in app_source
    assert 'href="mailto:mediguideai@project.dev"' in page
    assert 'href="https://github.com/mediguide-ai"' in page
    assert "Within 24–48 hours" in page
    assert "Message Sent" not in page
    assert "setTimeout" not in page
    assert "fetch(" not in page
    assert "useAuth" not in page
