from app import db

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    total = db.Column(db.Float)
    address = db.Column(db.String(200))
    status = db.Column(db.String(20), default='Принят')  # Упрощенный статус