import os

from django.core.exceptions import ValidationError

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_AUDIO_BYTES = 50 * 1024 * 1024
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def validate_audio_file(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in AUDIO_EXTENSIONS:
        raise ValidationError("فرمت صوتی باید MP3، WAV یا FLAC باشد.")
    if file.size and file.size > MAX_AUDIO_BYTES:
        raise ValidationError("حجم فایل صوتی بیش از ۵۰ مگابایت است.")


def validate_image_file(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in IMAGE_EXTENSIONS:
        raise ValidationError("فرمت تصویر باید JPG، PNG یا WEBP باشد.")
    if file.size and file.size > MAX_IMAGE_BYTES:
        raise ValidationError("حجم تصویر بیش از ۵ مگابایت است.")
