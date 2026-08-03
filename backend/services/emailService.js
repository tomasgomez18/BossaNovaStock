import nodemailer from 'nodemailer';

const MAX_LINEAS = 8;

export const formatoPesos = (n) =>
  `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pad = (x) => String(x).padStart(2, '0');

const estaConfigurado = () => Boolean(
  process.env.MAIL_USER &&
  process.env.MAIL_PASS &&
  process.env.MAIL_TO
);

const crearTransporter = () => {
  const port = Number(process.env.MAIL_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp-relay.brevo.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const toLocal = (fecha, offset) => new Date(fecha.getTime() - Number(offset) * 60000);

const buildFecha = (fecha, offset) => {
  const l = toLocal(fecha, offset);
  return `${pad(l.getUTCDate())}/${pad(l.getUTCMonth() + 1)}/${l.getUTCFullYear()}`;
};

const buildHora = (fecha, offset) => {
  const l = toLocal(fecha, offset);
  return `${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}`;
};

const getItemsDeVenta = (sale) =>
  (sale.items && sale.items.length > 0
    ? sale.items
    : [{ producto: sale.producto, cantidad: sale.cantidad, talle: sale.talle, precio: sale.precio, subtotal: sale.total }]);

const buildDetalleVentas = (ventas) => {
  if (!ventas || ventas.length === 0) return 'Sin ventas registradas';

  const lineas = [];
  for (const s of ventas) {
    for (const item of getItemsDeVenta(s)) {
      const nombre = item.producto?.nombre || 'Producto eliminado';
      const talle = item.talle ? ` (${item.talle})` : '';
      const subtotal = item.subtotal ?? (item.precio || 0) * item.cantidad;
      lineas.push(`• ${nombre} x${item.cantidad}${talle} — ${formatoPesos(subtotal)} — ${s.empleado || '—'}`);
    }
  }

  if (lineas.length <= MAX_LINEAS) return lineas.join('\n');
  const restantes = lineas.length - MAX_LINEAS;
  return `${lineas.slice(0, MAX_LINEAS).join('\n')}\n(+${restantes} ventas más)`;
};

const buildEmpleados = (ventas) =>
  [...new Set((ventas || []).map((v) => v.empleado).filter(Boolean))].join(', ') || '—';

export const buildDatosCierre = ({ ventas, close, offset = 0 }) => {
  const fecha = buildFecha(close.fecha, offset);
  const hora = buildHora(close.cerradoAt, offset);
  const total = formatoPesos(close.total);
  const unidades = close.cantidad;
  const efectivo = formatoPesos(close.efectivo?.total || 0);
  const transferencia = formatoPesos(close.transferencia?.total || 0);
  const tarjeta = formatoPesos(close.tarjeta?.total || 0);
  const empleados = buildEmpleados(ventas);
  const detalle = buildDetalleVentas(ventas);

  const filas = [
    ['Total', total],
    ['Unidades', unidades],
    ['Efectivo', efectivo],
    ['Transferencia', transferencia],
    ['Tarjeta', tarjeta],
    ['Empleado(s)', empleados],
  ];

  const lineas = detalle.split('\n').filter(Boolean);
  const rowsHtml = lineas
    .map((l) => `<li style="margin:4px 0;">${l.replace(/^•\s*/, '')}</li>`)
    .join('');

  const filasHtml = filas
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#71717a;">${k}</td><td style="padding:6px 0;font-weight:600;">${v}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
      <div style="background:#18181b;color:#fff;padding:16px 20px;">
        <h2 style="margin:0;font-size:18px;">Cierre de caja del ${fecha} a las ${hora}</h2>
      </div>
      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#27272a;">
          ${filasHtml}
        </table>
        <h3 style="margin:20px 0 8px;font-size:14px;color:#71717a;">Ventas del día</h3>
        <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.5;">${rowsHtml}</ul>
      </div>
    </div>`;

  return {
    fecha,
    hora,
    subject: `Cierre de caja del ${fecha}`,
    text:
      `Cierre de caja del ${fecha} a las ${hora}\n` +
      `Total: ${total}\n` +
      `Unidades: ${unidades}\n` +
      `Efectivo: ${efectivo}\n` +
      `Transferencia: ${transferencia}\n` +
      `Tarjeta: ${tarjeta}\n` +
      `Empleado(s): ${empleados}\n\n` +
      `Ventas del día:\n${detalle}`,
    html,
  };
};

const enviarCorreo = async ({ subject, text, html }) => {
  const transporter = crearTransporter();
  await transporter.sendMail({
    from: `"Bossa Nova" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_TO,
    subject,
    text,
    html,
  });
};

export const enviarCierreDeCaja = async ({ ventas, close, offset }) => {
  if (!estaConfigurado()) {
    console.warn('[Mail] No configurado, se omite el envío del cierre.');
    return { enviado: false };
  }

  const datos = buildDatosCierre({ ventas, close, offset });
  await enviarCorreo(datos);
  return { enviado: true };
};

export const enviarMailTest = async ({ offset = 0 } = {}) => {
  if (!estaConfigurado()) {
    throw new Error('Mail no configurado: faltan MAIL_USER / MAIL_PASS / MAIL_TO en el .env');
  }

  const ventas = [{
    items: [{ producto: { nombre: 'Zapatillas Nike' }, cantidad: 2, talle: '38', subtotal: 110000 }],
    empleado: 'Admin',
  }];
  const close = {
    fecha: new Date(),
    cerradoAt: new Date(),
    total: 110000,
    cantidad: 2,
    efectivo: { total: 0, cantidad: 0 },
    transferencia: { total: 0, cantidad: 0 },
    tarjeta: { total: 110000, cantidad: 2 },
  };

  const datos = buildDatosCierre({ ventas, close, offset });
  await enviarCorreo({ ...datos, subject: `[Prueba] ${datos.subject}` });
  return datos;
};