import { TicketBuilder } from "./driver-printer.js";

// Configuración
const MY_PRINTER = '\\\\localhost\\POS-80C';

async function imprimirRecibo() {
    const ticket = new TicketBuilder();

    ticket
        .align('center')
        .textSize('big').text('LA CARNICERIA')
        .textSize('normal').text('RFC: XAXX010101000')
        .feed(1)
        .align('left')
        .text('Fecha: 21/11/2025')
        .text('--------------------------------')
        .textBold('PRODUCTO          TOTAL') // Simulación de tabla simple
        .text('1kg Ribeye        $450.00')
        .text('1 Coca-Cola       $ 25.00')
        .text('--------------------------------')
        .align('right')
        .textSize('big').text('TOTAL: $475.00')
        .textSize('normal')
        .feed(2)
        .align('center')
        .text('Gracias por su compra')
        .cut();

    // 2. Obtener los datos
    const rawData = ticket.getRawData();
    console.log(rawData)
    // 3. Enviar a imprimir
    try {

        console.log('Enviando a impresora...');
        const resultado = await ticket.sendToPrinter(MY_PRINTER);
        console.log('Éxito:', resultado);
    } catch (err) {
        console.error('Fallo la impresión:', err);
    }
}

// Ejecutar
imprimirRecibo();