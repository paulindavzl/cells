import os
import fastapi
import fastapi.staticfiles
import fastapi.templating


class Application(fastapi.FastAPI):
    _instance: "Application" = None
    _template = fastapi.templating.Jinja2Templates("templates")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._routes = []


    def render_template(self, request: fastapi.requests.Request, name: str, context: dict={}, status_code: int=200) -> fastapi.templating.Jinja2Templates:
        """renders an HTML template"""
        return self._template.TemplateResponse(
            name=name, 
            context={"request": request, **context}, 
            status_code=status_code
        )
    
    
    def set_template(self, *paths: str):
        """defines the template path"""
        path = os.path.join(*paths)
        self._template = fastapi.templating.Jinja2Templates(directory=path)


    def set_static_mount(self, name: str, *paths: str):
        """defines the static path"""
        path = os.path.join(*paths)
        self.mount(f"/{name}", fastapi.staticfiles.StaticFiles(directory=path), name=name)


    def route(self, *args, **kwargs) -> fastapi.APIRouter:
        """creates and registers a new route"""
        route = fastapi.APIRouter(*args, **kwargs)
        self._routes.append(route)
        return route
    

    def register_routes(self):
        for route in self._routes:
            self.include_router(route)
        

    @classmethod
    def global_instance(cls, *args, **kwargs) -> "Application":
        """returns a single, global instance of Application"""
        if cls._instance is None:
            cls._instance = cls(*args, **kwargs)

        return cls._instance

