/**
 * Registro de entrega de EPI – CLUMTEL PREMIUM, SL
 * Script de envío de certificados. Se instala en la cuenta epis.clumtel@gmail.com.
 *
 * 1) Escribe en DESTINO el correo (o correos, separados por comas) que debe recibir los certificados.
 * 2) Implementar > Nueva implementación > Aplicación web
 *    Ejecutar como: Yo (epis.clumtel@gmail.com) · Quién tiene acceso: Cualquier usuario
 * 3) Copia la URL que termina en /exec y pásala para conectarla a la web.
 */
const DESTINO = "PON_AQUI_EL_CORREO_DESTINO";
const CLAVE = "clumtel-epi-2026";
const REMITENTE = "Registro EPI · CLUMTEL PREMIUM, SL";

function doGet() { return json({ ok: true, servicio: "registro-epi-clumtel" }); }

function doPost(e) {
  try {
    const b = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (b.clave !== CLAVE) return json({ ok: false, error: "Solicitud no autorizada." });
    if (!/@/.test(DESTINO)) return json({ ok: false, error: "No hay correo de destino configurado en el script." });

    const limpia = (s, n) => String(s || "").replace(/[\r\n]+/g, " ").slice(0, n);
    const reEmail = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
    const trabajador = limpia(b.trabajador, 100), dni = limpia(b.dni, 20);
    const hotel = limpia(b.hotel, 150), fecha = limpia(b.fecha, 12);
    if (!trabajador || !dni) return json({ ok: false, error: "Faltan los datos del trabajador/a." });
    const epis = (Array.isArray(b.epis) ? b.epis : []).slice(0, 10).map(x => limpia(x, 200)).filter(String);
    if (!epis.length) return json({ ok: false, error: "No se ha marcado ningún EPI entregado." });

    const bytes = Utilities.base64Decode(String(b.pdfBase64 || ""));
    if (bytes.length < 500) return json({ ok: false, error: "PDF no válido." });
    const nombre = limpia(b.filename, 100).replace(/[^\w.\- ]/g, "_") || "registro-entrega-epi.pdf";
    const pdf = Utilities.newBlob(bytes, "application/pdf", nombre);

    const asunto = "Registro de entrega de EPI – " + trabajador + " – " + fecha + (hotel ? " – " + hotel : "");
    const texto = "Se adjunta el registro de entrega de equipos de protección individual firmado.\n\n" +
      "Empresa: CLUMTEL PREMIUM, SL\nPuesto: Personal de limpieza\n" +
      "Trabajador/a: " + trabajador + " (DNI " + dni + ")\nFecha: " + fecha + "\nHotel / centro: " + (hotel || "-") + "\n\n" +
      "EPI entregados:\n" + epis.map(x => " - " + x).join("\n") + "\n\n" +
      "Mensaje generado automáticamente por la aplicación de registro de EPI. Por favor, no responda a este correo.\n" +
      "Documento cedido por PREVIJOB SL";

    const opciones = { name: REMITENTE, attachments: [pdf] };
    const copia = limpia(b.copia, 120);
    if (copia && reEmail.test(copia)) opciones.cc = copia;
    GmailApp.sendEmail(DESTINO, asunto, texto, opciones);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "Error al enviar: " + (err && err.message || err) });
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecuta esta función una vez desde el editor para conceder permisos de Gmail. */
function autorizar() { GmailApp.getAliases(); }
