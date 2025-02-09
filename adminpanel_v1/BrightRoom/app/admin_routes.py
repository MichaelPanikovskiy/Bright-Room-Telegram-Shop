from flask import Blueprint, render_template, request, redirect
from functools import wraps
from app import db
from app.models import Product, Order

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        telegram_id = request.args.get('tgid')
        user = User.query.filter_by(telegram_id=telegram_id, is_admin=True).first()
        if not user:
            return redirect("/")
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/')
@admin_required
def admin_dashboard():
    products = Product.query.all()
    orders = Order.query.all()
    return render_template("admin.html", products=products, orders=orders)

@admin_bp.route('/add_product', methods=['POST'])
@admin_required
def add_product():
    name = request.form.get("name")
    price = request.form.get("price")
    new_product = Product(name=name, price=price)
    db.session.add(new_product)
    db.session.commit()
    return redirect("/admin")