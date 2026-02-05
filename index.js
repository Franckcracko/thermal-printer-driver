import express from "express";
import cors from "cors";
import { TicketBuilder } from "./driver-printer.js";
import z from "zod";

const app = express();
const PORT = 3001;

app.use(cors('*'));
app.use(express.json());

app.get("/api/print", async (req, res) => {
  try {
    const ticketBuilder = new TicketBuilder();
    const printers = await ticketBuilder.getPrinters();
    res.json({ success: true, printers });
  } catch (error) {
    console.error("Error obteniendo impresoras:", error);
    res
      .status(500)
      .json({ success: false, error: "No se pudieron obtener las impresoras" });
  }
});

const schema = z.object({
  printerName: z.string(),
  content: z.array(z.tuple([z.string(), z.union([z.string().nullable(), z.number()])])), // [method, value]
});

app.post("/api/print", async (req, res) => {
  const { success, data, error } = schema.safeParse(req.body);

  if (!success) {
    console.log(error)
    return res
      .status(400)
      .json({ success: false, error: error.toString() });
  }

  const { printerName, content } = data;

  console.log(`🖨️ Imprimiendo en: ${printerName}`);

  const ticket = new TicketBuilder();

  content.forEach(([method, value]) => {
    if (typeof ticket[method] === "function") {
      if (value !== null && value !== undefined) {
        ticket[method](value);
      } else {
        ticket[method](); // Ejecutar sin argumentos (ej. cut)
      }
    } else {
      console.warn(`El método ${method} no existe en la clase ticket.`);
    }
  });

  try {
    await ticket.sendToPrinter(`\\\\localhost\\${printerName}`);
    res.json({
      success: true,
      message: "Ticket enviado a la cola de impresión",
    });
  } catch (error) {
    console.error("❌ Error al imprimir:", error);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

app.get("/status", (req, res) => {
  res.send("Servicio de impresión activo 🟢");
});

app.listen(PORT, () => {
  console.log(`Servidor de impresión corriendo en http://localhost:${PORT}`);
});
