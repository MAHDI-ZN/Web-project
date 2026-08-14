from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    data = response.data
    if isinstance(data, dict) and "detail" in data and "error" not in data:
        response.data = {"error": str(data["detail"])}
    elif isinstance(data, list):
        response.data = {"error": " ".join(str(item) for item in data)}
    elif isinstance(data, dict) and "error" not in data:
        messages = []
        for key, value in data.items():
            if isinstance(value, list):
                messages.append(f"{key}: {' '.join(str(v) for v in value)}")
            else:
                messages.append(f"{key}: {value}")
        response.data = {**data, "error": " ".join(messages) or "خطای اعتبارسنجی"}
    return response
