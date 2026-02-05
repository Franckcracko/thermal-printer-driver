import { exec } from "child_process";
import iconv from "iconv-lite";
import fs from "fs";
import path from "path";
import os from "os"; // 1. Importamos OS

const OPS = {
  INIT: "\x1B\x40", // Inicializar impresora
  CUT: "\x1D\x56\x41\x00", // Cortar papel

  // Alineación
  ALIGN_LEFT: "\x1B\x61\x00",
  ALIGN_CENTER: "\x1B\x61\x01",
  ALIGN_RIGHT: "\x1B\x61\x02",

  // Estilos de texto
  BOLD_ON: "\x1B\x45\x01",
  BOLD_OFF: "\x1B\x45\x00",
  SIZE_NORMAL: "\x1D\x21\x00",
  SIZE_DOUBLE_HEIGHT: "\x1D\x21\x01",
  SIZE_DOUBLE_WIDTH: "\x1D\x21\x10",
  SIZE_DOUBLE_BOTH: "\x1D\x21\x11",
};

export class TicketBuilder {
  constructor() {
    this.buffer = OPS.INIT; // Siempre iniciar con reset
  }

  // Método para alinear: 'left', 'center', 'right'
  align(position) {
    switch (position.toLowerCase()) {
      case "center":
        this.buffer += OPS.ALIGN_CENTER;
        break;
      case "right":
        this.buffer += OPS.ALIGN_RIGHT;
        break;
      default:
        this.buffer += OPS.ALIGN_LEFT;
        break;
    }
    return this; // Retornamos 'this' para encadenar métodos
  }

  // Método para texto simple
  text(content) {
    this.buffer += content + "\n"; // Agregamos salto de línea automático
    return this;
  }

  // Método para texto con estilo (negrita)
  textBold(content) {
    this.buffer += OPS.BOLD_ON + content + OPS.BOLD_OFF + "\n";
    return this;
  }

  // Método para cambiar tamaño
  textSize(size) {
    // 'normal', 'big'
    if (size === "big") this.buffer += OPS.SIZE_DOUBLE_BOTH;
    else this.buffer += OPS.SIZE_NORMAL;
    return this;
  }

  // Método para agregar líneas vacías
  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer += "\n";
    }
    return this;
  }

  // Finalizar ticket
  cut() {
    this.buffer += OPS.CUT;
    return this;
  }

  // Obtener el resultado final para imprimir
  getRawData() {
    return this.buffer;
  }

  getBufferEncoded() {
    // Convertir el string acumulado a Buffer codificado para Windows Latin 1
    // Muchas impresoras usan 'cp850' o 'win1252'
    return iconv.encode(this.buffer, "win1252");
  }

  getPrinters() {
    return new Promise((resolve, reject) => {
      const command =
        'powershell "Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json"';

      exec(command, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        try {
          // PowerShell a veces devuelve un string, a veces array. Normalizamos.
          let printers = JSON.parse(stdout);
          if (!Array.isArray(printers)) printers = [printers];
          resolve(printers);
        } catch (e) {
          // Si falla el parseo, probablemente solo hay una impresora o es texto plano
          resolve([]);
        }
      });
    });
  }

  sendToPrinter(printerName) {
    return new Promise((resolve, reject) => {
      const tmpFilePath = path.join(os.tmpdir(), `printjob_${Date.now()}.tmp`);

      try {
        fs.writeFileSync(tmpFilePath, this.buffer);
      } catch (e) {
        return reject(`Error escribiendo archivo temporal: ${e.message}`);
      }

      // El comando copy /B significa "Binary copy", crucial para impresoras
      const command = `copy /B "${tmpFilePath}" "${printerName}"`;

      exec(command, (error, stdout, stderr) => {
        try {
          if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
        } catch (cleanupErr) {
          console.warn("No se pudo borrar el archivo temporal:", cleanupErr);
        }

        if (error) {
          reject(`Error al enviar a impresora: ${error.message}`);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}
