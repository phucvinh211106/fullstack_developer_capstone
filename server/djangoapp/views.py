
import json
import logging

import requests

from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import CarMake, CarModel


logger = logging.getLogger(__name__)


# ==========================
# LOGIN USER
# ==========================
@csrf_exempt
@require_POST
def login_user(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    username = data.get("userName")
    password = data.get("password")

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required"},
            status=400
        )

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is not None:
        login(request, user)
        return JsonResponse({
            "userName": username,
            "status": "Authenticated"
        })

    return JsonResponse({
        "userName": username,
        "status": "Unauthenticated"
    }, status=401)


# ==========================
# LOGOUT USER
# ==========================
@csrf_exempt
@require_POST
def logout_request(request):
    logout(request)

    return JsonResponse({
        "status": "Logged out"
    })


# ==========================
# GET ALL CAR MAKES AND MODELS
# ==========================
@require_GET
def get_all_car_makes(request):
    car_makes = []

    makes = CarMake.objects.prefetch_related(
        "models"
    ).all()

    for make in makes:
        models_list = []

        for car_model in make.models.all():
            models_list.append({
                "id": car_model.id,
                "name": car_model.name,
                "type": car_model.type,
                "year": car_model.year
            })

        car_makes.append({
            "id": make.id,
            "name": make.name,
            "description": make.description,
            "models": models_list
        })

    return JsonResponse(car_makes, safe=False)


# ==========================
# GET ALL DEALERS
# ==========================
@require_GET
def get_dealerships(request):
    try:
        response = requests.get(
            "http://127.0.0.1:3030/fetchDealers",
            timeout=10
        )
        response.raise_for_status()

        dealers = response.json()

        return JsonResponse({
            "status": 200,
            "dealers": dealers
        })

    except requests.RequestException as error:
        logger.error("Failed to fetch dealers: %s", error)

        return JsonResponse({
            "status": 500,
            "error": "Unable to fetch dealerships"
        }, status=500)


# ==========================
# GET DEALERS BY STATE
# ==========================
@require_GET
def get_dealers_by_state(request, state):
    try:
        if state == "All":
            url = "http://127.0.0.1:3030/fetchDealers"
        else:
            from urllib.parse import quote

            url = (
                "http://127.0.0.1:3030/fetchDealers/"
                + quote(state, safe="")
            )

        response = requests.get(url, timeout=10)
        response.raise_for_status()

        return JsonResponse({
            "status": 200,
            "dealers": response.json()
        })

    except requests.RequestException as error:
        logger.error("Failed to filter dealers: %s", error)
        return JsonResponse({
            "status": 500,
            "error": "Unable to filter dealerships"
        }, status=500)


# ==========================
# GET DEALER DETAILS
# ==========================
@require_GET
def get_dealer_details(request, dealer_id):
    try:
        response = requests.get(
            f"http://127.0.0.1:3030/fetchDealer/{dealer_id}",
            timeout=10
        )
        response.raise_for_status()
        dealer = response.json()

        if not dealer:
            return JsonResponse({
                "status": 404,
                "error": "Dealer not found"
            }, status=404)

        return JsonResponse({
            "status": 200,
            "dealer": [dealer]
        })

    except requests.RequestException as error:
        logger.error("Dealer details error: %s", error)
        return JsonResponse({
            "status": 500,
            "error": "Unable to retrieve dealer"
        }, status=500)


# ==========================
# GET DEALER REVIEWS
# ==========================
@require_GET
def get_dealer_reviews(request, dealer_id):
    try:
        response = requests.get(
            f"http://127.0.0.1:3030/fetchReviews/dealer/{dealer_id}",
            timeout=10
        )
        response.raise_for_status()
        reviews = response.json()

        # Analyze sentiment for each review
        for review in reviews:
            review["sentiment"] = "neutral"

            review_text = review.get("review", "")

            if review_text:
                try:
                    sentiment_response = requests.get(
                        "http://127.0.0.1:5050/analyze/"
                        + requests.utils.quote(
                            review_text, safe=""
                        ),
                        timeout=5
                    )
                    sentiment_response.raise_for_status()

                    review["sentiment"] = (
                        sentiment_response.json()
                        .get("sentiment", "neutral")
                    )
                except (requests.RequestException, ValueError):
                    logger.warning(
                        "Sentiment analysis unavailable"
                    )

        return JsonResponse({
            "status": 200,
            "reviews": reviews
        })

    except requests.RequestException as error:
        logger.error("Dealer reviews error: %s", error)
        return JsonResponse({
            "status": 500,
            "error": "Unable to retrieve reviews"
        }, status=500)


# ==========================
# ADD REVIEW
# ==========================
@csrf_exempt
@require_POST
def add_review(request):
    if not request.user.is_authenticated:
        return JsonResponse({
            "status": 401,
            "error": "Please log in first"
        }, status=401)

    try:
        data = json.loads(request.body)

        review_text = data.get("review", "").strip()
        dealership_id = int(data.get("dealership"))

        if not review_text:
            return JsonResponse({
                "status": 400,
                "error": "Review is required"
            }, status=400)

        review_data = {
            "name": request.user.username,
            "dealership": dealership_id,
            "review": review_text,
            "purchase": data.get("purchase", False),
            "purchase_date": data.get("purchase_date", ""),
            "car_make": data.get("car_make", ""),
            "car_model": data.get("car_model", ""),
            "car_year": int(data.get("car_year"))
        }

        response = requests.post(
            "http://127.0.0.1:3030/insert_review",
            json=review_data,
            timeout=10
        )

        response.raise_for_status()

        return JsonResponse({
            "status": 200,
            "message": "Review added successfully",
            "review": response.json()
        })

    except (ValueError, TypeError, KeyError, json.JSONDecodeError):
        return JsonResponse({
            "status": 400,
            "error": "Invalid review data"
        }, status=400)

    except requests.RequestException as error:
        logger.error("Add review error: %s", error)

        return JsonResponse({
            "status": 500,
            "error": "Unable to save review"
        }, status=500)
