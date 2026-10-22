import requests

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

def get_weather_icon(weather_code: int) -> str:
    if weather_code == 0:
        return "☀️"
    elif weather_code in [1, 2, 3]:
        return "⛅"
    elif weather_code in [45, 48]:
        return "🌫️"
    elif weather_code in [51, 53, 55]:
        return "🌦️"
    elif weather_code in [61, 63, 65]:
        return "🌧️"
    elif weather_code in [71, 73, 75]:
        return "❄️"
    elif weather_code in [80, 81, 82]:
        return "🌦️"
    elif weather_code == 95:
        return "⛈️"
    else:
        return "🌡️"

# Constituent countries the geocoder does not list as countries on their own.
COUNTRY_ALIASES = {
    "inglaterra": "GB",
    "england": "GB",
    "escocia": "GB",
    "scotland": "GB",
    "gales": "GB",
    "wales": "GB",
}

def get_country_code(country: str):
    country = country.strip()
    if len(country) == 2 and country.isalpha():
        return country.upper()
    alias = COUNTRY_ALIASES.get(country.lower())
    if alias:
        return alias
    try:
        response = requests.get(
            GEOCODING_URL,
            params={"name": country, "count": 10, "language": "es"},
            timeout=10
        )
        response.raise_for_status()
        for result in response.json().get("results", []):
            if result.get("feature_code", "").startswith("PCL"):
                return result["country_code"]
        return None
    except Exception:
        return None

def get_coordinates(city: str, country_code=None):
    params = {"name": city, "count": 1, "language": "es"}
    if country_code:
        params["countryCode"] = country_code
    try:
        response = requests.get(GEOCODING_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if not data.get("results"):
            return None
        result = data["results"][0]
        return {
            "name": result["name"],
            "country": result["country"],
            "latitude": result["latitude"],
            "longitude": result["longitude"]
        }
    except Exception:
        # Distinct from None (city not found): the API itself failed.
        return {"api_error": True}

def get_weather(latitude=-32.89, longitude=-68.83):
    try:
        response = requests.get(
            WEATHER_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": ["temperature_2m", "wind_speed_10m", "weather_code"],
                "timezone": "auto"
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        current = data["current"]
        return {
            "temperature": current["temperature_2m"],
            "wind_speed": current["wind_speed_10m"],
            "weather_code": current["weather_code"],
            "icon": get_weather_icon(current["weather_code"]),
            "success": True
        }
    except Exception:
        return {
            "temperature": None,
            "wind_speed": None,
            "weather_code": None,
            "icon": "🌡️",
            "success": False
        }

def get_forecast(latitude=-32.89, longitude=-68.83):
    try:
        response = requests.get(
            WEATHER_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": ["temperature_2m_max", "temperature_2m_min", "weather_code"],
                "timezone": "auto",
                "forecast_days": 7
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        daily = data["daily"]
        forecast = []
        for i in range(7):
            forecast.append({
                "date": daily["time"][i],
                "temp_max": daily["temperature_2m_max"][i],
                "temp_min": daily["temperature_2m_min"][i],
                "weather_code": daily["weather_code"][i],
                "icon": get_weather_icon(daily["weather_code"][i]),
            })
        return {"days": forecast, "success": True}
    except Exception:
        return {"days": [], "success": False}