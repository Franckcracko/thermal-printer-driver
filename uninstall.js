import { Service } from 'node-windows';

const svc = new Service({
  name: 'SERVIDOR DE IMPRESION',
  script: 'C:\\Users\\CARNICERIA\\Documents\\DEVELOPMENT\\printer-driver-pos\\index.js' 
});

// Escuchar el evento "uninstall", que indica que el proceso ha terminado
svc.on('uninstall', function() {
  console.log('¡Desinstalación completa!');
  console.log('El servicio ya no existe en el sistema.');
});

// Ejecutar la desinstalación
svc.uninstall();