"""Add nullable ownership metadata to the predictions table.

This migration is intentionally explicit and idempotent. Run it once against
the configured SQLite database before deploying code that writes user_id.
"""

import argparse
import os
import sqlite3
from pathlib import Path
from urllib.parse import unquote, urlparse


def database_path_from_uri(uri: str) -> Path:
    parsed = urlparse(uri)
    if parsed.scheme != "sqlite":
        raise ValueError("The prediction ownership migration supports SQLite only.")

    if parsed.netloc:
        path = f"\\\\{parsed.netloc}{parsed.path}"
    else:
        path = unquote(parsed.path)

    if path.startswith("/") and len(path) > 2 and path[2] == ":":
        path = path[1:]

    return Path(path)


def migrate_prediction_user_id(database_path: str | os.PathLike[str]) -> bool:
    """Add predictions.user_id when absent and return whether a change occurred."""
    path = Path(database_path)
    if not path.exists():
        raise FileNotFoundError(f"Database file does not exist: {path}")

    connection = sqlite3.connect(path)
    try:
        table = connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'predictions'"
        ).fetchone()
        if table is None:
            raise RuntimeError("The predictions table does not exist.")

        columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(predictions)").fetchall()
        }
        if "user_id" in columns:
            return False

        connection.execute("ALTER TABLE predictions ADD COLUMN user_id INTEGER")
        connection.commit()
        return True
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def configured_database_path() -> Path:
    uri = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("SQLALCHEMY_DATABASE_URI")
        or f"sqlite:///{Path(__file__).resolve().parent / 'mediguide.db'}"
    )
    return database_path_from_uri(uri)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Add nullable user_id ownership metadata to predictions."
    )
    parser.add_argument(
        "--database",
        type=Path,
        help="SQLite database path. Defaults to the configured application database.",
    )
    args = parser.parse_args()
    database_path = args.database or configured_database_path()
    changed = migrate_prediction_user_id(database_path)
    status = "added" if changed else "already present"
    print(f"predictions.user_id {status}: {database_path}")


if __name__ == "__main__":
    main()
