"""PDF invoice generator using ReportLab."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

# Brand colors
PRIMARY = colors.HexColor('#7C3AED')   # Purple
SECONDARY = colors.HexColor('#F59E0B')  # Gold
DARK = colors.HexColor('#1E1B4B')
LIGHT_BG = colors.HexColor('#F5F3FF')
WHITE = colors.white
GRAY = colors.HexColor('#6B7280')
LIGHT_GRAY = colors.HexColor('#E5E7EB')

def generate_invoice_pdf(booking: dict, output_path: str):
    """Generate a styled PDF invoice for a booking."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    elements = []

    # ── Header ──────────────────────────────────────────────────────────────
    inv_num = booking.get("invoice_number") or f"INV-{booking.get('id', 0):04d}"
    header_data = [[
        Paragraph('<font color="#7C3AED" size="20"><b>🚗 CAR RENTALS HYD</b></font>', styles['Normal']),
        Paragraph(f'<font color="#F59E0B" size="11"><b>INVOICE</b></font><br/>'
                  f'<font color="#6B7280" size="9">#{inv_num}</font>',
                  ParagraphStyle('right', alignment=TA_RIGHT))
    ]]
    header_table = Table(header_data, colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('PADDING', (0, 0), (-1, -1), 14),
        ('ROUNDEDCORNERS', [8]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.4*cm))

    # Company address
    addr = Paragraph(
        '<font size="8" color="#6B7280">Hyderabad, Telangana, India | support@carrentalshyd.com | +91-9000000000</font>',
        ParagraphStyle('center', alignment=TA_CENTER)
    )
    elements.append(addr)
    elements.append(HRFlowable(width='100%', thickness=1, color=PRIMARY, spaceAfter=0.3*cm))

    # ── Customer & Booking Info ──────────────────────────────────────────────
    paid_at = booking.get('paid_at', '') or datetime.now().strftime('%Y-%m-%d %H:%M')
    customer_data = [
        ['BILLED TO', '', 'BOOKING DETAILS', ''],
        [
            Paragraph(f'<b>{booking.get("user_name", "Customer")}</b>', styles['Normal']),
            '',
            'Booking ID:',
            Paragraph(f'<b>#{booking.get("id", "")}</b>', styles['Normal'])
        ],
        [
            booking.get('user_email', ''), '', 'Status:',
            Paragraph(f'<font color="#059669"><b>{booking.get("status", "").upper()}</b></font>', styles['Normal'])
        ],
        [booking.get('user_phone', ''), '', 'Payment Date:', paid_at[:10] if paid_at else '-'],
        ['', '', 'Payment Method:', (booking.get('payment_method') or 'N/A').upper()],
        ['', '', 'Transaction ID:', booking.get('transaction_id', 'N/A') or 'N/A'],
    ]

    info_table = Table(customer_data, colWidths=[5.5*cm, 2*cm, 4*cm, 5.5*cm])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, 0), PRIMARY),
        ('TEXTCOLOR', (2, 0), (2, 0), PRIMARY),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('TEXTCOLOR', (2, 1), (2, -1), GRAY),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*cm))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=LIGHT_GRAY, spaceAfter=0.3*cm))

    # ── Vehicle Details ──────────────────────────────────────────────────────
    elements.append(Paragraph('<b><font color="#7C3AED">VEHICLE DETAILS</font></b>', styles['Normal']))
    elements.append(Spacer(1, 0.2*cm))

    vehicle_rows = [
        ['Vehicle', booking.get('vehicle_name', '-')],
        ['Type', f"{booking.get('vehicle_type', '-')} — {booking.get('category', '-').replace('_', ' ').title()}"],
        ['Fuel / Transmission', f"{booking.get('fuel_type', '-')} / {booking.get('transmission', '-')}"],
        ['Pickup Location', f"{booking.get('location_area', '')}, {booking.get('location_city', 'Hyderabad')}"],
        ['Package', booking.get('package_name', 'Custom')],
    ]

    # Format dates
    def fmt_dt(dt_str):
        if not dt_str:
            return '-'
        try:
            return datetime.fromisoformat(dt_str.replace('Z', '')).strftime('%d %b %Y, %I:%M %p')
        except Exception:
            return str(dt_str)[:16]

    vehicle_rows += [
        ['Start Time', fmt_dt(booking.get('start_time', ''))],
        ['End Time', fmt_dt(booking.get('end_time', ''))],
        ['Duration', f"{booking.get('total_hours', 0):.1f} hours"],
    ]

    v_table = Table(vehicle_rows, colWidths=[5*cm, 12*cm])
    v_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), GRAY),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, LIGHT_BG]),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(v_table)
    elements.append(Spacer(1, 0.4*cm))

    # ── Pricing Summary ──────────────────────────────────────────────────────
    elements.append(Paragraph('<b><font color="#7C3AED">PAYMENT SUMMARY</font></b>', styles['Normal']))
    elements.append(Spacer(1, 0.2*cm))

    base = booking.get('base_price', 0) or 0
    discount = booking.get('discount_amount', 0) or 0
    total = booking.get('total_price', 0) or 0
    coupon = booking.get('coupon_code', '') or ''

    pricing_rows = [
        ['Description', 'Amount'],
        ['Base Rental Price', f'₹ {base:,.2f}'],
    ]
    if coupon:
        pricing_rows.append([f'Discount ({coupon})', f'- ₹ {discount:,.2f}'])
    elif discount > 0:
        pricing_rows.append(['Package Discount', f'- ₹ {discount:,.2f}'])

    pricing_rows.append(['', ''])
    pricing_rows.append([
        Paragraph('<b>TOTAL AMOUNT PAID</b>', styles['Normal']),
        Paragraph(f'<b>₹ {total:,.2f}</b>', ParagraphStyle('right_bold', alignment=TA_RIGHT, fontSize=12))
    ])

    p_table = Table(pricing_rows, colWidths=[12*cm, 5*cm])
    p_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, -2), (-1, -2), 1, PRIMARY),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_BG),
        ('ROWBACKGROUNDS', (0, 1), (-1, -3), [WHITE, LIGHT_BG]),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(p_table)
    elements.append(Spacer(1, 0.6*cm))

    # ── Footer ───────────────────────────────────────────────────────────────
    elements.append(HRFlowable(width='100%', thickness=1, color=PRIMARY, spaceBefore=0.2*cm))
    elements.append(Spacer(1, 0.2*cm))
    footer_style = ParagraphStyle('footer', alignment=TA_CENTER, fontSize=8, textColor=GRAY)
    elements.append(Paragraph(
        'Thank you for choosing Car Rentals Hyd! Drive safely. 🚗<br/>'
        'For support: support@carrentalshyd.com | +91-9000000000<br/>'
        '<font size="7">This is a computer-generated invoice. No signature required.</font>',
        footer_style
    ))

    doc.build(elements)
    return output_path
