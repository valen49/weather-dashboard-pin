from datetime import datetime, timezone

from flask import Blueprint, render_template, request

from app.services import get_coordinates, get_country_code, get_forecast, get_weather

main = Blueprint('main', __name__)

@main.route('/')
def index():
    city = request.args.get('city', '').strip()
    country = request.args.get('country', '').strip()
    compare = request.args.get('compare', '').strip()
    location = None
    weather = None
    forecast = None
    compare_location = None
    compare_weather = None

    if city:
        country_code = get_country_code(country) if country else None
        if country and not country_code:
            weather = {"success": False, "country_not_found": True}
        else:
            location = get_coordinates(city, country_code)
            if location is None:
                weather = {"success": False, "not_found": True}
            elif location.get("api_error"):
                location = None
                weather = {"success": False}
            else:
                weather = get_weather(location['latitude'], location['longitude'])
                forecast = get_forecast(location['latitude'], location['longitude'])
    else:
        location = {"name": "Mendoza", "country": "Argentina"}
        weather = get_weather()
        forecast = get_forecast()

    if compare:
        compare_location = get_coordinates(compare)
        if compare_location is None:
            compare_weather = {"success": False, "not_found": True}
        elif compare_location.get("api_error"):
            compare_location = None
            compare_weather = {"success": False}
        else:
            compare_weather = get_weather(compare_location['latitude'], compare_location['longitude'])

    return render_template(
        'index.html',
        weather=weather,
        city=city,
        country=country,
        location=location,
        forecast=forecast,
        compare=compare,
        compare_location=compare_location,
        compare_weather=compare_weather
    )

@main.route('/health')
def health():
    return {'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()}, 200
