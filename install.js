import { Service } from 'node-windows';
import path from 'path';

const svc = new Service({
  name: 'SERVIDOR DE IMPRESION',
  description: 'Permite obtener acceso a las impresoras de la red de la computadora',
  // Es mejor usar path.resolve para no fallar con las barras
  script: 'C:\\Users\\CARNICERIA\\Documents\\DEVELOPMENT\\printer-driver-pos\\index.js' 
});

svc.on('install', () => {
  svc.start();
  console.log('¡Servicio instalado con éxito!');
});

svc.install();