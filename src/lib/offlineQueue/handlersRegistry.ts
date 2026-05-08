import { registerOfflineHandler } from './handlers';
import { createMaintenanceRequestHandler } from './handlers/createMaintenanceRequest';
import { markNotificationReadHandler } from './handlers/markNotificationRead';

registerOfflineHandler(createMaintenanceRequestHandler);
registerOfflineHandler(markNotificationReadHandler);
