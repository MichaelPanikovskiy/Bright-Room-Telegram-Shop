from flask import Blueprint, render_template, jsonify
from app.models import Product

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/api/products')
def get_products():
    products = Product.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "price": p.price,
        "image": p.image
    } for p in products])