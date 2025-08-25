import os
import fastapi

from cells.backend.core.application import Application

FRONTEND_PATH = os.path.join(".", "cells", "frontend")

app = Application.global_instance()

app.set_template(FRONTEND_PATH, "templates")
app.set_static_mount("assets", FRONTEND_PATH, "assets")
app.set_static_mount("js", FRONTEND_PATH, "src")

@app.get("/")
def main(request: fastapi.requests.Request):
    return app.render_template(request, "index.html")

app.register_routes()
