import pytest
from unittest.mock import patch, MagicMock
from app.services import get_weather, get_coordinates, get_country_code, get_forecast, get_weather_icon

def test_get_weather_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "current": {
            "temperature_2m": 20.0,
            "wind_speed_10m": 10.0,
            "weather_code": 0
        }
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response):
        result = get_weather()

    assert result["success"] == True
    assert result["temperature"] == 20.0
    assert result["wind_speed"] == 10.0
    assert result["icon"] == "☀️"

def test_get_weather_failure():
    with patch("app.services.requests.get", side_effect=Exception("API error")):
        result = get_weather()

    assert result["success"] == False
    assert result["temperature"] is None
    assert result["icon"] == "🌡️"

def test_get_coordinates_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "results": [{
            "name": "Buenos Aires",
            "country": "Argentina",
            "latitude": -34.61,
            "longitude": -58.37
        }]
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response):
        result = get_coordinates("Buenos Aires")

    assert result is not None
    assert result["name"] == "Buenos Aires"
    assert result["latitude"] == -34.61

def test_get_coordinates_not_found():
    mock_response = MagicMock()
    mock_response.json.return_value = {"results": []}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response):
        result = get_coordinates("ciudadinexistente123")

    assert result is None

def test_get_coordinates_failure():
    with patch("app.services.requests.get", side_effect=Exception("error")):
        result = get_coordinates("Buenos Aires")

    assert result == {"api_error": True}

def test_get_coordinates_sends_country_code():
    mock_response = MagicMock()
    mock_response.json.return_value = {"results": []}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response) as mock_get:
        get_coordinates("Londres", "GB")

    assert mock_get.call_args.kwargs["params"]["countryCode"] == "GB"

def test_get_country_code_from_two_letter_code():
    assert get_country_code("gb") == "GB"

def test_get_country_code_from_alias():
    assert get_country_code("Inglaterra") == "GB"

def test_get_country_code_from_api():
    mock_response = MagicMock()
    mock_response.json.return_value = {"results": [
        {"name": "Argentina", "country_code": "MX", "feature_code": "PPL"},
        {"name": "Argentina", "country_code": "AR", "feature_code": "PCLI"},
    ]}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response):
        assert get_country_code("Argentina") == "AR"

def test_get_country_code_not_found():
    mock_response = MagicMock()
    mock_response.json.return_value = {"results": [
        {"name": "Narnia", "country_code": "MX", "feature_code": "PPL"},
    ]}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response):
        assert get_country_code("Narnia") is None

def test_get_forecast_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "daily": {
            "time": ["2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10", "2026-04-11", "2026-04-12", "2026-04-13"],
            "temperature_2m_max": [25.0, 26.0, 24.0, 23.0, 27.0, 28.0, 22.0],
            "temperature_2m_min": [15.0, 16.0, 14.0, 13.0, 17.0, 18.0, 12.0],
            "weather_code": [0, 1, 2, 3, 0, 1, 2]
        }
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.requests.get", return_value=mock_response):
        result = get_forecast()

    assert result["success"] == True
    assert len(result["days"]) == 7
    assert result["days"][0]["temp_max"] == 25.0
    assert result["days"][0]["date"] == "2026-04-07"
    assert result["days"][0]["icon"] == "☀️"

def test_get_forecast_failure():
    with patch("app.services.requests.get", side_effect=Exception("error")):
        result = get_forecast()

    assert result["success"] == False
    assert result["days"] == []

def test_get_weather_icon():
    assert get_weather_icon(0) == "☀️"
    assert get_weather_icon(1) == "⛅"
    assert get_weather_icon(45) == "🌫️"
    assert get_weather_icon(61) == "🌧️"
    assert get_weather_icon(71) == "❄️"
    assert get_weather_icon(95) == "⛈️"
    assert get_weather_icon(999) == "🌡️"